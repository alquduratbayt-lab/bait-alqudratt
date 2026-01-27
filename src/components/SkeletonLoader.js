import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * مكون Skeleton أساسي مع تأثير Shimmer
 */
export const SkeletonBox = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton لبطاقة المادة في صفحة المنهج
 */
export const SubjectCardSkeleton = () => {
  return (
    <View style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <SkeletonBox width={120} height={24} />
        <SkeletonBox width={60} height={24} />
      </View>
      <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
      <View style={styles.subjectFooter}>
        <SkeletonBox width={80} height={16} />
        <SkeletonBox width={100} height={16} />
      </View>
    </View>
  );
};

/**
 * Skeleton لبطاقة الدرس
 */
export const LessonCardSkeleton = () => {
  return (
    <View style={styles.lessonCard}>
      <View style={styles.lessonHeader}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={styles.lessonInfo}>
          <SkeletonBox width="80%" height={20} />
          <SkeletonBox width="60%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={styles.lessonFooter}>
        <SkeletonBox width={80} height={32} borderRadius={16} />
        <SkeletonBox width={60} height={20} />
      </View>
    </View>
  );
};

/**
 * Skeleton لبطاقة الملف الشخصي
 */
export const ProfileCardSkeleton = () => {
  return (
    <View style={styles.profileCard}>
      <SkeletonBox width={80} height={80} borderRadius={40} style={{ alignSelf: 'center' }} />
      <SkeletonBox width={150} height={24} style={{ marginTop: 16, alignSelf: 'center' }} />
      <SkeletonBox width={120} height={18} style={{ marginTop: 8, alignSelf: 'center' }} />
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <SkeletonBox width={60} height={32} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBox width={60} height={32} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBox width={60} height={32} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton لنموذج التعديل
 */
export const FormFieldSkeleton = () => {
  return (
    <View style={styles.formField}>
      <SkeletonBox width={100} height={18} style={{ marginBottom: 8 }} />
      <SkeletonBox width="100%" height={50} borderRadius={12} />
    </View>
  );
};

/**
 * Skeleton للسؤال في صفحة الدرس
 */
export const QuestionSkeleton = () => {
  return (
    <View style={styles.questionSkeleton}>
      <SkeletonBox width={60} height={24} style={{ alignSelf: 'center', marginBottom: 16 }} />
      <SkeletonBox width="90%" height={60} borderRadius={12} style={{ alignSelf: 'center', marginBottom: 24 }} />
      
      {/* الخيارات */}
      <View style={styles.optionsSkeleton}>
        <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
      </View>
      
      {/* زر التأكيد */}
      <SkeletonBox width="100%" height={50} borderRadius={25} style={{ marginTop: 16 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  formField: {
    marginBottom: 20,
  },
  questionSkeleton: {
    padding: 20,
  },
  optionsSkeleton: {
    marginTop: 8,
  },
});
