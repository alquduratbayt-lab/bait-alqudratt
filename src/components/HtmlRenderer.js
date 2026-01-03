import React from 'react';
import { useWindowDimensions, Text, View, Image } from 'react-native';
import RenderHtml from 'react-native-render-html';
import MathFraction from './MathFraction';
import MathSquareRoot from './MathSquareRoot';
import MathPower from './MathPower';
import MathRenderer from './MathRenderer';

export default function HtmlRenderer({ html, style }) {
  const { width } = useWindowDimensions();

  // تنظيف HTML من Word fragments والتعليقات
  let cleanHtml = html || '';
  
  // إزالة Word fragments
  cleanHtml = cleanHtml.replace(/<!--StartFragment-->/g, '');
  cleanHtml = cleanHtml.replace(/<!--EndFragment-->/g, '');
  
  // تنظيف المسافات
  cleanHtml = cleanHtml.trim();
  
  // إذا كان يحتوي على جدول، اعرضه مباشرة بدون معالجة إضافية
  if (cleanHtml.includes('<table')) {
    // استبدال [EQUATION:url] بـ <img> tags داخل HTML
    cleanHtml = cleanHtml.replace(/\[EQUATION:(.*?)\]/g, '<img src="$1" style="width: 80px; height: 30px;" />');
    
    const source = { html: cleanHtml };
    const tagsStyles = {
      body: {
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#1e3a5f',
        textAlign: 'right',
        direction: 'rtl',
      },
      table: {
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'solid',
        marginVertical: 10,
        width: '100%',
      },
      tr: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
      },
      td: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'solid',
        padding: 8,
        textAlign: 'center',
        fontSize: 14,
        color: '#333',
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      th: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'solid',
        padding: 8,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
        color: '#333',
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      img: {
        width: 80,
        height: 30,
        resizeMode: 'contain',
      },
    };
    
    return (
      <RenderHtml
        contentWidth={width - 40}
        source={source}
        tagsStyles={tagsStyles}
        enableExperimentalMarginCollapsing={true}
        renderersProps={{
          table: {
            computeContainerHeight: () => undefined,
          },
        }}
      />
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
  
  // اكتشاف LaTeX محاط بـ $$ أو \[ \] (للتوافق مع الأسئلة القديمة)
  const latexPattern = /\$\$(.*?)\$\$|\\\[(.*?)\\\]/s;
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
    return <Text style={style}>{cleanHtml}</Text>;
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
    <RenderHtml
      contentWidth={width - 40}
      source={source}
      tagsStyles={tagsStyles}
      enableExperimentalMarginCollapsing={true}
    />
  );
}
