// /api/admin/* — শুধু পাসওয়ার্ড দিয়ে ঢোকা যাবে
import { requireAdmin } from "../../../lib/shared.js";

export async function onRequest(context) {
  return requireAdmin(context) || context.next();
}
