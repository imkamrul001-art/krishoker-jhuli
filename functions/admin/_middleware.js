// /admin পেজ — শুধু পাসওয়ার্ড দিয়ে ঢোকা যাবে
import { requireAdmin } from "../../lib/shared.js";

export async function onRequest(context) {
  const denied = requireAdmin(context);
  if (denied) return denied;
  const res = await context.next();
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "no-store");
  out.headers.set("x-robots-tag", "noindex");
  return out;
}
