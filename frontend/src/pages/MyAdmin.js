import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';

const TABS = [
  { key: 'stats',  label: '📊 পরিসংখ্যান' },
  { key: 'users',  label: '👥 ব্যবহারকারী' },
  { key: 'backup', label: '💾 ব্যাকআপ ও রিস্টোর' },
];

// শুধু অ্যাডমিন দেখতে পায় (রুট AdminRoute দিয়ে সুরক্ষিত)
export default function MyAdmin() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'stats';

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">🛡️ মাই অ্যাডমিন</h1>
        <p className="text-gray-500 text-sm mt-1">শুধু অ্যাডমিনের জন্য — পরিসংখ্যান, ব্যবহারকারী ও ব্যাকআপ</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto" role="tablist">
        {TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key}
            onClick={() => setParams({ tab: t.key })}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all
              ${tab === t.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats'  && <AdminStats />}
      {tab === 'users'  && <AdminUsers section="users" />}
      {tab === 'backup' && <AdminUsers section="backup" />}
    </div>
  );
}
