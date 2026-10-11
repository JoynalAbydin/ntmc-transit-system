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

export const todayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const DISTRIBUTION_AREAS = [
  'সেনানিবাস এলাকা',
  'মন্ত্রণালয় এলাকা',
  'সিগন্যাল সেন্টার',
  'অন্যান্য'
];
