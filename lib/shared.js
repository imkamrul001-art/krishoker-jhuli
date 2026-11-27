// Cloudflare Pages Functions এর জন্য ছোট সাহায্যকারী ফাংশন

export const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];
export const AREAS = { "70": { name: "ঢাকার ভেতরে", fee: 70 }, "130": { name: "ঢাকার বাইরে", fee: 130 } };
export const MAX_KG_PER_ITEM = 50;

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}

export const bad = (msg, status = 400) => json({ ok: false, error: msg }, status);

// বাংলা অঙ্ক → ইংরেজি, শুধু সংখ্যা রেখে বাংলাদেশি মোবাইল নম্বর ঠিক করা
export function cleanPhone(v) {
  let n = String(v || "").replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d)).replace(/[^0-9]/g, "");
  if (n.startsWith("880")) n = n.slice(2);
  if (n.length === 10 && n.startsWith("1")) n = "0" + n;
  return n;
}
export const validPhone = v => /^01[3-9]\d{8}$/.test(v);

export const clip = (v, max) => String(v ?? "").trim().slice(0, max);

export function newOrderId() {
  const d = new Date(Date.now() + 6 * 3600e3); // ঢাকার তারিখ
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const rnd = crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
  return `KJ${mm}${dd}-${rnd}`;
}

// অ্যাডমিন পাসওয়ার্ড যাচাই (HTTP Basic Auth, ইউজারনেম: admin)
function safeEqual(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export function requireAdmin(context) {
  const pass = context.env.ADMIN_PASSWORD;
  if (!pass) {
    return new Response("অ্যাডমিন পাসওয়ার্ড এখনো সেট করা হয়নি। ADMIN_PASSWORD সেট করুন।", {
      status: 503, headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const h = context.request.headers.get("authorization") || "";
  if (h.startsWith("Basic ")) {
    let decoded = "";
    try { decoded = new TextDecoder().decode(Uint8Array.from(atob(h.slice(6)), c => c.charCodeAt(0))); } catch {}
    const i = decoded.indexOf(":");
    if (i > -1 && decoded.slice(0, i) === "admin" && safeEqual(decoded.slice(i + 1), pass)) return null;
  }
  return new Response("লগইন দরকার", {
    status: 401,
    headers: { "www-authenticate": 'Basic realm="Krishoker Jhuli Admin", charset="UTF-8"', "content-type": "text/plain; charset=utf-8" },
  });
}
