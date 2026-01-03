'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LegalPage {
  title: string;
  content: string;
}

export default function RefundPage() {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const { data } = await supabase
        .from('legal_pages')
        .select('title, content')
        .eq('page_type', 'refund')
        .single();
      
      if (data) setPage(data);
    } catch (error) {
      console.error('Error fetching refund:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50" dir="rtl">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowRight className="w-5 h-5" />
          العودة للصفحة الرئيسية
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{page?.title || 'سياسة الاسترجاع'}</h1>
          
          <div className="prose prose-lg max-w-none">
            {page?.content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-gray-900">{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-gray-900">{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-bold mt-4 mb-2 text-gray-900">{line.substring(4)}</h3>;
              } else if (line.startsWith('- ')) {
                return <li key={index} className="mr-6 text-gray-900">{line.substring(2)}</li>;
              } else if (line.trim() === '') {
                return <br key={index} />;
              } else {
                return <p key={index} className="text-gray-900 leading-relaxed mb-4">{line}</p>;
              }
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-700 font-medium">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>
    </div>
  );
}
