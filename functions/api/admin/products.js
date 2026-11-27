// GET /api/admin/products — সব পণ্য
// PUT /api/admin/products  {id, price, old_price, available} — দাম/স্টক বদলানো
import { json, bad } from "../../../lib/shared.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY sort").all();
  return json({ ok: true, products: results });
}

export async function onRequestPut({ request, env }) {
  let b; try { b = await request.json(); } catch { return bad("ভুল অনুরোধ"); }
  const price = Math.round(Number(b.price));
  const old = b.old_price === null || b.old_price === "" || b.old_price === undefined ? null : Math.round(Number(b.old_price));
  if (!b.id) return bad("পণ্য দরকার");
  if (!Number.isFinite(price) || price < 1 || price > 100000) return bad("সঠিক দাম দিন");
  if (old !== null && (!Number.isFinite(old) || old < 0 || old > 100000)) return bad("সঠিক কাটা দাম দিন");
  const r = await env.DB.prepare("UPDATE products SET price = ?, old_price = ?, available = ? WHERE id = ?")
    .bind(price, old || null, b.available ? 1 : 0, b.id).run();
  if (!r.meta.changes) return bad("পণ্য পাওয়া যায়নি", 404);
  return json({ ok: true });
}
