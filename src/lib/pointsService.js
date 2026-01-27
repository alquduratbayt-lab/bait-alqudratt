import { supabase } from './supabase';
import { Alert } from 'react-native';

// دالة لجلب إعدادات النقاط
export const getPointsSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('points_settings')
      .select('*');

    if (error) throw error;

    const settings = {};
    data.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    return settings;
  } catch (error) {
    console.error('Error fetching points settings:', error);
    return null;
  }
};

// دالة لجلب أو إنشاء رصيد نقاط المستخدم
export const getUserPoints = async (userId) => {
  try {
    let { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // المستخدم ليس لديه رصيد نقاط، نقوم بإنشائه
      const { data: newData, error: insertError } = await supabase
        .from('user_points')
        .insert([{
          user_id: userId,
          total_points: 0,
          available_points: 0,
          spent_points: 0
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return newData;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user points:', error);
    return null;
  }
};

// دالة لإضافة نقاط للمستخدم
export const addPoints = async (userId, points, actionType, referenceId, description) => {
  try {
    // التحقق من تفعيل نظام النقاط
    const { getSetting } = require('./appSettingsService');
    const pointsEnabled = await getSetting('points_enabled', true);
    
    if (!pointsEnabled) {
      return { success: true, points: 0, message: 'نظام النقاط معطل حالياً' };
    }

    // جلب رصيد النقاط الحالي
    const userPoints = await getUserPoints(userId);
    if (!userPoints) throw new Error('Failed to get user points');

    // تحديث رصيد النقاط
    const newTotalPoints = userPoints.total_points + points;
    const newAvailablePoints = userPoints.available_points + points;

    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        total_points: newTotalPoints,
        available_points: newAvailablePoints
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // إضافة سجل في تاريخ النقاط
    const { error: historyError } = await supabase
      .from('points_history')
      .insert([{
        user_id: userId,
        points: points,
        action_type: actionType,
        reference_id: referenceId,
        description: description
      }]);

    if (historyError) throw historyError;

    return {
      success: true,
      points: points,
      totalPoints: newTotalPoints,
      availablePoints: newAvailablePoints
    };
  } catch (error) {
    console.error('Error adding points:', error);
    return { success: false, error: error.message };
  }
};

// دالة لإضافة نقاط إكمال درس
export const addLessonCompletionPoints = async (userId, lessonId, lessonTitle) => {
  try {
    const settings = await getPointsSettings();
    if (!settings) throw new Error('Failed to get points settings');

    const points = settings.lesson_completion || 10;
    const result = await addPoints(
      userId,
      points,
      'lesson_completion',
      lessonId,
      `إكمال درس: ${lessonTitle}`
    );

    if (result.success) {
      Alert.alert(
        '🎉 تهانينا!',
        `حصلت على ${points} نقطة لإكمال الدرس!\nإجمالي نقاطك: ${result.totalPoints}`,
        [{ text: 'رائع!' }]
      );
    }

    return result;
  } catch (error) {
    console.error('Error adding lesson points:', error);
    return { success: false, error: error.message };
  }
};

// دالة لإضافة نقاط إكمال منهج
export const addSubjectCompletionPoints = async (userId, subjectId, subjectName) => {
  try {
    const settings = await getPointsSettings();
    if (!settings) throw new Error('Failed to get points settings');

    const points = settings.subject_completion || 100;
    const result = await addPoints(
      userId,
      points,
      'subject_completion',
      subjectId,
      `إكمال منهج: ${subjectName}`
    );

    if (result.success) {
      Alert.alert(
        '🎉 إنجاز رائع!',
        `حصلت على ${points} نقطة لإكمال المنهج كاملاً!\nإجمالي نقاطك: ${result.totalPoints}`,
        [{ text: 'ممتاز!' }]
      );
    }

    return result;
  } catch (error) {
    console.error('Error adding subject points:', error);
    return { success: false, error: error.message };
  }
};

// دالة لإضافة نقاط الامتحان النهائي
export const addExamCompletionPoints = async (userId, examId, examTitle, percentage) => {
  try {
    // فحص حالة اشتراك الطالب
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, subscription_end')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // التحقق من انتهاء الاشتراك
    let isExpired = false;
    if (userData?.subscription_end) {
      const endDate = new Date(userData.subscription_end);
      const today = new Date();
      if (endDate < today) {
        isExpired = true;
        console.log('⚠️ الاشتراك منتهي في:', userData.subscription_end);
      }
    }

    // إذا كان الطالب غير مشترك أو منتهي اشتراكه، لا يحصل على نقاط
    if (userData?.subscription_tier === 'free' || !userData?.subscription_tier || isExpired) {
      console.log('⚠️ الطالب غير مشترك أو منتهي اشتراكه - لا يحصل على نقاط');
      return { 
        success: true, 
        points: 0, 
        isFreeTier: true,
        message: 'للحصول على النقاط والمكافآت، اشترك الآن!' 
      };
    }

    const settings = await getPointsSettings();
    if (!settings) throw new Error('Failed to get points settings');

    let points = 0;
    if (percentage >= 90) {
      points = settings.exam_90_plus || 50;
    } else if (percentage >= 80) {
      points = settings.exam_80_89 || 40;
    } else if (percentage >= 70) {
      points = settings.exam_70_79 || 30;
    } else if (percentage >= 60) {
      points = settings.exam_60_69 || 20;
    } else if (percentage >= 50) {
      points = settings.exam_50_59 || 10;
    }

    if (points === 0) {
      return { success: true, points: 0, message: 'لم تحصل على نقاط هذه المرة' };
    }

    const result = await addPoints(
      userId,
      points,
      'exam_completion',
      examId,
      `امتحان نهائي: ${examTitle} (${percentage.toFixed(1)}%)`
    );

    if (result.success) {
      Alert.alert(
        '🎉 أحسنت!',
        `حصلت على ${points} نقطة في الامتحان النهائي!\nدرجتك: ${percentage.toFixed(1)}%\nإجمالي نقاطك: ${result.totalPoints}`,
        [{ text: 'رائع!' }]
      );
    }

    return result;
  } catch (error) {
    console.error('Error adding exam points:', error);
    return { success: false, error: error.message };
  }
};

// دالة لاستبدال جائزة
export const redeemReward = async (userId, rewardId, pointsRequired) => {
  try {
    // جلب رصيد النقاط الحالي
    const userPoints = await getUserPoints(userId);
    if (!userPoints) throw new Error('Failed to get user points');

    // التحقق من وجود نقاط كافية
    if (userPoints.available_points < pointsRequired) {
      return {
        success: false,
        error: 'ليس لديك نقاط كافية لاستبدال هذه الجائزة'
      };
    }

    // تحديث رصيد النقاط
    const newAvailablePoints = userPoints.available_points - pointsRequired;
    const newSpentPoints = userPoints.spent_points + pointsRequired;

    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        available_points: newAvailablePoints,
        spent_points: newSpentPoints
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // إضافة سجل في تاريخ النقاط
    const { error: historyError } = await supabase
      .from('points_history')
      .insert([{
        user_id: userId,
        points: -pointsRequired,
        action_type: 'reward_redemption',
        reference_id: rewardId,
        description: 'استبدال جائزة'
      }]);

    if (historyError) throw historyError;

    // إضافة طلب الجائزة
    const { error: rewardError } = await supabase
      .from('user_rewards')
      .insert([{
        user_id: userId,
        reward_id: rewardId,
        points_spent: pointsRequired,
        status: 'pending'
      }]);

    if (rewardError) throw rewardError;

    return {
      success: true,
      availablePoints: newAvailablePoints
    };
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return { success: false, error: error.message };
  }
};
