import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// إعداد كيفية عرض الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// تسجيل Device Token
export async function registerForPushNotificationsAsync() {
  let token;

  console.log('🔔 Starting push notification registration...');
  console.log('📱 Platform:', Platform.OS);
  console.log('📱 Is Device:', Device.isDevice);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    console.log('✅ Running on physical device');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Existing permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('🔐 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 New permission status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token - permission denied!');
      return;
    }
    
    console.log('✅ Permission granted, getting push token...');
    
    // محاولة الحصول على projectId من Constants أو استخدام القيمة المباشرة
    let projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // إذا لم يكن متوفراً، استخدم القيمة المباشرة (للـ production builds)
    if (!projectId) {
      projectId = Constants.manifest?.extra?.eas?.projectId || '0d374624-39fd-4970-8d41-07ce1a3538a3';
    }
    
    console.log('🔑 Using projectId:', projectId);
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;
      
      console.log('✅ Push token obtained:', token);
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      console.error('Error details:', JSON.stringify(error));
      return;
    }
  } else {
    console.log('❌ Must use physical device for Push Notifications');
  }

  return token;
}

// حفظ Push Token في قاعدة البيانات
export async function savePushToken(userId, token) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw error;
    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// إرسال Push Notification
export async function sendPushNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('Push notification sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// إرسال تذكير بالمذاكرة للطالب
export async function sendStudyReminderPush(studentId) {
  try {
    // جلب push token للطالب
    const { data: student, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', studentId)
      .single();

    if (error) throw error;

    if (!student?.push_token) {
      console.log('Student does not have a push token');
      return false;
    }

    // إرسال الإشعار
    await sendPushNotification(
      student.push_token,
      'تذكير بالمذاكرة 📚',
      'يذكرك ولي أمرك بضرورة المذاكرة ومتابعة دروسك'
    );

    return true;
  } catch (error) {
    console.error('Error sending study reminder push:', error);
    return false;
  }
}

// إرسال إشعار لولي الأمر عند دخول الطالب
export async function sendParentLoginNotification(studentId, studentName) {
  try {
    console.log('📤 Sending parent login notification for student:', studentId);
    
    // جلب معلومات الطالب وولي الأمر
    const { data: student, error } = await supabase
      .from('users')
      .select('parent_id')
      .eq('id', studentId)
      .single();

    console.log('👨‍👦 Student parent_id:', student?.parent_id);

    if (error || !student?.parent_id) {
      console.log('❌ Student does not have a parent', error);
      return false;
    }

    // جلب push token لولي الأمر
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', student.parent_id)
      .single();

    console.log('🔑 Parent push_token:', parent?.push_token ? 'EXISTS' : 'MISSING');

    if (parentError || !parent?.push_token) {
      console.log('❌ Parent does not have a push token', parentError);
      return false;
    }

    // إرسال الإشعار
    console.log('📨 Sending push notification to parent...');
    const result = await sendPushNotification(
      parent.push_token,
      'دخول الطالب 🟢',
      `قام ${studentName} بتسجيل الدخول إلى التطبيق`
    );
    
    console.log('✅ Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending parent login notification:', error);
    return false;
  }
}

// إرسال إشعار لولي الأمر عند بدء درس
export async function sendParentLessonStartNotification(studentId, studentName, lessonTitle) {
  try {
    // جلب معلومات الطالب وولي الأمر
    const { data: student, error } = await supabase
      .from('users')
      .select('parent_id')
      .eq('id', studentId)
      .single();

    if (error || !student?.parent_id) return false;

    // جلب push token لولي الأمر
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', student.parent_id)
      .single();

    if (parentError || !parent?.push_token) return false;

    // إرسال الإشعار
    await sendPushNotification(
      parent.push_token,
      'بدء درس 📖',
      `بدأ ${studentName} دراسة درس "${lessonTitle}"`
    );

    return true;
  } catch (error) {
    console.error('Error sending parent lesson start notification:', error);
    return false;
  }
}

// إرسال إشعار لولي الأمر عند إنهاء امتحان
export async function sendParentExamCompleteNotification(studentId, studentName, lessonTitle, score, total, percentage) {
  try {
    // جلب معلومات الطالب وولي الأمر
    const { data: student, error } = await supabase
      .from('users')
      .select('parent_id')
      .eq('id', studentId)
      .single();

    if (error || !student?.parent_id) return false;

    // جلب push token لولي الأمر
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', student.parent_id)
      .single();

    if (parentError || !parent?.push_token) return false;

    // إرسال الإشعار
    await sendPushNotification(
      parent.push_token,
      'إنهاء امتحان ✅',
      `أنهى ${studentName} امتحان "${lessonTitle}" بنتيجة ${score}/${total} (${percentage}%)`
    );

    return true;
  } catch (error) {
    console.error('Error sending parent exam complete notification:', error);
    return false;
  }
}
