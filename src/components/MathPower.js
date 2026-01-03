import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// مكون لعرض الأسس (x²، x³، إلخ)
export default function MathPower({ base, exponent, style }) {
  return (
    <View style={[styles.powerContainer, style]}>
      <Text style={styles.base}>{base}</Text>
      <Text style={styles.exponent}>{exponent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  base: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e3a5f',
  },
  exponent: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1e3a5f',
    marginTop: -2,
    marginLeft: 1,
  },
});
