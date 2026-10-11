import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { toBanglaNumber } from '../utils/helpers';

// ─── Generic editable row ───
function EditableRow({ value, onSave, onDelete, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const save = async () => {
    if (!val.trim()) return;
    await onSave(val.trim());
    setEditing(false);
  };

  if (editing) return (
    <div className="flex gap-2 items-start">
      {multiline
        ? <textarea value={val} onChange={e => setVal(e.target.value)} rows={3}
            className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none font-[inherit]"
            autoFocus />
        : <input value={val} onChange={e => setVal(e.target.value)}
            className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value); setEditing(false); } }} />
      }
      <button onClick={save} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg transition-all flex-shrink-0">✓ সংরক্ষণ</button>
      <button onClick={() => { setVal(value); setEditing(false); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-2 rounded-lg transition-all flex-shrink-0">বাতিল</button>
    </div>
  );

  return (
    <div className="flex items-start justify-between gap-2 group">
      <span className={`text-sm text-gray-700 ${multiline ? 'whitespace-pre-line leading-relaxed' : ''} flex-1 min-w-0`}>
        {value}
      </span>
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)}
          className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-lg transition-all">✎ সম্পাদন</button>
        <button onClick={onDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-lg transition-all">🗑</button>
      </div>
    </div>
  );
}

// ─── Tab: Letters ───
function LetterTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newVal, setNewVal] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/suggestions/letters/all', { params: { search } });
      setItems(res.data);
    } catch { toast.error('লোড সমস্যা'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newVal.trim()) return;
    try {
      await axios.post('/api/suggestions/letters', { letter_number: newVal.trim() });
      toast.success('যোগ হয়েছে');
      setNewVal(''); setAdding(false); load();
    } catch(e) { toast.error(e.response?.data?.error || 'সমস্যা হয়েছে'); }
  };

  const handleUpdate = async (id, letter_number) => {
    await axios.put(`/api/suggestions/letters/${id}`, { letter_number });
    toast.success('আপডেট হয়েছে'); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই পত্র নং মুছতে চান?')) return;
    await axios.delete(`/api/suggestions/letters/${id}`);
    toast.success('মুছে ফেলা হয়েছে'); load();
  };

  return (
    <div>
      {/* Search + Add */}
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="🔍 পত্র নং খুঁজুন..." />
        <button onClick={() => setAdding(true)}
          className="bg-[#1e3a5f] hover:bg-[#0f2744] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5">
          ＋ নতুন যোগ
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <label className="block text-sm font-semibold text-blue-800 mb-2">নতুন পত্র নং</label>
          <div className="flex gap-2">
            <input autoFocus value={newVal} onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') handleAdd(); if(e.key==='Escape') setAdding(false); }}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="উদা: এনটিএমসি/১২৩/২০২৫" />
            <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-all">✓ যোগ</button>
            <button onClick={() => { setAdding(false); setNewVal(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-2 rounded-lg transition-all">✕</button>
          </div>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3">মোট: {toBanglaNumber(items.length)} টি পত্র নং</p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner"></div></div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">📬</div>
          <div>কোনো পত্র নং পাওয়া যায়নি</div>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-100 transition-all">
              <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0">{toBanglaNumber(idx+1)}</span>
              <div className="flex-1 min-w-0">
                <EditableRow
                  value={item.letter_number}
                  onSave={v => handleUpdate(item.id, v)}
                  onDelete={() => handleDelete(item.id)}
                />
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg flex-shrink-0">
                ব্যবহার: {toBanglaNumber(item.use_count)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Addresses ───
function AddressTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newVal, setNewVal] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/suggestions/addresses/all', { params: { search } });
      setItems(res.data);
    } catch { toast.error('লোড সমস্যা'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newVal.trim()) return;
    try {
      await axios.post('/api/suggestions/addresses', { address_text: newVal.trim() });
      toast.success('যোগ হয়েছে');
      setNewVal(''); setAdding(false); load();
    } catch(e) { toast.error(e.response?.data?.error || 'সমস্যা হয়েছে'); }
  };

  const handleUpdate = async (id, address_text) => {
    await axios.put(`/api/suggestions/addresses/${id}`, { address_text });
    toast.success('আপডেট হয়েছে'); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই ঠিকানা মুছতে চান?')) return;
    await axios.delete(`/api/suggestions/addresses/${id}`);
    toast.success('মুছে ফেলা হয়েছে'); load();
  };

  return (
    <div>
      {/* Search + Add */}
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="🔍 ঠিকানা খুঁজুন..." />
        <button onClick={() => setAdding(true)}
          className="bg-[#1e3a5f] hover:bg-[#0f2744] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          ＋ নতুন যোগ
        </button>
      </div>

      {adding && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <label className="block text-sm font-semibold text-green-800 mb-2">নতুন ঠিকানা <span className="font-normal text-green-600">(প্রতি লাইনে এক তথ্য)</span></label>
          <textarea autoFocus value={newVal} onChange={e => setNewVal(e.target.value)} rows={4}
            className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200 resize-none font-[inherit] mb-2"
            placeholder={"মহাপরিচালক\nএনটিএমসি\nতেজগাঁও, ঢাকা।"} />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-all">✓ যোগ</button>
            <button onClick={() => { setAdding(false); setNewVal(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-2 rounded-lg transition-all">✕ বাতিল</button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-3">মোট: {toBanglaNumber(items.length)} টি ঠিকানা</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner"></div></div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <div>কোনো ঠিকানা পাওয়া যায়নি</div>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-green-100 transition-all">
              <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0 mt-0.5">{toBanglaNumber(idx+1)}</span>
              <div className="flex-1 min-w-0">
                <EditableRow
                  value={item.address_text}
                  onSave={v => handleUpdate(item.id, v)}
                  onDelete={() => handleDelete(item.id)}
                  multiline={true}
                />
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
                {toBanglaNumber(item.use_count)}x
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function EntryManager() {
  const [tab, setTab] = useState('letters');

  return (
    <div className="fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">✏️ এন্ট্রি সম্পাদন</h1>
        <p className="text-gray-500 text-sm mt-1">পত্র নং ও ঠিকানার সাজেশন তালিকা পরিচালনা করুন</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('letters')}
            className={`flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${tab === 'letters'
                ? 'bg-[#1e3a5f] text-white'
                : 'text-gray-600 hover:bg-gray-50'}`}>
            📬 পত্র নং
          </button>
          <button
            onClick={() => setTab('addresses')}
            className={`flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${tab === 'addresses'
                ? 'bg-[#1e3a5f] text-white'
                : 'text-gray-600 hover:bg-gray-50'}`}>
            📍 ঠিকানা
          </button>
        </div>

        <div className="p-6">
          {tab === 'letters'   && <LetterTab />}
          {tab === 'addresses' && <AddressTab />}
        </div>
      </div>
    </div>
  );
}
