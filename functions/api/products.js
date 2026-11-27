// GET /api/products — ওয়েবসাইটে দাম ও স্টক দেখানোর জন্য
import { json } from "../../lib/shared.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, name, price, old_price, available FROM products ORDER BY sort"
  ).all();
  return json({ ok: true, products: results }, 200, { "cache-control": "public, max-age=60" });
}
