import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DonutChart, BarList, ColumnChart, percentText } from '../components/Charts';
import { toBanglaNumber, areaColor, formatMonth, formatMonthShort, localISODate } from '../utils/helpers';

const iso = localISODate;

const PRESETS = [
  { key: 'all',   label: 'সব সময়',        range: () => ({ from: '', to: '' }) },
  { key: 'month', label: 'এই মাস',         range: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) }; } },
  { key: '30d',   label: 'গত ৩০ দিন',      range: () => { const n = new Date(); return { from: iso(new Date(n.getTime() - 29 * 864e5)), to: iso(n) }; } },
  { key: 'year',  label: 'এই বছর',         range: () => { const n = new Date(); return { from: `${n.getFullYear()}-01-01`, to: iso(n) }; } },
];

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${color}1a` }}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold" style={{ color }}>{toBanglaNumber(value)}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

export default function AdminStats() {
  const [range, setRange]   = useState({ from: '', to: '' });
  const [preset, setPreset] = useState('all');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r) => {
    setLoading(true);
    try {
      const params = {};
      if (r.from) params.from = r.from;
      if (r.to)   params.to   = r.to;
      const res = await axios.get('/api/stats', { params });
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.error || 'পরিসংখ্যান লোড করতে সমস্যা');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const applyPreset = (p) => { setPreset(p.key); setRange(p.range()); };
  const changeDate  = (field, value) => { setPreset('custom'); setRange(r => ({ ...r, [field]: value })); };

  const byArea = data?.by_area || [];
  // গোলের অংশ, বারের দৈর্ঘ্য ও শতাংশ — সব ডেটাবেসের ঠিকানা/ইনভেলাপ সংখ্যা থেকে: এলাকার ঠিকানা ÷ মোট ঠিকানা × ১০০
  const totalAddresses = data?.summary?.addresses || 0;

  return (
    <div className="space-y-6">
      {/* ফিল্টার */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${preset === p.key ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 ml-auto flex-wrap">
          <label className="text-xs text-gray-500">শুরু
            <input type="date" value={range.from} onChange={e => changeDate('from', e.target.value)}
              className="block border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-0.5" />
          </label>
          <label className="text-xs text-gray-500">শেষ
            <input type="date" value={range.to} onChange={e => changeDate('to', e.target.value)}
              className="block border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-0.5" />
          </label>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-center py-16"><div className="spinner mx-auto mb-3"></div><p className="text-gray-400">লোড হচ্ছে...</p></div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard icon="📋" label="ট্রানজিট (প্রকাশিত)" value={data.summary.records}   color="#1e3a5f" />
            <SummaryCard icon="✉️" label="মোট চিঠি"            value={data.summary.letters}   color="#16a34a" />
            <SummaryCard icon="📮" label="মোট ঠিকানা / ইনভেলাপ" value={data.summary.addresses} color="#7c3aed" />
          </div>

          {byArea.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <div className="text-5xl mb-3">📭</div>এই সময়ে কোনো প্রকাশিত রেকর্ড নেই
            </div>
          ) : (
            <>
              <Card title="📍 এলাকা অনুযায়ী চিঠির সংখ্যা" subtitle="কোন এলাকায় কত চিঠি গেছে">
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-center">
                  <div className="flex flex-col items-center gap-3">
                    <DonutChart centerLabel="মোট চিঠি" centerValue={data.summary.addresses}
                      data={byArea.map(a => ({ label: a.area, value: a.addresses, color: areaColor(a.area) }))} />
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                      {byArea.map(a => (
                        <span key={a.area} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: areaColor(a.area) }} />{a.area}
                        </span>
                      ))}
                    </div>
                  </div>
                  <BarList unit=" টি"
                    items={byArea.map(a => ({
                      label: a.area, value: a.addresses, color: areaColor(a.area),
                      sub: `${toBanglaNumber(a.records)} টি ট্রানজিট · ${toBanglaNumber(a.addresses)} টি ঠিকানা`,
                    }))} />
                </div>

                <div className="overflow-x-auto mt-6">
                  <table className="data-table">
                    <thead><tr>
                      <th>এলাকা</th><th className="text-center">ট্রানজিট</th><th className="text-center">চিঠি</th>
                      <th className="text-center">ঠিকানা</th><th className="text-center">চিঠির অংশ</th>
                    </tr></thead>
                    <tbody>
                      {byArea.map(a => (
                        <tr key={a.area}>
                          <td><span className="inline-flex items-center gap-2 font-medium">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: areaColor(a.area) }} />{a.area}</span></td>
                          <td className="text-center">{toBanglaNumber(a.records)}</td>
                          <td className="text-center font-bold">{toBanglaNumber(a.letters)}</td>
                          <td className="text-center">{toBanglaNumber(a.addresses)}</td>
                          <td className="text-center text-gray-500">{percentText(a.addresses, totalAddresses)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-50">
                        <td>মোট</td>
                        <td className="text-center">{toBanglaNumber(data.summary.records)}</td>
                        <td className="text-center">{toBanglaNumber(data.summary.letters)}</td>
                        <td className="text-center">{toBanglaNumber(data.summary.addresses)}</td>
                        <td className="text-center">{percentText(totalAddresses, totalAddresses)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {data.by_month.length > 0 && (
                <Card title="📅 মাস অনুযায়ী চিঠি" subtitle="প্রতি মাসে মোট কতটি চিঠি গেছে">
                  <ColumnChart items={data.by_month.map(m => ({ label: formatMonthShort(m.month), value: m.letters }))} />
                </Card>
              )}

              {data.top_addresses.length > 0 && (
                <Card title="🏢 সর্বাধিক চিঠি গেছে যেসব ঠিকানায়" subtitle="শীর্ষ ১৫টি ঠিকানা">
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead><tr><th className="w-14">#</th><th>ঠিকানা</th><th className="text-center">চিঠি</th><th className="text-center">ইনভেলাপ</th></tr></thead>
                      <tbody>
                        {data.top_addresses.map((a, i) => (
                          <tr key={a.address}>
                            <td className="font-bold text-blue-800">{toBanglaNumber(i + 1)}</td>
                            <td className="whitespace-pre-line">{a.address}</td>
                            <td className="text-center font-bold">{toBanglaNumber(a.letters)}</td>
                            <td className="text-center text-gray-500">{toBanglaNumber(a.envelopes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
          <p className="text-xs text-gray-400 text-center">
            শুধু প্রকাশিত রেকর্ড গণনা হয় (ড্রাফট বাদ){data.range.from || data.range.to
              ? ` · সময়: ${data.range.from ? formatMonth(data.range.from.slice(0, 7)) : 'শুরু'} – ${data.range.to ? formatMonth(data.range.to.slice(0, 7)) : 'আজ'}` : ''}
          </p>
        </>
      )}
    </div>
  );
}
