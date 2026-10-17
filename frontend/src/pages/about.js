import React from 'react';

const features = [
  {
    icon: '📋',
    title: 'কেন্দ্রীয় ড্যাশবোর্ড',
    description:
      'প্রয়োজনীয় ট্রানজিট তথ্য ও রেকর্ড এক জায়গায় দেখা এবং পরিচালনা করার সুবিধা।',
  },
  {
    icon: '➕',
    title: 'নতুন তথ্য সংযোজন',
    description:
      'সহজে নতুন রেকর্ড তৈরি, তথ্য সংরক্ষণ এবং কাজের ধারাবাহিকতা বজায় রাখা।',
  },
  {
    icon: '✏️',
    title: 'রেকর্ড ব্যবস্থাপনা',
    description:
      'অনুমোদিত ব্যবহারকারীদের জন্য বিদ্যমান রেকর্ড দেখা ও সম্পাদনার সুবিধা।',
  },
  {
    icon: '🛡️',
    title: 'প্রবেশাধিকার নিয়ন্ত্রণ',
    description:
      'ব্যবহারকারীর ভূমিকা অনুযায়ী নির্ধারিত সুবিধা ব্যবহারের ব্যবস্থা।',
  },
];

export default function About() {
  return (
    <div className="space-y-6">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2744] via-[#17395f] to-[#2563a6] px-6 py-10 sm:px-10 sm:py-14 text-white shadow-lg">
        <div className="relative max-w-3xl">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-blue-100">
            আমাদের সম্পর্কে
          </span>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            ট্রানজিট ব্যবস্থাপনা
          </h1>

          <p className="mt-3 text-lg font-semibold text-blue-200">
            অটোমোটেড সিস্টেম
          </p>

          <p className="mt-5 text-sm leading-7 text-blue-50 sm:text-base">
            ট্রানজিট-সংক্রান্ত তথ্য ও রেকর্ডকে আরও সুশৃঙ্খলভাবে
            সংরক্ষণ, খুঁজে দেখা এবং পরিচালনার সুবিধা দিতে তৈরি
            একটি ডিজিটাল ব্যবস্থাপনা প্ল্যাটফর্ম।
          </p>
        </div>
      </section>

      {/* About System */}
      <section className="grid gap-6 lg:grid-cols-5">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
          <h2 className="text-xl font-bold text-gray-900">
            সিস্টেমের উদ্দেশ্য
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            এই সিস্টেমের মূল লক্ষ্য হলো ট্রানজিট-সংক্রান্ত
            রেকর্ড ব্যবস্থাপনাকে সহজ, সুশৃঙ্খল ও ব্যবহারবান্ধব
            করা। নির্ধারিত ব্যবহারকারীরা একটি কেন্দ্রীয়
            ইন্টারফেস থেকে তথ্য তৈরি, পর্যালোচনা এবং প্রয়োজন
            অনুযায়ী সম্পাদনা করতে পারেন।
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            ডিজিটাল কর্মপ্রবাহের মাধ্যমে তথ্য ব্যবস্থাপনায়
            ধারাবাহিকতা বজায় রাখা এবং দৈনন্দিন কাজকে আরও
            কার্যকর করাই এই সিস্টেমের অন্যতম উদ্দেশ্য।
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:p-8 lg:col-span-2">
          <div className="text-3xl">🎯</div>

          <h2 className="mt-3 text-xl font-bold text-gray-900">
            আমাদের অগ্রাধিকার
          </h2>

          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li>✓ তথ্যকে সুসংগঠিত রাখা</li>
            <li>✓ সহজ ও পরিচ্ছন্ন ব্যবহার-অভিজ্ঞতা</li>
            <li>✓ কার্যকর রেকর্ড ব্যবস্থাপনা</li>
            <li>✓ ভূমিকা অনুযায়ী প্রবেশাধিকার</li>
          </ul>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">
          প্রধান সুবিধাসমূহ
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          দৈনন্দিন রেকর্ড ব্যবস্থাপনায় সহায়ক সুবিধাগুলো।
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                {feature.icon}
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900">
          নিরাপদ ও দায়িত্বশীল ব্যবহার
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-600">
          সিস্টেমে প্রবেশাধিকার ব্যবহারকারীর অ্যাকাউন্ট ও
          নির্ধারিত ভূমিকার ওপর নির্ভরশীল। অনুমোদিত কাজের
          মধ্যেই সীমাবদ্ধ থেকে তথ্য ব্যবহার করুন এবং আপনার
          লগইন তথ্য গোপন রাখুন।
        </p>
      </section>

      <footer className="pb-2 text-center text-xs text-gray-500">
        ট্রানজিট ব্যবস্থাপনা • অটোমোটেড সিস্টেম
      </footer>

    </div>
  );
}