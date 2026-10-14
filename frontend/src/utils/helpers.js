export const toBanglaNumber = (n) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).split('').map(d => banglaDigits[parseInt(d)] !== undefined ? banglaDigits[parseInt(d)] : d).join('');
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// স্থানীয় সময় অনুযায়ী YYYY-MM-DD (toISOString UTC ধরে — বাংলাদেশে ভোর ৬টার আগে আগের দিন দেখাত)
export const localISODate = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const todayString = () => localISODate(new Date());

export const DISTRIBUTION_AREAS = [
  'সেনানিবাস এলাকা',
  'মন্ত্রণালয় এলাকা',
  'সিগন্যাল সেন্টার',
  'অন্যান্য'
];

// ─────────────────────────────────────────────────────────────
// এলাকা অনুযায়ী রং (ড্যাশবোর্ডের row ও পরিসংখ্যানের চার্ট — দুই জায়গায় একই রং)
// নতুন এলাকা যোগ হলে নিজে থেকেই একটি স্থির রং পাবে।
// ─────────────────────────────────────────────────────────────
const AREA_BASE_COLORS = {
  'সেনানিবাস এলাকা':   '#16a34a', // সবুজ
  'মন্ত্রণালয় এলাকা': '#2563eb', // নীল
  'সিগন্যাল সেন্টার':  '#d97706', // কমলা
  'অন্যান্য':           '#7c3aed', // বেগুনি
};
const FALLBACK_COLORS = ['#0891b2', '#db2777', '#65a30d', '#ea580c', '#0d9488', '#9333ea', '#ca8a04', '#e11d48'];

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

export const areaColor = (area) => {
  const name = String(area || '').trim();
  if (AREA_BASE_COLORS[name]) return AREA_BASE_COLORS[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[h % FALLBACK_COLORS.length];
};

// { solid: গাঢ় রং (দাগ/চার্ট), bg: হালকা পটভূমি (row) }
export const areaStyle = (area) => {
  const solid = areaColor(area);
  return { solid, bg: hexToRgba(solid, 0.10) };
};

// ─────────────────────────────────────────────────────────────
// মাস: "2026-10" → "অক্টোবর ২০২৬"
// ─────────────────────────────────────────────────────────────
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
export const formatMonth = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ''));
  if (!m) return String(ym || '');
  return `${BN_MONTHS[Number(m[2]) - 1] || m[2]} ${toBanglaNumber(m[1])}`;
};
// সংক্ষিপ্ত নাম আলাদা তালিকা থেকে — বাংলা যুক্তাক্ষর slice() দিয়ে কাটলে ভেঙে যায়
const BN_MONTHS_SHORT = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
export const formatMonthShort = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ''));
  if (!m) return String(ym || '');
  return `${BN_MONTHS_SHORT[Number(m[2]) - 1] || m[2]} ${toBanglaNumber(m[1].slice(2))}`;
};
