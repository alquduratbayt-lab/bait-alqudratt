import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// مكون لعرض الجذور التربيعية
export default function MathSquareRoot({ content, style }) {
  return (
    <View style={[styles.rootContainer, style]}>
      <Text style={styles.rootSymbol}>√</Text>
      <View style={styles.contentContainer}>
        <View style={styles.topLine} />
        <Text style={styles.content}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  rootSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginRight: -2,
  },
  contentContainer: {
    position: 'relative',
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#1e3a5f',
  },
  content: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e3a5f',
    paddingHorizontal: 4,
    paddingTop: 3,
  },
});
