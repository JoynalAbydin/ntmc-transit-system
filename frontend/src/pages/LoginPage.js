import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('ব্যবহারকারী নাম ও পাসওয়ার্ড দিন');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('সফলভাবে লগইন হয়েছে');
      navigate('/');
    } catch (err) {
      toast.error('ভুল ব্যবহারকারী নাম বা পাসওয়ার্ড');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/5"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-2xl shadow-2xl mb-4 transform -rotate-3">
            <span className="text-4xl font-black text-blue-900">এন</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">ট্রানজিট ব্যবস্থাপনা</h1>
          <p className="text-blue-300 text-sm">জাতীয় টেলিযোগাযোগ পর্যবেক্ষণ কেন্দ্র</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">সিস্টেমে প্রবেশ করুন</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">ব্যবহারকারী নাম</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white/10 border border-white/30 text-white placeholder-blue-300/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="আপনার ব্যবহারকারী নাম"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">পাসওয়ার্ড</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/30 text-white placeholder-blue-300/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="আপনার পাসওয়ার্ড"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold rounded-xl py-3.5 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin"></div>
                  লগইন হচ্ছে...
                </span>
              ) : 'লগইন করুন →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">

          </div>
        </div>
      </div>
    </div>
  );
}
