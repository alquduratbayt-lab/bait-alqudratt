'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'mathlive/static.css';

interface MathEditorProps {
  value?: string;
  onChange?: (latex: string) => void;
  placeholder?: string;
}

export default function MathEditor({ value = '', onChange, placeholder = 'أدخل المعادلة الرياضية...' }: MathEditorProps) {
  const mathFieldRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const loadMathLive = async () => {
      const MathfieldElement = (await import('mathlive')).MathfieldElement;

      if (!mathFieldRef.current && containerRef.current) {
        const mf = new MathfieldElement();
        
        // تكوين المحرر عبر الخصائص
        (mf as any).defaultMode = 'math';
        (mf as any).smartMode = true;
        (mf as any).smartFence = true;
        (mf as any).smartSuperscript = true;

        // تعيين القيمة الأولية
        if (value) {
          mf.value = value;
        }

        // الاستماع للتغييرات
        mf.addEventListener('input', () => {
          if (onChange) {
            onChange(mf.value);
          }
        });

        containerRef.current.appendChild(mf);
        mathFieldRef.current = mf;
      }
    };

    loadMathLive();

    return () => {
      if (mathFieldRef.current && containerRef.current) {
        containerRef.current.removeChild(mathFieldRef.current);
        mathFieldRef.current = null;
      }
    };
  }, [isClient]);

  // تحديث القيمة عند تغييرها من الخارج
  useEffect(() => {
    if (mathFieldRef.current && value !== mathFieldRef.current.value) {
      mathFieldRef.current.value = value;
      // التركيز على المحرر بعد التحديث للسماح بالتعديل
      setTimeout(() => {
        if (mathFieldRef.current) {
          mathFieldRef.current.focus();
        }
      }, 100);
    }
  }, [value]);

  const insertSymbol = (latex: string) => {
    if (mathFieldRef.current) {
      mathFieldRef.current.executeCommand(['insert', latex]);
      mathFieldRef.current.focus();
    }
  };

  if (!isClient) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <p className="text-gray-500 text-center">جاري تحميل المحرر...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg" dir="ltr">
        <button
          type="button"
          onClick={() => insertSymbol('\\frac{#@}{#?}')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="كسر"
        >
          <span className="text-lg">½</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\sqrt{#?}')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="جذر تربيعي"
        >
          <span className="text-lg">√</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('^{#?}')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="أس"
        >
          <span className="text-lg">x²</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('_{#?}')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="منخفض"
        >
          <span className="text-lg">x₂</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\times')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="ضرب"
        >
          <span className="text-lg">×</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\div')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="قسمة"
        >
          <span className="text-lg">÷</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\pm')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="زائد أو ناقص"
        >
          <span className="text-lg">±</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\leq')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="أصغر من أو يساوي"
        >
          <span className="text-lg">≤</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\geq')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="أكبر من أو يساوي"
        >
          <span className="text-lg">≥</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\neq')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="لا يساوي"
        >
          <span className="text-lg">≠</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\sum_{#?}^{#?}')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="مجموع"
        >
          <span className="text-lg">∑</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\int_{#?}^{#?}')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="تكامل"
        >
          <span className="text-lg">∫</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\pi')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="باي"
        >
          <span className="text-lg">π</span>
        </button>
        
        <button
          type="button"
          onClick={() => insertSymbol('\\infty')}
          className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
          title="لا نهاية"
        >
          <span className="text-lg">∞</span>
        </button>
      </div>

      {/* المحرر */}
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg p-4 bg-white min-h-[100px] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all"
        style={{
          fontSize: '20px',
          direction: 'ltr',
        }}
      />

      {/* معاينة LaTeX */}
      {value && (
        <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">LaTeX:</p>
          <code className="text-sm text-gray-700 break-all">{value}</code>
        </div>
      )}
    </div>
  );
}
