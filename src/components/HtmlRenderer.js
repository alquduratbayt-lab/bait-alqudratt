import React from 'react';
import { useWindowDimensions, Text, View, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import RenderHtml from 'react-native-render-html';
import MathFraction from './MathFraction';
import MathSquareRoot from './MathSquareRoot';
import MathPower from './MathPower';
import MathRenderer from './MathRenderer';

export default function HtmlRenderer({ html, style, contentWidth: contentWidthOverride }) {
  const { width } = useWindowDimensions();
  const contentWidth = contentWidthOverride ?? Math.max(width - 40, 200);

  // تنظيف HTML من Word fragments والتعليقات
  let cleanHtml = html || '';
  
  // إزالة Word fragments
  cleanHtml = cleanHtml.replace(/<!--StartFragment-->/g, '');
  cleanHtml = cleanHtml.replace(/<!--EndFragment-->/g, '');
  
  // تنظيف المسافات
  cleanHtml = cleanHtml.trim();
  
  // إذا كان يحتوي على جدول، اعرضه في WebView مع MathJax
  if (cleanHtml.includes('<table')) {
    // استبدال [EQUATION:url] بـ <img> tags داخل HTML
    cleanHtml = cleanHtml.replace(/\[EQUATION:(.*?)\]/g, '<img src="$1" style="width: 80px; height: 30px;" />');
    
    // إزالة width الثابت من الجدول وأي أنماط عرض ثابتة
    cleanHtml = cleanHtml.replace(/width:\s*\d+px/gi, 'width: 100%');
    cleanHtml = cleanHtml.replace(/width:\s*\d+%/gi, 'width: 100%');
    cleanHtml = cleanHtml.replace(/<table[^>]*>/gi, '<table style="width:100%;max-width:100%;table-layout:fixed;">');
    
    const tableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <script>
          window.MathJax = {
            tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] },
            startup: {
              pageReady: () => {
                return MathJax.startup.defaultPageReady().then(() => {
                  setTimeout(() => {
                    const height = document.body.scrollHeight;
                    window.ReactNativeWebView?.postMessage(JSON.stringify({ height }));
                  }, 300);
                });
              }
            }
          };
        </script>
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; overflow-x: hidden; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 14px; 
            color: #1e3a5f; 
            direction: rtl; 
            padding: 5px;
            display: flex;
            justify-content: center;
          }
          table { 
            width: 100% !important; 
            max-width: 100% !important;
            border-collapse: collapse; 
            margin: 5px auto;
            table-layout: fixed;
          }
          td, th { 
            border: 1px solid #333; 
            padding: 6px; 
            text-align: center; 
            min-height: 35px;
            word-wrap: break-word;
            overflow: hidden;
          }
          th { background: #f0f0f0; font-weight: bold; }
          mjx-container { margin: 0 !important; font-size: 14px !important; }
          span { font-family: Arial, sans-serif !important; }
        </style>
      </head>
      <body>${cleanHtml}</body>
      </html>
    `;
    
    const [webViewHeight, setWebViewHeight] = React.useState(150);
    
    return (
      <View style={{ width: '100%', minHeight: webViewHeight, maxWidth: '100%', overflow: 'hidden' }}>
        <WebView
          source={{ html: tableHtml }}
          style={{ height: webViewHeight, width: '100%', backgroundColor: 'transparent' }}
          scrollEnabled={false}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.height && data.height > 50) setWebViewHeight(data.height + 20);
            } catch (e) {}
          }}
          javaScriptEnabled={true}
          originWhitelist={['*']}
          scalesPageToFit={true}
        />
      </View>
    );
  }
  
  // اكتشاف معادلات محفوظة كصور [EQUATION:url]
  const equationPattern = /\[EQUATION:(.*?)\]/g;
  const hasEquations = equationPattern.test(cleanHtml);
  
  if (hasEquations) {
    const parts = [];
    let key = 0;
    let lastIndex = 0;
    
    // إعادة تعيين regex
    equationPattern.lastIndex = 0;
    let match;
    
    while ((match = equationPattern.exec(cleanHtml)) !== null) {
      // إضافة النص قبل المعادلة
      if (match.index > lastIndex) {
        const textBefore = cleanHtml.substring(lastIndex, match.index);
        parts.push(
          <Text key={`text-${key++}`} style={style}>
            {textBefore}
          </Text>
        );
      }
      
      // إضافة صورة المعادلة
      const imageUrl = match[1];
      parts.push(
        <Image 
          key={`equation-${key++}`}
          source={{ uri: imageUrl }}
          style={{ height: 30, width: 100, resizeMode: 'contain', marginHorizontal: 4 }}
        />
      );
      
      lastIndex = equationPattern.lastIndex;
    }
    
    // إضافة النص المتبقي
    if (lastIndex < cleanHtml.length) {
      const textAfter = cleanHtml.substring(lastIndex);
      parts.push(
        <Text key={`text-${key++}`} style={style}>
          {textAfter}
        </Text>
      );
    }
    
    return (
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center' }}>
        {parts}
      </View>
    );
  }
  
  // اكتشاف LaTeX - إما محاط بـ $$ أو يحتوي على أوامر LaTeX
  const hasDoubleDollar = cleanHtml.includes('$$');
  const hasLatexCommands = /\\(frac|sqrt|sum|int|lim|pi|infty|geq|leq|neq|times|div|pm|Delta|alpha|beta|gamma|cdot|left|right)/i.test(cleanHtml);
  
  // إذا كان يحتوي على أوامر LaTeX بدون $$ - أضفها تلقائياً
  if (!hasDoubleDollar && hasLatexCommands && !cleanHtml.includes('<')) {
    console.log('✅ Found LaTeX commands without $$, rendering as math');
    return <MathRenderer latex={cleanHtml} style={style} />;
  }
  
  if (hasDoubleDollar) {
    console.log('✅ Found $$ in text, rendering MathRenderer');
    const parts = [];
    let key = 0;
    const regex = /\$\$([\s\S]*?)\$\$/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(cleanHtml)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = cleanHtml.substring(lastIndex, match.index).trim();
        if (textBefore) {
          parts.push(
            <Text key={`text-${key++}`} style={style}>
              {textBefore}
            </Text>
          );
        }
      }
      
      const latex = match[1];
      parts.push(
        <MathRenderer key={`math-${key++}`} latex={latex} style={{ marginHorizontal: 4 }} />
      );
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < cleanHtml.length) {
      const textAfter = cleanHtml.substring(lastIndex).trim();
      if (textAfter) {
        parts.push(
          <Text key={`text-${key++}`} style={style}>
            {textAfter}
          </Text>
        );
      }
    }
    
    return (
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center' }}>
        {parts}
      </View>
    );
  }
  
  // اكتشاف LaTeX محاط بـ \[ \] (للتوافق مع الأسئلة القديمة)
  const latexPattern = /\\\[(.*?)\\\]/s;
  const latexMatch = cleanHtml.match(latexPattern);
  
  if (latexMatch) {
    const parts = [];
    let key = 0;
    const regex = /\$\$(.*?)\$\$|\\\[(.*?)\\\]/gs;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(cleanHtml)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = cleanHtml.substring(lastIndex, match.index);
        parts.push(
          <Text key={`text-${key++}`} style={style}>
            {textBefore}
          </Text>
        );
      }
      
      const latex = match[1] || match[2];
      parts.push(
        <MathRenderer key={`math-${key++}`} latex={latex} style={{ marginHorizontal: 4 }} />
      );
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < cleanHtml.length) {
      const textAfter = cleanHtml.substring(lastIndex);
      parts.push(
        <Text key={`text-${key++}`} style={style}>
          {textAfter}
        </Text>
      );
    }
    
    return (
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {parts}
      </View>
    );
  }
  
  // إذا كان LaTeX فقط (بدون $$)
  const hasLatexCommand = /\\(frac|sqrt|sum|int|lim|pi|infty|geq|leq|neq|times|div|pm|Delta|alpha|beta|gamma)/i.test(cleanHtml);
  if (hasLatexCommand || (cleanHtml.startsWith('\\') && !cleanHtml.includes('<'))) {
    return <MathRenderer latex={cleanHtml} style={style} />;
  }
  
  // دالة لتحليل وعرض الرياضيات
  const parseMath = (text) => {
    const parts = [];
    let remaining = text;
    
    // نمط شامل للرياضيات: كسور، جذور، أسس
    const mathPatterns = [
      // جذر تربيعي: √(...) أو sqrt(...)
      { regex: /√\(([^)]+)\)|sqrt\(([^)]+)\)/g, type: 'sqrt' },
      // أس: x^2 أو x²
      { regex: /(\w+)\^(\d+)|(\w+)(²|³|⁴|⁵)/g, type: 'power' },
      // كسر: a/b
      { regex: /([^\/\s<]+)\s*\/\s*([^\/\s<]+)/g, type: 'fraction' },
    ];
    
    let index = 0;
    const allMatches = [];
    
    // جمع كل التطابقات
    mathPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern.regex)];
      matches.forEach(match => {
        allMatches.push({
          type: pattern.type,
          match: match,
          index: match.index,
          length: match[0].length
        });
      });
    });
    
    // ترتيب حسب الموقع
    allMatches.sort((a, b) => a.index - b.index);
    
    // بناء الأجزاء
    allMatches.forEach(item => {
      // النص قبل العنصر الرياضي
      if (item.index > index) {
        const textBefore = text.substring(index, item.index).replace(/<[^>]*>/g, '');
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore });
        }
      }
      
      // العنصر الرياضي
      if (item.type === 'sqrt') {
        parts.push({
          type: 'sqrt',
          content: item.match[1] || item.match[2]
        });
      } else if (item.type === 'power') {
        const base = item.match[1] || item.match[3];
        const exp = item.match[2] || item.match[4];
        parts.push({
          type: 'power',
          base: base,
          exponent: exp
        });
      } else if (item.type === 'fraction') {
        parts.push({
          type: 'fraction',
          numerator: item.match[1].trim(),
          denominator: item.match[2].trim()
        });
      }
      
      index = item.index + item.length;
    });
    
    // النص المتبقي
    if (index < text.length) {
      const textAfter = text.substring(index).replace(/<[^>]*>/g, '');
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter });
      }
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text.replace(/<[^>]*>/g, '') }];
  };
  
  // كشف LaTeX بأقواس: {0}^{30}, x^{2}, _{n}, etc.
  const hasLatexBraceMath = /\{[^}]*\}\s*[\^_]|\^[\s]*\{[^}]*\}|_[\s]*\{[^}]*\}/.test(cleanHtml);
  if (hasLatexBraceMath && !cleanHtml.includes('<')) {
    return <MathRenderer latex={cleanHtml} style={style} />;
  }

  // التحقق من وجود رياضيات
  const hasMath = /\/|√|sqrt|\^|²|³|⁴|⁵/.test(cleanHtml);
  
  if (hasMath) {
    const parts = parseMath(cleanHtml);
    
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        {parts.map((part, index) => {
          if (part.type === 'fraction') {
            return (
              <MathFraction
                key={index}
                numerator={part.numerator}
                denominator={part.denominator}
              />
            );
          } else if (part.type === 'sqrt') {
            return (
              <MathSquareRoot
                key={index}
                content={part.content}
              />
            );
          } else if (part.type === 'power') {
            return (
              <MathPower
                key={index}
                base={part.base}
                exponent={part.exponent}
              />
            );
          } else {
            return (
              <Text key={index} style={[style, { fontSize: 16 }]}>
                {part.content}
              </Text>
            );
          }
        })}
      </View>
    );
  }
  
  // إذا كان النص عادي (ليس HTML)، نعرضه كما هو
  if (!cleanHtml || !cleanHtml.includes('<')) {
    return <Text style={[style, { writingDirection: 'rtl' }]}>{cleanHtml}</Text>;
  }

  const source = {
    html: cleanHtml
  };

  const tagsStyles = {
    body: {
      fontFamily: 'Arial',
      fontSize: 16,
      color: '#1e3a5f',
      textAlign: 'right',
      direction: 'rtl',
    },
    p: {
      marginVertical: 4,
      textAlign: 'right',
    },
    strong: {
      fontWeight: 'bold',
    },
    em: {
      fontStyle: 'italic',
    },
    sub: {
      fontSize: 12,
      lineHeight: 14,
    },
    sup: {
      fontSize: 12,
      lineHeight: 14,
    },
    table: {
      borderWidth: 1,
      borderColor: '#333',
      borderStyle: 'solid',
      marginVertical: 10,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: '#333',
    },
    td: {
      borderWidth: 1,
      borderColor: '#333',
      borderStyle: 'solid',
      padding: 8,
      textAlign: 'center',
      fontSize: 14,
      color: '#333',
    },
    th: {
      borderWidth: 1,
      borderColor: '#333',
      borderStyle: 'solid',
      padding: 8,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: 'bold',
      backgroundColor: '#f0f0f0',
      color: '#333',
    },
  };

  return (
    <View style={{ width: '100%', alignSelf: 'stretch' }}>
      <RenderHtml
        contentWidth={contentWidth}
        source={source}
        tagsStyles={tagsStyles}
        enableExperimentalMarginCollapsing={true}
      />
    </View>
  );
}
