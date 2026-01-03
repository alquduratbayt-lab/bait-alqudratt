import { supabase } from './supabase';

// إنشاء إشعار لولي الأمر
export const createParentNotification = async ({ studentId, type, title, message }) => {
  try {
    // جلب معلومات الطالب للحصول على parent_id
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('parent_id, name')
      .eq('id', studentId)
      .single();

    if (studentError || !student || !student.parent_id) {
      console.log('No parent found for student');
      return;
    }

    // إنشاء الإشعار
    const { error } = await supabase
      .from('parent_notifications')
      .insert([{
        parent_id: student.parent_id,
        student_id: studentId,
        type,
        title,
        message
      }]);

    if (error) {
      console.error('Error creating notification:', error);
    } else {
      console.log('Notification created successfully');
    }
  } catch (error) {
    console.error('Error in createParentNotification:', error);
  }
};

// إشعار دخول الطالب
export const notifyParentLogin = async (studentId, studentName) => {
  console.log('🔔 notifyParentLogin called for:', studentName, 'ID:', studentId);
  
  // حفظ في قاعدة البيانات
  await createParentNotification({
    studentId,
    type: 'login',
    title: 'دخول الطالب',
    message: `قام ${studentName} بتسجيل الدخول إلى التطبيق`
  });
  
  // إرسال Push Notification
  const { sendParentLoginNotification } = require('./pushNotifications');
  const result = await sendParentLoginNotification(studentId, studentName);
  console.log('📱 Push notification result:', result);
};

// إشعار إكمال درس
export const notifyParentLessonCompleted = async (studentId, studentName, lessonTitle) => {
  await createParentNotification({
    studentId,
    type: 'lesson_completed',
    title: 'إكمال درس',
    message: `أكمل ${studentName} درس "${lessonTitle}"`
  });
};

// إشعار إنهاء امتحان
export const notifyParentExamCompleted = async (studentId, studentName, lessonTitle, score, total) => {
  const percentage = Math.round((score / total) * 100);
  
  // حفظ في قاعدة البيانات
  await createParentNotification({
    studentId,
    type: 'exam_completed',
    title: 'إنهاء امتحان',
    message: `أنهى ${studentName} امتحان "${lessonTitle}" بنتيجة ${score}/${total} (${percentage}%)`
  });
  
  // إرسال Push Notification
  const { sendParentExamCompleteNotification } = require('./pushNotifications');
  await sendParentExamCompleteNotification(studentId, studentName, lessonTitle, score, total, percentage);
};

// إرسال تذكير للطالب من ولي الأمر
export const sendStudyReminderToStudent = async (studentId, parentName) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // حفظ الإشعار في قاعدة البيانات
    const { error } = await supabase
      .from('student_notifications')
      .insert([{
        student_id: studentId,
        parent_id: user?.id,
        type: 'study_reminder',
        title: 'تذكير بالمذاكرة',
        message: 'يذكرك ولي أمرك بضرورة المذاكرة ومتابعة دروسك'
      }]);

    if (error) {
      console.error('Error sending reminder:', error);
      return false;
    }
    
    // إرسال Push Notification
    const { sendStudyReminderPush } = require('./pushNotifications');
    await sendStudyReminderPush(studentId);
    
    console.log('Study reminder sent successfully');
    return true;
  } catch (error) {
    console.error('Error in sendStudyReminderToStudent:', error);
    return false;
  }
};

// إشعار انتهاء الاشتراك
export const notifySubscriptionExpiring = async (studentId, daysRemaining) => {
  try {
    const { data: student } = await supabase
      .from('users')
      .select('name, push_token')
      .eq('id', studentId)
      .single();

    if (!student) return false;

    let title = '';
    let message = '';

    if (daysRemaining === 1) {
      title = '⚠️ تنبيه: اشتراكك ينتهي غداً';
      message = 'اشتراكك سينتهي غداً. جدد اشتراكك الآن للاستمرار في الوصول لجميع المميزات';
    } else if (daysRemaining === 3) {
      title = '⏰ تذكير: اشتراكك ينتهي خلال 3 أيام';
      message = 'اشتراكك سينتهي خلال 3 أيام. لا تفوت فرصة التجديد';
    } else if (daysRemaining === 7) {
      title = '📅 تذكير: اشتراكك ينتهي خلال أسبوع';
      message = 'اشتراكك سينتهي خلال أسبوع. جدد الآن لضمان استمرارية الخدمة';
    } else if (daysRemaining === 0) {
      title = '❌ انتهى اشتراكك';
      message = 'انتهى اشتراكك. جدد الآن للعودة إلى التعلم';
    }

    // حفظ في قاعدة البيانات
    const { error } = await supabase
      .from('student_notifications')
      .insert([{
        student_id: studentId,
        type: 'subscription_expiring',
        title,
        message,
        is_read: false
      }]);

    if (error) {
      console.error('Error saving subscription notification:', error);
      return false;
    }

    // إرسال Push Notification
    if (student.push_token) {
      const { sendPushNotification } = require('./pushNotifications');
      await sendPushNotification(student.push_token, title, message);
    }

    console.log('Subscription notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error in notifySubscriptionExpiring:', error);
    return false;
  }
};
