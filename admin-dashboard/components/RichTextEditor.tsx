'use client';

import { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = 'اكتب السؤال هنا...', height = 300 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      // الحفاظ على HTML الكامل (بما في ذلك الجداول)
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertTable = () => {
    const rows = prompt('عدد الصفوف:', '3');
    const cols = prompt('عدد الأعمدة:', '3');
    
    if (!rows || !cols) return;
    
    const numRows = parseInt(rows);
    const numCols = parseInt(cols);
    
    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    
    for (let i = 0; i < numRows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < numCols; j++) {
        tableHTML += '<td style="border: 1px solid #333; padding: 8px; text-align: center;"></td>';
      }
      tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    
    document.execCommand('insertHTML', false, tableHTML);
    editorRef.current?.focus();
  };

  return (
    <div className="mb-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg" dir="rtl">
        <button type="button" onClick={() => applyFormat('bold')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100" title="عريض">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => applyFormat('italic')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100" title="مائل">
          <em>I</em>
        </button>
        <button type="button" onClick={() => applyFormat('underline')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100" title="تحته خط">
          <u>U</u>
        </button>
        <button type="button" onClick={() => applyFormat('subscript')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100" title="منخفض">
          X<sub>2</sub>
        </button>
        <button type="button" onClick={() => applyFormat('superscript')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100" title="مرتفع">
          X<sup>2</sup>
        </button>
        <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100" title="قائمة">
          •
        </button>
        <button type="button" onClick={() => applyFormat('removeFormat')} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-red-600" title="مسح التنسيق">
          ✕
        </button>
        <button type="button" onClick={insertTable} className="px-3 py-1 bg-blue-500 text-white border border-blue-600 rounded hover:bg-blue-600 font-bold" title="إدراج جدول">
          📊
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full px-4 py-3 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        style={{ 
          minHeight: height, 
          maxHeight: height * 2,
          overflowY: 'auto',
          direction: 'rtl',
          textAlign: 'right',
          fontSize: '16px',
          fontWeight: '500'
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>

      <p className="text-xs text-gray-500 mt-2 text-right">
        💡 <strong>نصيحة:</strong> يمكنك نسخ السؤال من Word (Ctrl+C ثم Ctrl+V) وسيحافظ على التنسيق والكسور!
      </p>
    </div>
  );
}
