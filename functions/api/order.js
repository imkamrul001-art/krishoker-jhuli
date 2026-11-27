// POST /api/order — ওয়েবসাইট থেকে নতুন অর্ডার (ক্যাশ অন ডেলিভারি)
import { json, bad, cleanPhone, validPhone, clip, newOrderId, AREAS, MAX_KG_PER_ITEM } from "../../lib/shared.js";

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return bad("ভুল অনুরোধ"); }

  if (body.website) return json({ ok: true, orderId: "KJ-0" }); // স্প্যাম বট

  const name = clip(body.name, 80);
  const address = clip(body.address, 300);
  const phone = cleanPhone(body.phone);
  const area = AREAS[String(body.area)];
  if (!name) return bad("নাম লিখুন");
  if (!validPhone(phone)) return bad("সঠিক মোবাইল নম্বর দিন");
  if (!address) return bad("ঠিকানা লিখুন");
  if (!area) return bad("ডেলিভারি এলাকা বেছে নিন");

  // দাম সার্ভার থেকে নেওয়া হয়, ব্রাউজারের দাম বিশ্বাস করা হয় না
  const { results: products } = await env.DB.prepare("SELECT id, name, price, available FROM products").all();
  const byId = Object.fromEntries(products.map(p => [p.id, p]));

  const items = [];
  for (const it of Array.isArray(body.items) ? body.items : []) {
    const p = byId[it?.id];
    const kg = Number(it?.kg);
    if (!p || !Number.isFinite(kg) || kg <= 0) continue;
    if (kg < 1) return bad(`${p.name} সর্বনিম্ন ১ কেজি`);
    if (kg > MAX_KG_PER_ITEM) return bad(`${p.name} একবারে সর্বোচ্চ ${MAX_KG_PER_ITEM} কেজি`);
    if (!p.available) return bad(`${p.name} এখন স্টকে নেই`);
    items.push({ id: p.id, name: p.name, kg, price: p.price, amount: Math.round(p.price * kg) });
  }
  if (!items.length) return bad("অন্তত একটি গুড় বেছে নিন");

  const kg = items.reduce((s, i) => s + i.kg, 0);
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const total = subtotal + area.fee;
  const id = newOrderId();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO orders (id, created_at, name, phone, area, address, items, kg, subtotal, delivery, total, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
  ).bind(id, now, name, phone, area.name, address, JSON.stringify(items), kg, subtotal, area.fee, total, now).run();

  return json({ ok: true, orderId: id, items, subtotal, delivery: area.fee, total });
}
