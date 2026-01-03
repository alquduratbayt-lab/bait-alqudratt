import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function PaymentScreen({ route, navigation }) {
  const { plan } = route.params;
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const webViewRef = useRef(null);

  React.useEffect(() => {
    createPayment();
  }, []);

  const createPayment = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        navigation.replace('Subscriptions');
        return;
      }

      // التحقق من وجود اشتراك نشط
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_tier, subscription_end, subscription_status')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // التحقق من أن المستخدم ليس لديه اشتراك نشط
      if (userData && userData.subscription_tier !== 'free' && userData.subscription_end) {
        const endDate = new Date(userData.subscription_end);
        const today = new Date();
        
        if (endDate > today && userData.subscription_status === 'active') {
          Alert.alert(
            'لديك اشتراك نشط',
            'لديك اشتراك نشط بالفعل. لا يمكنك الاشتراك مرة أخرى حتى ينتهي اشتراكك الحالي.',
            [{ text: 'حسناً', onPress: () => navigation.replace('Subscriptions') }]
          );
          return;
        }
      }

      // استدعاء Edge Function لإنشاء الدفع
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          planId: plan.id,
          userId: user.id,
          callbackUrl: 'myapp://payment-callback'
        }
      });

      if (error) throw error;

      console.log('Payment created:', data);

      if (data.payment_url && data.payment_id) {
        setPaymentUrl(data.payment_url);
        setPaymentId(data.payment_id);
      } else {
        Alert.alert('خطأ', 'فشل في إنشاء رابط الدفع');
        navigation.replace('Subscriptions');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      Alert.alert('خطأ', 'حدث خطأ في إنشاء عملية الدفع');
      navigation.replace('Subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentId }
      });

      if (error) throw error;

      if (data.success) {
        Alert.alert(
          'تم الدفع بنجاح! 🎉',
          'تم تفعيل اشتراكك. يمكنك الآن الاستمتاع بجميع المميزات.',
          [
            {
              text: 'حسناً',
              onPress: () => {
                // مسح navigation stack والعودة للصفحة الرئيسية
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'جاري معالجة الدفع',
          'الدفع قيد المعالجة. يرجى الانتظار قليلاً.',
          [
            {
              text: 'حسناً',
              onPress: () => navigation.replace('Subscriptions')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      Alert.alert(
        'خطأ',
        'حدث خطأ في التحقق من الدفع. يرجى التواصل مع الدعم.',
        [
          {
            text: 'حسناً',
            onPress: () => navigation.replace('Subscriptions')
          }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('Navigation URL:', url);
    
    // التحقق من نجاح الدفع
    if (url.includes('status=paid') || url.includes('payment/success')) {
      console.log('Payment success detected');
      
      if (paymentId) {
        console.log('Verifying payment:', paymentId);
        setProcessing(true);
        // الانتظار قليلاً ثم التحقق من حالة الدفع
        setTimeout(() => {
          verifyPayment(paymentId);
        }, 2000);
      } else {
        console.error('Payment ID not found');
        Alert.alert(
          'خطأ',
          'لم يتم العثور على معرف الدفع. يرجى التواصل مع الدعم.',
          [
            {
              text: 'حسناً',
              onPress: () => navigation.replace('Subscriptions')
            }
          ]
        );
      }
    } else if (url.includes('status=failed')) {
      setProcessing(false);
      Alert.alert(
        'فشل الدفع',
        'حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.',
        [
          {
            text: 'حسناً',
            onPress: () => navigation.replace('Subscriptions')
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.replace('Subscriptions')} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الدفع</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>جاري تحضير صفحة الدفع...</Text>
        </View>
      </View>
    );
  }

  if (processing) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>جاري معالجة الدفع...</Text>
          <Text style={styles.subText}>يرجى الانتظار</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Subscriptions')} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إتمام الدفع</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.planInfo}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>{plan.price} ريال</Text>
      </View>

      {paymentUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  planInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
