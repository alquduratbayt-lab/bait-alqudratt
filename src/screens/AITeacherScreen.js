import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { askDeepSeek } from '../lib/deepseekService';
import { canAccessAITeacher } from '../lib/subscriptionService';
import { getStudentProgress, getSubscriptionInfo } from '../lib/aiDataService';
import CustomAlert from '../components/CustomAlert';
import ProgressCard from '../components/ProgressCard';
import SubscriptionCard from '../components/SubscriptionCard';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الإرسال
const SendIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الكاميرا
const CameraIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={13} r={4} stroke="#2196F3" strokeWidth={2} />
  </Svg>
);

// أيقونة الروبوت
const RobotIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={11} width={14} height={10} rx={2} stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Circle cx={9} cy={15} r={1} fill="#2196F3" />
    <Circle cx={15} cy={15} r={1} fill="#2196F3" />
    <Path d="M9 18h6" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 11V8M12 8a2 2 0 100-4 2 2 0 000 4z" stroke="#2196F3" strokeWidth={2} />
  </Svg>
);

// أيقونة البرق للرسائل السريعة
const LightningIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#2196F3" />
  </Svg>
);

export default function AITeacherScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'مرحباً! أنا مدرسك الخاص 🤖\nكيف يمكنني مساعدتك اليوم؟\n\nاكتب سؤالك وسأساعدك في حله خطوة بخطوة ✍️',
      isAI: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(true);
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);

  // الرسائل السريعة
  const quickMessages = [
    { id: '1', text: 'كيف تقدمي في الدروس؟', icon: '📊' },
    { id: '2', text: 'ما هو اشتراكي؟', icon: '📦' },
    { id: '3', text: 'أعطني نصائح لتحسين أدائي', icon: '💡' },
    { id: '4', text: 'كيف أحل معادلة من الدرجة الثانية؟', icon: '🔢' },
    { id: '5', text: 'اشرح لي التشبيه في اللغة العربية', icon: '📝' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    checkAccess();
    getUserId();
    // التمرير للأسفل عند إضافة رسالة جديدة
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const getUserId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
  };

  const checkAccess = async () => {
    const access = await canAccessAITeacher();
    setHasAccess(access);
    if (!access) {
      setAlertVisible(true);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('صلاحية الكاميرا', 'نحتاج صلاحية الكاميرا لتصوير المعادلات');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const sendQuickMessage = async (messageText) => {
    // لا نخفي الرسائل السريعة - تبقى ظاهرة
    
    // التحقق من نوع السؤال
    if (messageText === 'كيف تقدمي في الدروس؟') {
      await showProgressCard();
    } else if (messageText === 'ما هو اشتراكي؟') {
      await showSubscriptionCard();
    } else {
      // أسئلة عادية → إرسال للذكاء الاصطناعي
      setInputText(messageText);
      setTimeout(() => {
        handleSend(messageText);
      }, 100);
    }
  };

  const showProgressCard = async () => {
    if (!userId) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف المستخدم');
      return;
    }

    // إضافة رسالة المستخدم
    const userMessage = {
      id: Date.now().toString(),
      text: 'كيف تقدمي في الدروس؟',
      isAI: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // إظهار مؤشر التحميل
    setIsLoading(true);

    try {
      // جلب البيانات من Supabase
      const progressData = await getStudentProgress(userId);
      
      // إضافة كارت التقدم
      const cardMessage = {
        id: (Date.now() + 1).toString(),
        type: 'progress_card',
        data: progressData,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, cardMessage]);
    } catch (error) {
      console.error('Error showing progress card:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ في جلب بيانات التقدم.',
        isAI: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const showSubscriptionCard = async () => {
    if (!userId) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف المستخدم');
      return;
    }

    // إضافة رسالة المستخدم
    const userMessage = {
      id: Date.now().toString(),
      text: 'ما هو اشتراكي؟',
      isAI: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // إظهار مؤشر التحميل
    setIsLoading(true);

    try {
      // جلب البيانات من Supabase
      const subscriptionData = await getSubscriptionInfo(userId);
      
      // إضافة كارت الاشتراك
      const cardMessage = {
        id: (Date.now() + 1).toString(),
        type: 'subscription_card',
        data: subscriptionData,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, cardMessage]);
    } catch (error) {
      console.error('Error showing subscription card:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ في جلب بيانات الاشتراك.',
        isAI: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (quickMessageText = null) => {
    const messageToSend = quickMessageText || inputText;
    if (!messageToSend.trim() && !selectedImage) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageToSend || 'صورة معادلة',
      isAI: false,
      timestamp: new Date(),
      image: selectedImage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const { sendMessageToDeepSeek, sendImageToDeepSeek } = require('../lib/deepseekService');
      
      let aiResponse;
      
      if (imageToSend) {
        // إرسال الصورة
        aiResponse = await sendImageToDeepSeek(imageToSend, inputText || 'حل هذه المعادلة');
      } else {
        // إرسال نص عادي
        const conversationHistory = messages.slice(-10);
        aiResponse = await sendMessageToDeepSeek([...conversationHistory, userMessage]);
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isAI: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText = 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
      
      // التحقق من نوع الخطأ
      if (error.message && error.message.includes('429')) {
        errorText = '⚠️ عذراً، تم استنفاد الحصة المجانية من خدمة الذكاء الاصطناعي.\n\nسيتم تحديث الخدمة قريباً. شكراً لتفهمك! 🙏';
      } else if (error.message && error.message.includes('API Error')) {
        errorText = 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.';
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isAI: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    // عرض كارت التقدم
    if (item.type === 'progress_card') {
      return (
        <ProgressCard 
          data={item.data}
        />
      );
    }

    // عرض كارت الاشتراك
    if (item.type === 'subscription_card') {
      return (
        <SubscriptionCard 
          data={item.data}
        />
      );
    }

    // رسالة عادية
    return (
      <View style={[
        styles.messageContainer,
        item.isAI ? styles.aiMessageContainer : styles.userMessageContainer
      ]}>
        {item.isAI && (
          <View style={styles.aiAvatar}>
            <RobotIcon />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          item.isAI ? styles.aiMessageBubble : styles.userMessageBubble
        ]}>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.messageImage} />
          )}
          <Text style={[
            styles.messageText,
            item.isAI ? styles.aiMessageText : styles.userMessageText
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  if (hasAccess === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} >
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="light" />
      
      <CustomAlert
        visible={alertVisible}
        type="warning"
        title="اشترك للوصول"
        message="المعلم الذكي متاح فقط للمشتركين. للاشتراك، قم بزيارة موقعنا: bait-alqudratt.com"
        buttons={[
          { text: 'حسناً', onPress: () => {
            setAlertVisible(false);
            navigation.navigate('Home');
          }}
        ]}
        onClose={() => {
          setAlertVisible(false);
          navigation.navigate('Home');
        }}
      />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>مدرسك الخاص</Text>
          <Text style={styles.headerSubtitle}>مدعوم بالذكاء الاصطناعي</Text>
        </View>
        <View style={styles.headerIcon}>
          <RobotIcon />
        </View>
      </View>

      {/* قائمة الرسائل */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* مؤشر التحميل */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>يكتب...</Text>
        </View>
      )}

      {/* معاينة الصورة المختارة */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* الرسائل السريعة */}
      {showQuickMessages && (
        <View style={styles.quickMessagesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickMessagesScroll}
          >
            {quickMessages.map((msg) => (
              <TouchableOpacity
                key={msg.id}
                style={styles.quickMessageButton}
                onPress={() => sendQuickMessage(msg.text)}
              >
                <Text style={styles.quickMessageIcon}>{msg.icon}</Text>
                <Text style={styles.quickMessageText}>{msg.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* حقل الإدخال */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          <SendIcon />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="اكتب سؤالك هنا..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={styles.quickMessagesToggle}
          onPress={() => setShowQuickMessages(!showQuickMessages)}
        >
          <LightningIcon />
        </TouchableOpacity>
        {/* زر الكاميرا معطل مؤقتاً - DeepSeek لا يدعم الصور
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={pickImage}
          disabled={isLoading}
        >
          <CameraIcon />
        </TouchableOpacity>
        */}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e3f2fd',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  quickMessagesContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
  },
  quickMessagesScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 6,
  },
  quickMessageIcon: {
    fontSize: 16,
  },
  quickMessageText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickMessagesToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    textAlign: 'right',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 15,
    right: 21,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
