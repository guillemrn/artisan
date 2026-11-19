import assert from "node:assert/strict";
import test from "node:test";
import { parseSignupSource } from "../src/lib/signup-source.ts";

const now = new Date("2026-11-21T16:00:00.000Z");

test("toma utm_source del QR", () => {
  const s = parseSignupSource(
    "https://artisan.guillermoml.com/login?modo=registro&utm_source=qr",
    "",
    now,
  );
  assert.equal(s?.source, "qr");
  assert.equal(s?.landing_path, "/login");
});

test("usa el referer externo si no hay utm", () => {
  const s = parseSignupSource("https://artisan.guillermoml.com/", "https://www.instagram.com/", now);
  assert.equal(s?.source, "instagram.com");
  assert.equal(s?.medium, "referral");
});

test("ignora navegación interna y visitas directas", () => {
  assert.equal(
    parseSignupSource("https://artisan.guillermoml.com/login", "https://artisan.guillermoml.com/", now),
    null,
  );
  assert.equal(parseSignupSource("https://artisan.guillermoml.com/", "", now), null);
});

test("limpia valores raros", () => {
  const s = parseSignupSource("https://a.com/?utm_source=Evento%20Sábado!", "", now);
  assert.equal(s?.source, "evento-s-bado-");
});
