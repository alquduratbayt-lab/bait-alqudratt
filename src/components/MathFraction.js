import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// مكون لعرض الكسور الرياضية بشكل صحيح
export default function MathFraction({ numerator, denominator, style }) {
  return (
    <View style={[styles.fractionContainer, style]}>
      <Text style={styles.numerator}>{numerator}</Text>
      <View style={styles.divider} />
      <Text style={styles.denominator}>{denominator}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fractionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  numerator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e3a5f',
    textAlign: 'center',
    paddingBottom: 2,
  },
  denominator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e3a5f',
    textAlign: 'center',
    paddingTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e3a5f',
    width: '100%',
    minWidth: 30,
  },
});
