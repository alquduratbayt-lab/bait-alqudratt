import { supabase } from './supabase';

/**
 * جلب معلومات اشتراك المستخدم الحالي
 */
export const getUserSubscription = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, subscription_end')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    
    // التحقق من انتهاء الاشتراك
    if (data?.subscription_end) {
      const endDate = new Date(data.subscription_end);
      const today = new Date();
      if (endDate < today) {
        // الاشتراك منتهي - نعامله كـ free
        console.log('⚠️ الاشتراك منتهي في:', data.subscription_end);
        return { ...data, subscription_tier: 'free', isExpired: true };
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
};

/**
 * التحقق من صلاحية الوصول للمعلم الذكي
 */
export const canAccessAITeacher = async () => {
  const subscription = await getUserSubscription();
  // المعلم الذكي متاح فقط للمشتركين (basic, premium)
  return subscription && subscription.subscription_tier !== 'free';
};

/**
 * التحقق من صلاحية الوصول لصفحة التدريب
 */
export const canAccessTraining = async () => {
  const subscription = await getUserSubscription();
  // يمكن تخصيص هذا من لوحة التحكم لاحقاً
  return subscription && subscription.subscription_tier === 'premium';
};

/**
 * التحقق من إمكانية رؤية البانرات
 */
export const canSeeBanners = (userTier, bannerTargets) => {
  if (!bannerTargets || bannerTargets.length === 0) return true;
  return bannerTargets.includes(userTier || 'free');
};

/**
 * الحصول على اسم الباقة بالعربية
 */
export const getSubscriptionName = (tier) => {
  const names = {
    free: 'مجاني',
    basic: 'أساسي',
    premium: 'مميز'
  };
  return names[tier] || 'غير محدد';
};

/**
 * التحقق من انتهاء الاشتراك
 */
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  if (subscription.subscription_tier === 'free') return true;
  return subscription.subscription_status === 'active' || subscription.subscription_status === 'نشط';
};
