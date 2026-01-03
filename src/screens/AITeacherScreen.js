import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
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
import CustomAlert from '../components/CustomAlert';

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

export default function AITeacherScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'مرحباً! أنا مدرسك الخاص 🤖\nكيف يمكنني مساعدتك اليوم؟\n\nيمكنك كتابة سؤالك أو تصوير المعادلة بالكاميرا 📷',
      isAI: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const flatListRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    checkAccess();
    // التمرير للأسفل عند إضافة رسالة جديدة
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText || 'صورة معادلة',
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

  const renderMessage = ({ item }) => (
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
        message="المعلم الذكي متاح فقط للمشتركين. اشترك الآن للاستفادة من هذه الميزة الرائعة!"
        buttons={[
          { text: 'إلغاء', style: 'cancel', onPress: () => {
            setAlertVisible(false);
            navigation.navigate('Home');
          }},
          { text: 'اشترك الآن', onPress: () => {
            setAlertVisible(false);
            navigation.navigate('Subscriptions');
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

      {/* حقل الإدخال */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={(!inputText.trim() && !selectedImage) || isLoading}
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
          style={styles.cameraButton}
          onPress={pickImage}
          disabled={isLoading}
        >
          <CameraIcon />
        </TouchableOpacity>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
