import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import axios from 'axios';
import App from '../App';
import { percentText } from '../components/Charts';
import { areaStyle, areaColor, formatMonth, toBanglaNumber, localISODate, todayString } from '../utils/helpers';

jest.mock('axios', () => {
  const m = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), defaults: { headers: { common: {} } } };
  return { __esModule: true, default: m, ...m };
});

const STATS = {
  range: { from: null, to: null },
  summary: { records: 10, letters: 564, addresses: 930 },
  by_area: [   // ব্যাকএন্ড যে ক্রমে দেয় (চিঠি বেশি আগে)
    { area: 'সেনানিবাস এলাকা',   records: 4, letters: 220, addresses: 375 },
    { area: 'মন্ত্রণালয় এলাকা', records: 3, letters: 190, addresses: 300 },
    { area: 'সিগন্যাল সেন্টার',  records: 2, letters: 100, addresses: 180 },
    { area: 'অন্যান্য',           records: 1, letters: 54,  addresses: 75  },
  ],
  by_month: [{ month: '2026-09', letters: 300 }, { month: '2026-10', letters: 264 }],
  top_addresses: [{ address: 'ঢাকা সেনানিবাস', letters: 5, envelopes: 2 }],
};
const RECORDS = {
  records: [
    { id: 1, serial_number: 'TMS-2026-0001', date: '2026-10-02', distribution_area: 'সেনানিবাস এলাকা', description: 'ক', status: 'published' },
    { id: 2, serial_number: 'TMS-2026-0002', date: '2026-10-03', distribution_area: 'মন্ত্রণালয় এলাকা', description: 'খ', status: 'published' },
  ],
  total: 2,
};

const setup = (role, hash = '#/') => {
  localStorage.setItem('token', 't');
  window.location.hash = hash;
  axios.get.mockImplementation((url) => {
    if (url === '/api/auth/me')  return Promise.resolve({ data: { id: 1, username: 'u', full_name: 'টেস্ট', role } });
    if (url === '/api/records')  return Promise.resolve({ data: RECORDS });
    if (url === '/api/stats')    return Promise.resolve({ data: STATS });
    if (url === '/api/users')    return Promise.resolve({ data: [] });
    return Promise.resolve({ data: {} });
  });
  return render(<App />);
};

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

describe('helpers', () => {
  test('জানা এলাকার রং স্থির, অজানা এলাকারও স্থির রং', () => {
    expect(areaColor('সেনানিবাস এলাকা')).toBe('#16a34a');
    expect(areaColor('নতুন এলাকা')).toBe(areaColor('নতুন এলাকা'));
    expect(areaStyle('মন্ত্রণালয় এলাকা').bg).toMatch(/^rgba\(37, 99, 235, 0\.1\)$/);
  });
  test('তারিখ স্থানীয় সময়ে (UTC-তে সরে যায় না) — TZ=Asia/Dhaka-তেও', () => {
    expect(localISODate(new Date(2026, 9, 1))).toBe('2026-10-01');          // মাসের ১ তারিখ
    expect(localISODate(new Date(2026, 9, 12, 3, 0))).toBe('2026-10-12');   // রাত ৩টা
    const n = new Date(); expect(todayString()).toBe(localISODate(n));
  });
  test('শতাংশ লেখা: এক দশমিক, ০ মোটে ভাগ নয়', () => {
    expect(percentText(375, 930)).toBe('৪০.৩%');
    expect(percentText(1, 2)).toBe('৫০.০%');
    expect(percentText(1, 3)).toBe('৩৩.৩%');
    expect(percentText(0, 0)).toBe('০%');
  });
  test('মাসের নাম বাংলায়', () => { expect(formatMonth('2026-10')).toBe('অক্টোবর ২০২৬'); });
});

describe('ড্যাশবোর্ড', () => {
  test('ট্রানজিট নম্বর দৃশ্যমান, এলাকা অনুযায়ী row-এর রং আলাদা', async () => {
    setup('USER');
    expect(await screen.findByText('TMS-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('TMS-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('ট্রানজিট নং')).toBeInTheDocument();
    const r1 = screen.getByText('TMS-2026-0001').closest('tr');
    const r2 = screen.getByText('TMS-2026-0002').closest('tr');
    expect(r1.style.getPropertyValue('--area-solid')).toBe('#16a34a');
    expect(r2.style.getPropertyValue('--area-solid')).toBe('#2563eb');
    expect(r1.style.getPropertyValue('--area-bg')).not.toBe(r2.style.getPropertyValue('--area-bg'));
  });

  test('সার্চ বক্স স্মারক/ঠিকানার কথা বলে এবং search param API-তে যায়', async () => {
    setup('USER');
    const input = await screen.findByPlaceholderText(/স্মারক নম্বর, ঠিকানা/);
    fireEvent.change(input, { target: { value: 'মিরপুর ১২৩' } });
    fireEvent.click(screen.getByRole('button', { name: 'খুঁজুন' }));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/records', { params: { search: 'মিরপুর ১২৩', page: 1, limit: 15 } }));
    expect(await screen.findByText(/শুধু মিল থাকা সারিগুলো/)).toBeInTheDocument();
  });
});

describe('মাই অ্যাডমিন (শুধু অ্যাডমিন)', () => {
  test('সাধারণ ইউজার ট্যাব দেখে না, /admin-এ গেলে ড্যাশবোর্ডে ফিরে যায়, stats API ডাকে না', async () => {
    setup('USER', '#/admin');
    expect(await screen.findByText('TMS-2026-0001')).toBeInTheDocument();   // ড্যাশবোর্ডে redirect
    expect(screen.queryByText(/মাই অ্যাডমিন/)).not.toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalledWith('/api/stats', expect.anything());
  });

  test('অ্যাডমিন নাভে "মাই অ্যাডমিন" দেখে', async () => {
    setup('ADMIN');
    expect(await screen.findAllByText(/মাই অ্যাডমিন/)).not.toHaveLength(0);
  });

  test('পরিসংখ্যান ট্যাব: তিনটি আলাদা ট্যাব, কার্ড, শীর্ষ ঠিকানা, মাস চার্ট', async () => {
    setup('ADMIN', '#/admin');
    expect(await screen.findByRole('heading', { name: /মাই অ্যাডমিন/ })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map(t => t.textContent)).toEqual(['📊 পরিসংখ্যান', '👥 ব্যবহারকারী', '💾 ব্যাকআপ ও রিস্টোর']);
    await screen.findByText('এলাকা অনুযায়ী চিঠির সংখ্যা', { exact: false });
    expect(screen.getByText('ঢাকা সেনানিবাস')).toBeInTheDocument();
    expect(screen.getByText('অক্টো ২৬')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/stats', { params: {} });
  });

  test('হিসাব: ঠিকানা ডেটাবেসের সংখ্যা থেকে; শতাংশ = এলাকার ঠিকানা ÷ মোট ঠিকানা × ১০০; গোলের মাঝে মোট চিঠি', async () => {
    setup('ADMIN', '#/admin');
    await screen.findByText('এলাকা অনুযায়ী চিঠির সংখ্যা', { exact: false });
    const table = screen.getAllByRole('table')[0];
    const cells = (area) => within(within(table).getByText(area).closest('tr')).getAllByRole('cell').map(c => c.textContent);

    // সেনানিবাস: ৩৭৫ ঠিকানা → ৩৭৫/৯৩০ = ৪০.৩%
    expect(cells('সেনানিবাস এলাকা')).toEqual(['সেনানিবাস এলাকা', '৪', '২২০', '৩৭৫', '৪০.৩%']);
    expect(cells('মন্ত্রণালয় এলাকা')).toEqual(['মন্ত্রণালয় এলাকা', '৩', '১৯০', '৩০০', '৩২.৩%']);   // ৩০০/৯৩০
    expect(cells('সিগন্যাল সেন্টার')).toEqual(['সিগন্যাল সেন্টার', '২', '১০০', '১৮০', '১৯.৪%']);     // ১৮০/৯৩০
    expect(cells('অন্যান্য')).toEqual(['অন্যান্য', '১', '৫৪', '৭৫', '৮.১%']);                         // ৭৫/৯৩০
    expect(cells('মোট')).toEqual(['মোট', '১০', '৫৬৪', '৯৩০', '১০০.০%']);

    // গোল: মাঝে মোট চিঠি (৫৬৪), ৯৩০ নয়; অংশের ভেতরে ঠিকানা-ভিত্তিক শতাংশ
    const donut = screen.getByRole('img', { name: /ডোনাট/ });
    expect(within(donut).getByText('মোট চিঠি')).toBeInTheDocument();
    expect(within(donut).getByText('৫৬৪')).toBeInTheDocument();
    expect(within(donut).queryByText('৯৩০')).not.toBeInTheDocument();
    ['৪০.৩%', '৩২.৩%', '১৯.৪%', '৮.১%'].forEach(p => expect(within(donut).getByText(p)).toBeInTheDocument());

    // বার: সংখ্যা = ঠিকানা (৩৭৫ টি), দৈর্ঘ্য ঠিকানার অনুপাতে (সর্বোচ্চ = ১০০%)
    expect(screen.getByText('৩৭৫ টি')).toBeInTheDocument();
    const bars = [...document.querySelectorAll('.h-3 > div')].map(d => parseFloat(d.style.width));
    expect(bars[0]).toBeCloseTo(100, 5);
    expect(bars[1]).toBeCloseTo((300 / 375) * 100, 5);
    expect(bars[3]).toBeCloseTo((75 / 375) * 100, 5);
  });

  test('UI অপরিবর্তিত: লেবেল, ফন্ট সাইজ, আকার, লেআউট আগের মতোই', async () => {
    setup('ADMIN', '#/admin');
    await screen.findByText('এলাকা অনুযায়ী চিঠির সংখ্যা', { exact: false });
    // লেবেল
    expect(screen.getByText('📍 এলাকা অনুযায়ী চিঠির সংখ্যা')).toBeInTheDocument();
    expect(screen.getByText('কোন এলাকায় কত চিঠি গেছে')).toBeInTheDocument();
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getAllByRole('columnheader').map(h => h.textContent)).toEqual(['এলাকা', 'ট্রানজিট', 'চিঠি', 'ঠিকানা', 'চিঠির অংশ']);
    // বারের নিচের লেখা ও একক
    expect(screen.getByText('৪ টি ট্রানজিট · ৩৭৫ টি ঠিকানা')).toBeInTheDocument();
    // গোল চার্টের জ্যামিতি ও মাঝের লেখার ফন্ট
    const donut = screen.getByRole('img', { name: /ডোনাট/ });
    expect(donut.getAttribute('width')).toBe('180');
    expect(donut.getAttribute('viewBox')).toBe('0 0 200 200');
    const ring = donut.querySelectorAll('circle');
    expect(ring.length).toBe(5);                                   // ১ ধূসর + ৪ অংশ
    ring.forEach(c => { expect(c.getAttribute('r')).toBe('70'); expect(c.getAttribute('stroke-width')).toBe('26'); });
    const label = within(donut).getByText('মোট চিঠি'); const value = within(donut).getByText('৫৬৪');
    expect([label.getAttribute('font-size'), label.getAttribute('y')]).toEqual(['13', '97']);
    expect([value.getAttribute('font-size'), value.getAttribute('font-weight'), value.getAttribute('y')]).toEqual(['26', '700', '122']);
    // লেআউট: গ্রিড ২২০px, লেজেন্ডে শতাংশ নেই
    expect(document.querySelector('.lg\\:grid-cols-\\[220px_1fr\\]')).not.toBeNull();
    expect(screen.getByText('সেনানিবাস এলাকা', { selector: 'span.flex.items-center' }).textContent).toBe('সেনানিবাস এলাকা');
    // টেবিলের ফন্ট-স্টাইল (চিঠি মোটা, % ধূসর)
    const sena = within(table).getByText('সেনানিবাস এলাকা').closest('tr').querySelectorAll('td');
    expect(sena[2].className).toContain('font-bold');
    expect(sena[4].className).toContain('text-gray-500');
  });

  test('তারিখ ফিল্টার বদলালে from/to সহ নতুন করে API ডাকে', async () => {
    setup('ADMIN', '#/admin');
    await screen.findByText('এলাকা অনুযায়ী চিঠির সংখ্যা', { exact: false });
    fireEvent.change(screen.getByLabelText(/শুরু/), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/stats', { params: { from: '2026-10-01' } }));
  });

  test('ব্যবহারকারী ও ব্যাকআপ ট্যাব আলাদা — একটিতে অন্যটি দেখা যায় না', async () => {
    setup('ADMIN', '#/admin');
    await screen.findByRole('heading', { name: /মাই অ্যাডমিন/ });
    fireEvent.click(screen.getByRole('tab', { name: /ব্যবহারকারী/ }));
    expect(await screen.findByText('👥 ব্যবহারকারী ব্যবস্থাপনা')).toBeInTheDocument();
    expect(screen.queryByText('💾 ব্যাকআপ ও রিস্টোর', { selector: 'h2' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /ব্যাকআপ/ }));
    expect(await screen.findByText('💾 ব্যাকআপ ও রিস্টোর', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.queryByText('👥 ব্যবহারকারী ব্যবস্থাপনা')).not.toBeInTheDocument();
  });

  test('পুরোনো /admin/users লিংক নতুন ট্যাবে যায়', async () => {
    setup('ADMIN', '#/admin/users');
    expect(await screen.findByText('👥 ব্যবহারকারী ব্যবস্থাপনা')).toBeInTheDocument();
  });
});
