import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export function LetterNumberInput({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = async (q) => {
    try {
      const res = await axios.get('/api/suggestions/letters', { params: { q } });
      setSuggestions(res.data);
      setOpen(res.data.length > 0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
        onFocus={() => { if (!value) fetchSuggestions(''); }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
        placeholder={placeholder || 'পত্র নম্বর লিখুন...'}
      />
      {open && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onMouseDown={() => { onChange(s.letter_number); setOpen(false); }}>
              {s.letter_number}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AddressTextarea({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = async (q) => {
    try {
      const res = await axios.get('/api/suggestions/addresses', { params: { q } });
      setSuggestions(res.data);
      setOpen(res.data.length > 0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <textarea
        value={value}
        onChange={e => { onChange(e.target.value); const lines = e.target.value.split('\n'); fetchSuggestions(lines[0] || ''); }}
        onFocus={() => { if (!value) fetchSuggestions(''); }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
        rows={3}
        placeholder={placeholder || 'ঠিকানা লিখুন (প্রতি লাইনে এক অংশ)...'}
      />
      {open && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onMouseDown={() => { onChange(s.address_text); setOpen(false); }}>
              {s.address_text.split('\n').slice(0, 2).join(', ')}...
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
