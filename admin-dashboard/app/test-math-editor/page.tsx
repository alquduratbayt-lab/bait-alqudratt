'use client';

import { useState } from 'react';
import MathEditor from '@/components/MathEditor';

export default function TestMathEditorPage() {
  const [equation, setEquation] = useState('');
  const [savedEquations, setSavedEquations] = useState<string[]>([]);

  const handleSave = () => {
    if (equation) {
      setSavedEquations([...savedEquations, equation]);
      alert('تم حفظ المعادلة!');
    }
  };

  const handleClear = () => {
    setEquation('');
  };

  const loadExample = (example: string) => {
    setEquation(example);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          اختبار المحرر الرياضي المرئي
        </h1>
        <p className="text-gray-600 mb-8">
          محرر رياضيات احترافي باستخدام MathLive
        </p>

        {/* أمثلة سريعة */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">أمثلة سريعة:</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadExample('\\frac{2}{3}')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              كسر بسيط
            </button>
            <button
              onClick={() => loadExample('x^{2} + 5x + 6 = 0')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              معادلة تربيعية
            </button>
            <button
              onClick={() => loadExample('\\sqrt{x^{2} + y^{2}}')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              جذر تربيعي
            </button>
            <button
              onClick={() => loadExample('\\frac{2 \\times 333}{9 \\times 1.01}')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              كسر معقد
            </button>
            <button
              onClick={() => loadExample('x \\geq 3')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              متباينة
            </button>
            <button
              onClick={() => loadExample('\\sum_{i=1}^{n} i^{2}')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              مجموع
            </button>
            <button
              onClick={() => loadExample('\\int_{0}^{\\infty} e^{-x} dx')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              تكامل
            </button>
          </div>
        </div>

        {/* المحرر */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">المحرر:</h2>
          <MathEditor
            value={equation}
            onChange={setEquation}
            placeholder="أدخل المعادلة الرياضية..."
          />
        </div>

        {/* الأزرار */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
          >
            حفظ المعادلة
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
          >
            مسح
          </button>
        </div>

        {/* المعادلات المحفوظة */}
        {savedEquations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">المعادلات المحفوظة:</h2>
            <div className="space-y-4">
              {savedEquations.map((eq, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">معادلة #{index + 1}</p>
                  <code className="text-sm text-gray-700 break-all block mb-2">
                    {eq}
                  </code>
                  <div className="text-lg" style={{ direction: 'ltr' }}>
                    {/* معاينة المعادلة */}
                    <img
                      src={`https://latex.codecogs.com/svg.latex?${encodeURIComponent(eq)}`}
                      alt="معادلة"
                      className="inline-block"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 نصائح الاستخدام:</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• استخدم الأزرار في شريط الأدوات لإدراج الرموز</li>
            <li>• يمكنك الكتابة مباشرة في المحرر</li>
            <li>• اضغط Tab للانتقال بين الحقول</li>
            <li>• المعادلة تُحفظ بصيغة LaTeX</li>
            <li>• يمكن نسخ LaTeX واستخدامه في أي مكان</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
