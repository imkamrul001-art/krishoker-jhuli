// কৃষকের ঝুলি — প্রতিদিন Facebook পেজে একটি পোস্ট
// GitHub Actions থেকে চলে। দরকার: FB_PAGE_TOKEN (secret) আর FB_PAGE_ID (variable)।
import fs from "node:fs";

const SITE = "https://krishoker-jhuli.pages.dev";
const START = Date.UTC(2026, 10, 26);           // প্রথম পোস্টের দিন (২৬ নভেম্বর ২০২৬)
const FOOTER = `🛒 অর্ডার করুন: ${SITE}\n📞 ০১৩৪৫৯৯৮১৭৪ (কল / হোয়াটসঅ্যাপ)\n💵 ক্যাশ অন ডেলিভারি — সারাদেশে হোম ডেলিভারি`;
const TAGS = "#কৃষকের_ঝুলি #খেজুরের_গুড় #খাঁটি_গুড় #পাটালি_গুড় #KrishokerJhuli";

const posts = JSON.parse(fs.readFileSync(new URL("./posts.json", import.meta.url), "utf8"));

// ঢাকার সময় অনুযায়ী আজকের দিন
const dhakaNow = Date.now() + 6 * 3600e3;
const day = Math.floor((dhakaNow - START) / 86400e3);
const forced = process.env.POST_INDEX;            // হাতে চালালে নির্দিষ্ট পোস্ট
const i = forced !== undefined && forced !== "" ? Number(forced) - 1 : ((day % posts.length) + posts.length) % posts.length;
const post = posts[i];
if (!post) { console.error(`পোস্ট নং ${i + 1} নেই`); process.exit(1); }

const message = `${post.text}\n\n${FOOTER}\n\n${TAGS}`;
const imageUrl = `${SITE}/images/social/${post.image}.jpg`;

console.log(`আজকের পোস্ট: ${i + 1}/${posts.length}`);
console.log(`ছবি: ${imageUrl}\n---\n${message}\n---`);

const token = process.env.FB_PAGE_TOKEN;
const pageId = process.env.FB_PAGE_ID;
if (process.env.DRY_RUN === "true" || !token || !pageId) {
  console.log(!token || !pageId ? "⚠️ FB_PAGE_TOKEN বা FB_PAGE_ID নেই — পোস্ট করা হয়নি (শুধু দেখানো হলো)।" : "DRY RUN — পোস্ট করা হয়নি।");
  process.exit(0);
}

const body = new URLSearchParams({ url: imageUrl, caption: message, access_token: token });
const res = await fetch(`https://graph.facebook.com/${pageId}/photos`, { method: "POST", body });
const data = await res.json().catch(() => ({}));
if (!res.ok || data.error) {
  console.error("❌ Facebook এ পোস্ট হয়নি:", JSON.stringify(data.error || data));
  process.exit(1);
}
console.log("✅ পোস্ট হয়েছে:", data.post_id || data.id);
