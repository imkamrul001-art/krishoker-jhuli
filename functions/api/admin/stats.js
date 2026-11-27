// GET /api/admin/stats — ড্যাশবোর্ডের হিসাব (ঢাকার সময় ধরে)
import { json } from "../../../lib/shared.js";

export async function onRequestGet({ env }) {
  const local = "date(created_at, '+6 hours')";
  const today = `${local} = date('now', '+6 hours')`;
  const month = `strftime('%Y-%m', created_at, '+6 hours') = strftime('%Y-%m', 'now', '+6 hours')`;
  const row = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN ${today} THEN 1 ELSE 0 END)                                   AS today_orders,
      SUM(CASE WHEN ${today} AND status != 'cancelled' THEN total ELSE 0 END)       AS today_amount,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)                               AS pending,
      SUM(CASE WHEN status IN ('confirmed','shipped') THEN 1 ELSE 0 END)            AS in_progress,
      SUM(CASE WHEN ${month} AND status != 'cancelled' THEN 1 ELSE 0 END)           AS month_orders,
      SUM(CASE WHEN ${month} AND status = 'delivered' THEN total ELSE 0 END)        AS month_sales,
      SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END)                     AS total_sales,
      COUNT(*)                                                                      AS all_orders
    FROM orders`).first();

  const { results: rows } = await env.DB.prepare(
    "SELECT items FROM orders WHERE status != 'cancelled'"
  ).all();
  const byProduct = {};
  for (const r of rows) for (const it of JSON.parse(r.items || "[]")) {
    byProduct[it.name] = (byProduct[it.name] || 0) + Number(it.kg || 0);
  }

  const { results: days } = await env.DB.prepare(`
    SELECT ${local} AS day, COUNT(*) AS orders, SUM(total) AS amount
    FROM orders WHERE status != 'cancelled' AND created_at >= datetime('now', '-14 days')
    GROUP BY day ORDER BY day`).all();

  return json({ ok: true, stats: row, byProduct, days });
}
