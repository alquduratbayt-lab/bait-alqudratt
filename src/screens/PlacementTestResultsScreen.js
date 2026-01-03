import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';

const getAdvice = (quantPercentage, verbalPercentage) => {
  const advice = [];
  
  // تحليل الأداء الكمي
  if (quantPercentage >= 80) {
    advice.push({
      title: '🌟 ممتاز في القسم الكمي!',
      message: 'لديك قدرات استثنائية في التفكير الرياضي والمنطقي. استمر في تطوير مهاراتك من خلال حل المسائل المتقدمة والتحديات الرياضية.',
      color: '#10b981'
    });
  } else if (quantPercentage >= 60) {
    advice.push({
      title: '👍 جيد في القسم الكمي',
      message: 'لديك أساس جيد في المهارات الكمية. ننصحك بالتركيز على المزيد من التمارين الرياضية وحل المسائل المتنوعة لتحسين أدائك.',
      color: '#f59e0b'
    });
  } else {
    advice.push({
      title: '💪 يحتاج تطوير في القسم الكمي',
      message: 'لا تقلق! مع الممارسة المستمرة والتركيز على الأساسيات، ستتحسن مهاراتك الكمية بشكل ملحوظ. ننصحك بمشاهدة الدروس التأسيسية والتدرب يومياً.',
      color: '#ef4444'
    });
  }

  // تحليل الأداء اللفظي
  if (verbalPercentage >= 80) {
    advice.push({
      title: '🌟 ممتاز في القسم اللفظي!',
      message: 'لديك مهارات لغوية متميزة وقدرة عالية على الفهم والاستيعاب. استمر في القراءة المتنوعة وتوسيع مفرداتك اللغوية.',
      color: '#10b981'
    });
  } else if (verbalPercentage >= 60) {
    advice.push({
      title: '👍 جيد في القسم اللفظي',
      message: 'لديك مستوى جيد في المهارات اللفظية. ننصحك بالإكثار من القراءة وحل التمارين اللغوية لتعزيز قدراتك في الفهم والاستيعاب.',
      color: '#f59e0b'
    });
  } else {
    advice.push({
      title: '💪 يحتاج تطوير في القسم اللفظي',
      message: 'القراءة المنتظمة هي مفتاح التحسن! ننصحك بقراءة الكتب والمقالات المتنوعة، وحل تمارين الفهم والاستيعاب بشكل يومي.',
      color: '#ef4444'
    });
  }

  // نصيحة عامة بناءً على الفرق بين القسمين
  const difference = Math.abs(quantPercentage - verbalPercentage);
  if (difference > 20) {
    if (quantPercentage > verbalPercentage) {
      advice.push({
        title: '🎯 توصية خاصة',
        message: 'أنت متميز في القسم الكمي! ننصحك بتخصيص وقت إضافي للقسم اللفظي لتحقيق التوازن وتطوير مهاراتك بشكل شامل.',
        color: '#8b5cf6'
      });
    } else {
      advice.push({
        title: '🎯 توصية خاصة',
        message: 'أنت متميز في القسم اللفظي! ننصحك بتخصيص وقت إضافي للقسم الكمي لتحقيق التوازن وتطوير مهاراتك بشكل شامل.',
        color: '#8b5cf6'
      });
    }
  } else {
    advice.push({
      title: '⚖️ أداء متوازن',
      message: 'رائع! لديك توازن جيد بين المهارات الكمية واللفظية. استمر في تطوير كلا الجانبين بشكل متساوٍ للحصول على أفضل النتائج.',
      color: '#3b82f6'
    });
  }

  return advice;
};

export default function PlacementTestResultsScreen({ navigation, route }) {
  const {
    quantitativeScore,
    quantitativeTotal,
    quantitativePercentage,
    verbalScore,
    verbalTotal,
    verbalPercentage,
    userData
  } = route.params;

  const advice = getAdvice(quantitativePercentage, verbalPercentage);

  const handleContinue = () => {
    // الانتقال لصفحة انتظار الموافقة
    navigation.replace('WaitingApproval', {
      studentName: userData.name,
      parentPhone: userData.parent_phone
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>نتيجة امتحان تحديد المستوى</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* بطاقة النتائج الإجمالية */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>🎉 تم إكمال الامتحان بنجاح!</Text>
          <Text style={styles.resultsSubtitle}>إليك تقرير مفصل عن أدائك</Text>
        </View>

        {/* نتائج القسم الكمي */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 القسم الكمي</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.percentage, { color: quantitativePercentage >= 60 ? '#10b981' : '#ef4444' }]}>
              {quantitativePercentage}%
            </Text>
            <Text style={styles.score}>{quantitativeScore} من {quantitativeTotal}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { 
              width: `${quantitativePercentage}%`,
              backgroundColor: quantitativePercentage >= 60 ? '#10b981' : '#ef4444'
            }]} />
          </View>
        </View>

        {/* نتائج القسم اللفظي */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 القسم اللفظي</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.percentage, { color: verbalPercentage >= 60 ? '#10b981' : '#ef4444' }]}>
              {verbalPercentage}%
            </Text>
            <Text style={styles.score}>{verbalScore} من {verbalTotal}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { 
              width: `${verbalPercentage}%`,
              backgroundColor: verbalPercentage >= 60 ? '#10b981' : '#ef4444'
            }]} />
          </View>
        </View>

        {/* النصائح والتوصيات */}
        <View style={styles.adviceSection}>
          <Text style={styles.adviceHeader}>💡 نصائح وتوصيات</Text>
          {advice.map((item, index) => (
            <View key={index} style={[styles.adviceCard, { borderLeftColor: item.color }]}>
              <Text style={[styles.adviceTitle, { color: item.color }]}>{item.title}</Text>
              <Text style={styles.adviceMessage}>{item.message}</Text>
            </View>
          ))}
        </View>

        {/* زر المتابعة */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>متابعة</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          سيتم مراجعة طلبك من قبل ولي الأمر قريباً
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  resultsCard: {
    margin: 20,
    marginBottom: 10,
    padding: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  percentage: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  score: {
    fontSize: 16,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  adviceSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  adviceHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
  },
  adviceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  adviceMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    textAlign: 'right',
  },
  continueButton: {
    marginHorizontal: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
});
