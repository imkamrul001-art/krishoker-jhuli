/**
 * কৃষকের ঝুলি — অর্ডার Google Sheet এ জমা রাখার স্ক্রিপ্ট
 *
 * এই কোডটি Google Sheet এর Extensions → Apps Script এ পেস্ট করে
 * Web app হিসেবে Deploy করুন। ধাপগুলো ORDER-SHEET-SETUP.md ফাইলে আছে।
 */

const SHEET_NAME   = "Orders";   // অর্ডার যে শিটে জমা হবে
const SEND_EMAIL   = true;       // প্রতিটি নতুন অর্ডারে ইমেইল পেতে চাইলে true
const NOTIFY_EMAIL = "";         // খালি রাখলে শিটের মালিকের ইমেইলে যাবে

const HEADERS = [
  "সময়", "অর্ডার নং", "নাম", "মোবাইল", "পণ্য", "মোট কেজি",
  "পণ্যের দাম", "ডেলিভারি চার্জ", "মোট (ডেলিভারিতে)", "এলাকা",
  "ঠিকানা", "পেমেন্ট", "স্ট্যাটাস"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // স্প্যাম বট আটকানো (ফর্মের লুকানো ঘর পূরণ হলে বাদ)
    if (d.website) return json({ ok: true });
    if (!d.orderId || !d.name || !d.phone || !d.items) return json({ ok: false, error: "missing fields" });

    const sh = getSheet();
    sh.appendRow([
      new Date(),
      safe(d.orderId),
      safe(d.name),
      "'" + String(d.phone).replace(/[^0-9]/g, "").slice(0, 15),
      safe(d.items),
      Number(d.kg) || 0,
      Number(d.subtotal) || 0,
      Number(d.delivery) || 0,
      Number(d.total) || 0,
      safe(d.area),
      safe(d.address),
      "ক্যাশ অন ডেলিভারি",
      "নতুন"
    ]);

    if (SEND_EMAIL) {
      const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
      if (to) {
        MailApp.sendEmail(to,
          "🛒 নতুন অর্ডার " + d.orderId + " — ৳" + d.total,
          "নাম: " + d.name + "\nমোবাইল: " + d.phone + "\n\n" + d.items +
          "\n\nএলাকা: " + d.area + "\nঠিকানা: " + d.address +
          "\nমোট (ক্যাশ অন ডেলিভারি): ৳" + d.total);
      }
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ব্রাউজারে লিংক খুললে এটা দেখাবে — চেক করার জন্য
function doGet() {
  return ContentService.createTextOutput("কৃষকের ঝুলি অর্ডার সিস্টেম চালু আছে ✅");
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#5c2f10").setFontColor("#ffffff");
    sh.setFrozenRows(1);
    sh.setColumnWidth(5, 280);
    sh.setColumnWidth(11, 260);
  }
  return sh;
}

// =, +, -, @ দিয়ে শুরু হলে সূত্র হিসেবে না চলে, আর লেখা খুব লম্বা না হয়
function safe(v) {
  let s = String(v == null ? "" : v).slice(0, 1000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
