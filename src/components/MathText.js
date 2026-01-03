import React from 'react';
import { Text, StyleSheet } from 'react-native';

const MathText = ({ math, style }) => {
  // تحويل LaTeX البسيط إلى Unicode
  const convertToUnicode = (text) => {
    if (!text) return '';
    
    // تحويل الكسور
    let converted = text.replace(/\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g, (match, num, den) => {
      return `${num}\n────\n${den}`;
    });
    
    // تحويل الضرب
    converted = converted.replace(/\\times/g, '×');
    
    // تحويل القسمة
    converted = converted.replace(/\\div/g, '÷');
    
    // إزالة علامات $ المتبقية
    converted = converted.replace(/\$/g, '');
    
    return converted;
  };

  return (
    <Text style={[styles.mathText, style]}>
      {convertToUnicode(math)}
    </Text>
  );
};

const styles = StyleSheet.create({
  mathText: {
    fontSize: 16,
    textAlign: 'right',
    lineHeight: 24,
  },
});

export default MathText;
