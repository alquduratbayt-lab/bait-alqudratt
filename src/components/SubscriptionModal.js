import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// أيقونة التخرج
const GraduationCapIcon = () => (
  <Svg width={100} height={100} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" 
      fill="#2196F3"
    />
    <Path 
      d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" 
      fill="#1976D2"
    />
  </Svg>
);

// أيقونة الكتاب
const BookIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#2196F3" strokeWidth={2} />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
  </Svg>
);

// أيقونة الأسئلة
const QuestionIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={17} r={1} fill="#2196F3" />
  </Svg>
);

// أيقونة الروبوت AI
const AIIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={8} width={14} height={12} rx={2} stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Circle cx={9} cy={13} r={1.5} fill="#2196F3" />
    <Circle cx={15} cy={13} r={1.5} fill="#2196F3" />
    <Path d="M9 17h6" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 8V5" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={4} r={1} fill="#2196F3" />
  </Svg>
);

// أيقونة الامتحان
const ExamIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Path d="M14 2v6h6M9 13h6M9 17h3" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة التحليل
const AnalyticsIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3v18h18" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Path d="M7 16l4-4 4 4 6-6" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={7} cy={16} r={2} fill="#2196F3" />
    <Circle cx={11} cy={12} r={2} fill="#2196F3" />
    <Circle cx={15} cy={16} r={2} fill="#2196F3" />
    <Circle cx={21} cy={10} r={2} fill="#2196F3" />
  </Svg>
);

export default function SubscriptionModal({ visible, onClose, onSubscribe, hideSubscribeButton = false }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* أيقونة التخرج */}
            <View style={styles.iconContainer}>
              <GraduationCapIcon />
            </View>

            {/* العنوان */}
            <Text style={styles.title}>هذا المحتوى للمشتركين فقط</Text>
            
            {/* الوصف */}
            <Text style={styles.description}>للاشتراك والحصول على جميع المميزات:</Text>

            {/* رسالة الموقع */}
            <View style={styles.websiteNotice}>
              <Text style={styles.websiteText}>قم بزيارة موقعنا</Text>
              <Text style={styles.websiteUrl}>bait-alqudratt.com</Text>
            </View>

            {/* المميزات */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <Text style={styles.featureText}>دروس كمي ولفظي شاملة</Text>
                <View style={styles.iconWrapper}>
                  <BookIcon />
                </View>
              </View>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureText}>آلاف الأسئلة التدريبية</Text>
                <View style={styles.iconWrapper}>
                  <QuestionIcon />
                </View>
              </View>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureText}>مدرسك الذكي AI متاح 24/7</Text>
                <View style={styles.iconWrapper}>
                  <AIIcon />
                </View>
              </View>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureText}>اختبارات تجريبية واقعية</Text>
                <View style={styles.iconWrapper}>
                  <ExamIcon />
                </View>
              </View>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureText}>تحليل أدائك وتحسينه</Text>
                <View style={styles.iconWrapper}>
                  <AnalyticsIcon />
                </View>
              </View>
            </View>

            {/* زر الإغلاق فقط */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>حسناً</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContent: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 6,
    paddingVertical: 2,
  },
  iconWrapper: {
    marginLeft: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
    fontWeight: '500',
    lineHeight: 18,
  },
  buttonsContainer: {
    width: '100%',
  },
  subscribeButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  laterButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  laterButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  websiteNotice: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  websiteText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  websiteUrl: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
