// GET   /api/admin/orders?status=new&q=...  — অর্ডারের তালিকা
// PATCH /api/admin/orders  {id, status?, note?} — স্ট্যাটাস/নোট বদলানো
import { json, bad, clip, STATUSES } from "../../../lib/shared.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const q = clip(url.searchParams.get("q"), 60);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 200, 1000);

  const where = [], args = [];
  if (STATUSES.includes(status)) { where.push("status = ?"); args.push(status); }
  if (q) { where.push("(id LIKE ? OR name LIKE ? OR phone LIKE ? OR address LIKE ?)"); args.push(...Array(4).fill(`%${q}%`)); }

  const sql = `SELECT * FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT ?`;
  const { results } = await env.DB.prepare(sql).bind(...args, limit).all();
  return json({ ok: true, orders: results.map(o => ({ ...o, items: JSON.parse(o.items || "[]") })) });
}

export async function onRequestPatch({ request, env }) {
  let b; try { b = await request.json(); } catch { return bad("ভুল অনুরোধ"); }
  if (!b.id) return bad("অর্ডার নং দরকার");
  const sets = [], args = [];
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return bad("ভুল স্ট্যাটাস");
    sets.push("status = ?"); args.push(b.status);
  }
  if (b.note !== undefined) { sets.push("note = ?"); args.push(clip(b.note, 500)); }
  if (!sets.length) return bad("কিছু বদলানো হয়নি");
  sets.push("updated_at = ?"); args.push(new Date().toISOString());
  const r = await env.DB.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).bind(...args, b.id).run();
  if (!r.meta.changes) return bad("অর্ডার পাওয়া যায়নি", 404);
  return json({ ok: true });
}
