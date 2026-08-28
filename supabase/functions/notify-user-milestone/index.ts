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

  const email = buildNotification(record);
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${resendApiKey}`,
      "Idempotency-Key": `artisan-milestone-${record.id}`,
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

function buildNotification(record: MilestoneRecord) {
  const metadata = record.metadata ?? {};
  const name = stringValue(metadata.full_name) || "Nuevo usuario";
  const userEmail = stringValue(metadata.email) || "Correo no disponible";
  const business = stringValue(metadata.business_name) || "Negocio sin nombre";
  const occurredAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(record.occurred_at));

  const isAhaMoment = record.event_name === "first_sale_created";
  const title = isAhaMoment ? "Un usuario llegó al aha moment" : "Nuevo usuario confirmado";
  const subject = isAhaMoment
    ? `Aha moment en Artisan: ${business}`
    : `Nuevo usuario en Artisan: ${business}`;

  const details = isAhaMoment
    ? [
        ["Venta", stringValue(metadata.sale_id)],
        ["Total", currencyValue(metadata.total)],
        ["Ganancia", currencyValue(metadata.profit)],
        ["Canal", stringValue(metadata.channel)],
        ["Pago", stringValue(metadata.payment)],
        ["Tiempo hasta el aha moment", durationValue(metadata.confirmed_at, record.occurred_at)],
      ]
    : [
        ["Categoría", stringValue(metadata.business_type)],
        ["Confirmación", occurredAt],
      ];

  const rows = [["Usuario", name], ["Correo", userEmail], ["Negocio", business], ...details].filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#66716b;font-size:14px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;color:#17211c;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f6f5;font-family:Inter,Arial,sans-serif;color:#17211c"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#173d2d;border-radius:12px 12px 0 0;padding:24px 28px;color:#fff;font-size:20px;font-weight:700">Artisan</div><div style="background:#fff;border:1px solid #e2e7e4;border-top:0;border-radius:0 0 12px 12px;padding:30px 28px"><p style="margin:0 0 8px;color:#256d4d;font-size:13px;font-weight:700;text-transform:uppercase">${isAhaMoment ? "Activación" : "Registro"}</p><h1 style="margin:0 0 22px;font-size:26px;line-height:1.2">${escapeHtml(title)}</h1><table role="presentation" style="width:100%;border-collapse:collapse">${htmlRows}</table></div></div></body></html>`;
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
