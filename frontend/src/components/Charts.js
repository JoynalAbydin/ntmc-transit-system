import React from 'react';
import { toBanglaNumber } from '../utils/helpers';

/* কোনো বাইরের library ছাড়া — শুধু SVG ও CSS দিয়ে তৈরি চার্ট */

// শতাংশ লেখা (এক দশমিক: ৩৫.৫%) — টেবিল ও গোল চার্ট দুই জায়গায় একই নিয়ম
export const percentText = (value, total) =>
  total > 0 ? `${toBanglaNumber(((value / total) * 100).toFixed(1))}%` : `${toBanglaNumber(0)}%`;

// অংশের ভেতরের শতাংশের ফন্ট; অংশ এত ছোট হলে (লেখা আঁটে না) লেখা বাদ যায় — টেবিলে শতাংশ থাকে
const PCT_FONT = 9.5;

// ── ডোনাট চার্ট ──────────────────────────────────────────────
// data: [{ label, value, color }]  → অংশের আকার ও শতাংশ এই value থেকে
// centerValue: গোলের মাঝের সংখ্যা (না দিলে data-র যোগফল)
// showPercent: true দিলে প্রতিটি অংশের ভেতরে শতাংশ-লেখা আসে (ডিফল্ট বন্ধ — বর্তমান UI-তে এটি নেই)
export function DonutChart({ data, size = 180, centerLabel = 'মোট', centerValue, showPercent = false }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 70, c = 2 * Math.PI * r;
  let offset = 0;
  const segments = total > 0 ? data.filter(d => d.value > 0).map(d => {
    const len = (d.value / total) * c;
    const ang = (-90 + ((offset + len / 2) / c) * 360) * (Math.PI / 180);   // অংশের মাঝখান
    const seg = { ...d, len, offset, pct: (d.value / total) * 100, x: 100 + r * Math.cos(ang), y: 100 + r * Math.sin(ang) };
    offset += len;
    return seg;
  }) : [];
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="এলাকা অনুযায়ী ডোনাট চার্ট">
      <circle cx="100" cy="100" r={r} fill="none" stroke="#e5e7eb" strokeWidth="26" />
      {segments.map(g => (
        <circle key={g.label} cx="100" cy="100" r={r} fill="none" stroke={g.color} strokeWidth="26"
          strokeDasharray={`${g.len} ${c - g.len}`} strokeDashoffset={-g.offset}
          transform="rotate(-90 100 100)">
          <title>{`${g.label}: ${toBanglaNumber(g.value)} (${percentText(g.value, total)})`}</title>
        </circle>
      ))}
      {showPercent && segments.filter(g => g.len >= percentText(g.value, total).length * PCT_FONT * 0.6 + 2).map(g => (
        <text key={`pct-${g.label}`} x={g.x} y={g.y} textAnchor="middle" dominantBaseline="central"
          fontSize={PCT_FONT} fontWeight="700" fill="#ffffff" style={{ pointerEvents: 'none' }}>
          {percentText(g.value, total)}
        </text>
      ))}
      <text x="100" y="97" textAnchor="middle" fontSize="13" fill="#6b7280">{centerLabel}</text>
      <text x="100" y="122" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1e3a5f">{toBanglaNumber(centerValue ?? total)}</text>
    </svg>
  );
}

// ── আনুভূমিক বার তালিকা ──────────────────────────────────────
// items: [{ label, value, color, sub? }]
export function BarList({ items, unit = '' }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <div className="space-y-3">
      {items.map(i => (
        <div key={i.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-sm font-medium text-gray-700 truncate" title={i.label}>{i.label}</span>
            <span className="text-sm font-bold flex-shrink-0" style={{ color: i.color }}>
              {toBanglaNumber(i.value)}{unit}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(i.value / max) * 100}%`, backgroundColor: i.color }} />
          </div>
          {i.sub && <div className="text-xs text-gray-400 mt-0.5">{i.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── কলাম চার্ট (মাস অনুযায়ী) ────────────────────────────────
// items: [{ label, value }]
export function ColumnChart({ items, color = '#1e3a5f', height = 180 }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 pt-6 px-1" style={{ height: height + 48, minWidth: items.length * 56 }}>
        {items.map(i => (
          <div key={i.label} className="flex-1 min-w-[44px] flex flex-col items-center justify-end h-full">
            <span className="text-xs font-bold text-gray-700 mb-1">{toBanglaNumber(i.value)}</span>
            <div className="w-full max-w-[40px] rounded-t-lg transition-all duration-500"
              style={{ height: `${(i.value / max) * height}px`, minHeight: i.value > 0 ? 4 : 0, backgroundColor: color }}
              title={`${i.label}: ${toBanglaNumber(i.value)}`} />
            <span className="text-[11px] text-gray-500 mt-1.5 whitespace-nowrap">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
