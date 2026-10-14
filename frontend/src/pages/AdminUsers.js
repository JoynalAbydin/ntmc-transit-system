import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { toBanglaNumber, localISODate } from '../utils/helpers';

// section: 'users' | 'backup' (না দিলে দুটোই) — মাই অ্যাডমিনের আলাদা ট্যাবের জন্য
export default function AdminUsers({ section } = {}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'USER', full_name: '' });
  const [pwdForm, setPwdForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [backupLoading, setBackupLoading]   = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await axios.get('/api/backup', { responseType: 'blob' });
      const date = localISODate();
      const url  = URL.createObjectURL(new Blob([res.data], { type:'application/json' }));
      const a    = document.createElement('a');
      a.href = url; a.download = `ntmc-backup-${date}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success('ব্যাকআপ ডাউনলোড সম্পন্ন');
    } catch { toast.error('ব্যাকআপ তৈরিতে সমস্যা'); }
    finally { setBackupLoading(false); }
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('সতর্কতা! রিস্টোর করলে বর্তমান সকল ডেটা মুছে যাবে। নিশ্চিত?')) return;
    setRestoreLoading(true);
    try {
      const text    = await file.text();
      const backup  = JSON.parse(text);
      await axios.post('/api/backup/restore', backup);
      toast.success('রিস্টোর সম্পন্ন হয়েছে');
    } catch { toast.error('রিস্টোরে সমস্যা — ফাইল সঠিক কিনা দেখুন'); }
    finally { setRestoreLoading(false); e.target.value = ''; }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch {
      toast.error('ব্যবহারকারী লোড করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.username || !form.password) { toast.error('নাম ও পাসওয়ার্ড দিন'); return; }
    setSaving(true);
    try {
      await axios.post('/api/users', form);
      toast.success('ব্যবহারকারী তৈরি হয়েছে');
      setShowModal(false);
      setForm({ username: '', password: '', role: 'USER', full_name: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`"${username}" মুছতে চান?`)) return;
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success('মুছে ফেলা হয়েছে');
      fetchUsers();
    } catch {
      toast.error('মুছতে সমস্যা');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await axios.put(`/api/users/${u.id}`, { ...u, is_active: u.is_active ? 0 : 1 });
      toast.success(u.is_active ? 'নিষ্ক্রিয় করা হয়েছে' : 'সক্রিয় করা হয়েছে');
      fetchUsers();
    } catch {
      toast.error('সমস্যা হয়েছে');
    }
  };

  const handleChangePassword = async () => {
    if (!pwdForm.password) { toast.error('নতুন পাসওয়ার্ড দিন'); return; }
    if (pwdForm.password !== pwdForm.confirm) { toast.error('পাসওয়ার্ড মিলছে না'); return; }
    setSaving(true);
    try {
      await axios.put(`/api/users/${showPwdModal}/password`, { password: pwdForm.password });
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে');
      setShowPwdModal(null);
      setPwdForm({ password: '', confirm: '' });
    } catch {
      toast.error('সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      {section !== 'backup' && <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 ব্যবহারকারী ব্যবস্থাপনা</h1>
          <p className="text-gray-500 text-sm mt-1">মোট: {toBanglaNumber(users.length)} জন</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#1e3a5f] hover:bg-[#0f2744] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md flex items-center gap-2"
        >
          <span>➕</span> নতুন ব্যবহারকারী
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ক্রমিক</th>
              <th>ব্যবহারকারী নাম</th>
              <th>পূর্ণ নাম</th>
              <th>ভূমিকা</th>
              <th>অবস্থা</th>
              <th>তৈরির তারিখ</th>
              <th className="text-center">কার্যক্রম</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12"><div className="spinner mx-auto"></div></td></tr>
            ) : users.map((u, idx) => (
              <tr key={u.id}>
                <td className="text-center font-bold text-blue-800">{toBanglaNumber(idx + 1)}</td>
                <td className="font-medium">{u.username}</td>
                <td className="text-gray-600">{u.full_name || '—'}</td>
                <td>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'ADMIN' ? 'অ্যাডমিন' : 'ইউজার'}
                  </span>
                </td>
                <td>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </td>
                <td className="text-gray-500 text-sm">{u.created_at?.split('T')[0]}</td>
                <td>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowPwdModal(u.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
                    >
                      🔑 পাসওয়ার্ড
                    </button>
                    {u.id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${u.is_active ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                        >
                          {u.is_active ? '⛔ নিষ্ক্রিয়' : '✅ সক্রিয়'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
                        >
                          🗑️ মুছুন
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-5">নতুন ব্যবহারকারী তৈরি</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">ব্যবহারকারী নাম *</label>
                <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">পূর্ণ নাম</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="পূর্ণ নাম" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">পাসওয়ার্ড *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="পাসওয়ার্ড" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">ভূমিকা</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="USER">ইউজার (USER)</option>
                  <option value="ADMIN">অ্যাডমিন (ADMIN)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-all">বাতিল</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 bg-[#1e3a5f] hover:bg-[#0f2744] text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-50">
                {saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-5">🔑 পাসওয়ার্ড পরিবর্তন</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">নতুন পাসওয়ার্ড</label>
                <input type="password" value={pwdForm.password} onChange={e => setPwdForm({ ...pwdForm, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">নিশ্চিত করুন</label>
                <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowPwdModal(null); setPwdForm({ password: '', confirm: '' }); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-all">বাতিল</button>
              <button onClick={handleChangePassword} disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-50">
                {saving ? 'পরিবর্তন হচ্ছে...' : 'পরিবর্তন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      </>}

      {/* ── BACKUP & RESTORE ── */}
      {section !== 'users' && (
      <div className={`${section === 'backup' ? '' : 'mt-8 '}bg-white rounded-2xl shadow-sm border border-gray-100 p-6`}>
        <h2 className="text-lg font-bold text-gray-800 mb-1">💾 ব্যাকআপ ও রিস্টোর</h2>
        <p className="text-sm text-gray-500 mb-5">সম্পূর্ণ ডেটাবেস (রেকর্ড, পত্র, ঠিকানা, সাজেশন) JSON ফাইলে ব্যাকআপ করুন</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-2xl">📥</div>
              <div>
                <h3 className="font-semibold text-blue-900">ব্যাকআপ ডাউনলোড</h3>
                <p className="text-xs text-blue-600 mt-0.5">সব ডেটা JSON ফাইলে সেভ হবে</p>
              </div>
            </div>
            <button onClick={handleBackup} disabled={backupLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {backupLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> ডাউনলোড হচ্ছে...</>
                : '⬇️ ব্যাকআপ ডাউনলোড করুন'}
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-2xl">📤</div>
              <div>
                <h3 className="font-semibold text-amber-900">ব্যাকআপ রিস্টোর</h3>
                <p className="text-xs text-amber-600 mt-0.5">⚠️ রিস্টোর করলে বর্তমান ডেটা মুছে যাবে</p>
              </div>
            </div>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={restoreLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {restoreLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> রিস্টোর হচ্ছে...</>
                : '⬆️ ব্যাকআপ ফাইল থেকে রিস্টোর'}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
