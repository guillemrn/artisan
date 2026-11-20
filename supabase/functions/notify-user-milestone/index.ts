import { createClient } from "npm:@supabase/supabase-js@2";

type MilestoneName = "user_confirmed" | "first_product_created" | "first_sale_created";

type MilestoneRecord = {
  id: number;
  user_id: string;
  event_name: MilestoneName;
  occurred_at: string;
  metadata: Record<string, unknown>;
  notification_status: "pending" | "processing" | "sent" | "skipped" | "failed";
};

type WebhookPayload = {
  type: "INSERT";
  table: "user_milestones";
  schema: "public";
  record: MilestoneRecord;
  old_record: null;
};

const jsonHeaders = { "Content-Type": "application/json" };

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const webhookSecret = Deno.env.get("LIFECYCLE_WEBHOOK_SECRET") ?? "";
  const suppliedSecret = request.headers.get("x-artisan-webhook-secret") ?? "";

  if (!webhookSecret || !safeEqual(webhookSecret, suppliedSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = payload.record;
  if (
    payload.type !== "INSERT" ||
    payload.schema !== "public" ||
    payload.table !== "user_milestones" ||
    !record ||
    !isMilestoneName(record.event_name)
  ) {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = requiredEnv("ADMIN_NOTIFICATION_EMAIL");
  const resendApiKey = requiredEnv("RESEND_API_KEY");
  const fromEmail = requiredEnv("RESEND_FROM_EMAIL");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: claimed, error: claimError } = await supabase
    .from("user_milestones")
    .update({ notification_status: "processing", notification_error: null })
    .eq("id", record.id)
    .in("notification_status", ["pending", "failed"])
    .select("id")
    .maybeSingle();

  if (claimError) {
    return Response.json({ error: "Could not claim milestone" }, { status: 500 });
  }

  if (!claimed) {
    return Response.json({ ok: true, duplicate: true });
  }

  if (record.event_name === "first_product_created") {
    await supabase
      .from("user_milestones")
      .update({ notification_status: "skipped" })
      .eq("id", record.id);

    return Response.json({ ok: true, tracked: true, notification: "skipped" });
  }

  // El origen (QR, redes…) y el proveedor se guardan en el hito user_confirmed.
  let signup: Record<string, unknown> = record.metadata ?? {};
  if (record.event_name === "first_sale_created") {
    const { data: confirmed } = await supabase
      .from("user_milestones")
      .select("metadata")
      .eq("user_id", record.user_id)
      .eq("event_name", "user_confirmed")
      .maybeSingle();
    signup = (confirmed?.metadata as Record<string, unknown> | undefined) ?? {};
  }

  const email = buildNotification(record, signup);
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${resendApiKey}`,
      "Idempotency-Key": `grofit-milestone-${record.id}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [adminEmail],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  const resendBody = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    const errorMessage = JSON.stringify(resendBody).slice(0, 1000);
    await supabase
      .from("user_milestones")
      .update({ notification_status: "failed", notification_error: errorMessage })
      .eq("id", record.id);

    return Response.json({ error: "Resend rejected the email" }, { status: 502 });
  }

  await supabase
    .from("user_milestones")
    .update({
      notification_status: "sent",
      notified_at: new Date().toISOString(),
      resend_email_id: typeof resendBody.id === "string" ? resendBody.id : null,
      notification_error: null,
    })
    .eq("id", record.id);

  return Response.json({ ok: true });
});

function isMilestoneName(value: unknown): value is MilestoneName {
  return (
    value === "user_confirmed" ||
    value === "first_product_created" ||
    value === "first_sale_created"
  );
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

function safeEqual(expected: string, supplied: string) {
  const expectedBytes = new TextEncoder().encode(expected);
  const suppliedBytes = new TextEncoder().encode(supplied);
  if (expectedBytes.length !== suppliedBytes.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    mismatch |= expectedBytes[index] ^ suppliedBytes[index];
  }
  return mismatch === 0;
}

const SOURCE_LABELS: Record<string, string> = {
  qr: "QR impreso (evento)",
  redes: "Redes sociales",
  instagram: "Instagram",
  directo: "Directo",
};

function sourceValue(signup: Record<string, unknown>) {
  const source = stringValue(signup.signup_source);
  if (!source) return "";
  const label = SOURCE_LABELS[source] ?? source;
  const campaign = stringValue(signup.signup_campaign);
  return campaign ? `${label} · ${campaign}` : label;
}

function providerValue(signup: Record<string, unknown>) {
  const provider = stringValue(signup.auth_provider);
  if (provider === "google") return "Google";
  if (provider === "email") return "Correo y contraseña";
  return provider;
}

function buildNotification(record: MilestoneRecord, signup: Record<string, unknown>) {
  const metadata = record.metadata ?? {};
  const name =
    stringValue(metadata.full_name) || stringValue(signup.full_name) || "Nuevo usuario";
  const userEmail = stringValue(metadata.email) || stringValue(signup.email) || "Correo no disponible";
  const business =
    stringValue(metadata.business_name) ||
    stringValue(signup.business_name) ||
    "Aún sin nombre de negocio";
  const occurredAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(record.occurred_at));

  const isAhaMoment = record.event_name === "first_sale_created";
  const eyebrow = isAhaMoment ? "Primera venta" : "Nuevo registro";
  const title = isAhaMoment ? "Alguien registró su primera venta" : "Alguien se unió a Grofit";
  const subject = isAhaMoment
    ? `Primera venta en Grofit: ${business}`
    : `Nuevo usuario en Grofit: ${stringValue(metadata.full_name) || userEmail}`;

  const details = isAhaMoment
    ? [
        ["Venta", stringValue(metadata.sale_id)],
        ["Ganancia bruta", currencyValue(metadata.profit)],
        ["Canal", stringValue(metadata.channel)],
        ["Pago", stringValue(metadata.payment)],
        ["Tiempo hasta su primera venta", durationValue(metadata.confirmed_at, record.occurred_at)],
        ["Llegó por", sourceValue(signup)],
        ["Entró con", providerValue(signup)],
      ]
    : [
        ["Qué vende", stringValue(metadata.business_type)],
        ["Llegó por", sourceValue(signup)],
        ["Entró con", providerValue(signup)],
        ["Confirmó", occurredAt],
      ];

  const rows = [["Usuario", name], ["Correo", userEmail], ["Negocio", business], ...details].filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:11px 16px 11px 0;border-bottom:1px solid #edeff2;color:#646b76;font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:11px 0;border-bottom:1px solid #edeff2;color:#111111;font-size:14px;font-weight:700;text-align:right">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const amount = isAhaMoment ? currencyValue(metadata.total) : "";
  const hero = amount
    ? `<p style="margin:18px 0 0;color:#646b76;font-size:13px">Vendió</p><p style="margin:2px 0 0;color:#ff4f00;font-size:44px;font-weight:900;line-height:1;letter-spacing:-1px">${escapeHtml(amount)}</p>`
    : "";

  const logo = `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td valign="bottom" style="padding:0"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="22"><tr><td style="width:14px;height:8px;font-size:0;line-height:0">&nbsp;</td><td style="width:8px;height:8px;background:#ffffff;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="width:14px;height:14px;background:#ff4f00;font-size:0;line-height:0">&nbsp;</td><td style="width:8px;height:14px;font-size:0;line-height:0">&nbsp;</td></tr></table></td><td style="padding-left:8px;color:#ffffff;font-size:21px;font-weight:900;letter-spacing:-0.5px">Grofit</td></tr></table>`;

  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#ecedf0;font-family:Helvetica,Arial,sans-serif;color:#111111"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ecedf0"><tr><td align="center" style="padding:32px 12px 40px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px"><tr><td style="background:#111111;padding:22px 28px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td>${logo}</td><td align="right" style="color:#9aa1ac;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">${eyebrow}</td></tr></table></td></tr><tr><td style="background:#ffffff;padding:30px 28px 26px"><h1 style="margin:0;color:#111111;font-size:26px;font-weight:900;line-height:30px;letter-spacing:-0.5px">${escapeHtml(title)}<span style="color:#ff4f00">.</span></h1>${hero}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;border-top:2px solid #111111;border-collapse:collapse">${htmlRows}</table></td></tr><tr><td style="padding:16px 28px 0;color:#646b76;font-size:12px;line-height:18px">Aviso interno de Grofit · ${escapeHtml(occurredAt)}</td></tr></table></td></tr></table></body></html>`;
  const text = `${title}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}`;

  return { subject, html, text };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function currencyValue(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

function durationValue(startValue: unknown, endValue: unknown) {
  const start = new Date(stringValue(startValue)).getTime();
  const end = new Date(stringValue(endValue)).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "";

  const minutes = Math.round((end - start) / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;

  return `${Math.round(hours / 24)} días`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
