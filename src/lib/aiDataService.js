import { supabase } from './supabase';

/**
 * جلب تقدم الطالب في الدروس والاختبارات
 */
export const getStudentProgress = async (userId) => {
  try {
    // جلب الدروس المكتملة
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);

    if (progressError) throw progressError;

    // جلب جميع الدروس لحساب الإجمالي
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id');

    if (lessonsError) throw lessonsError;

    // جلب نتائج اختبار تحديد المستوى
    const { data: placementTest, error: testsError } = await supabase
      .from('placement_test_results')
      .select('quantitative_percentage, verbal_percentage, completed_at')
      .eq('user_id', userId)
      .single();

    if (testsError && testsError.code !== 'PGRST116') {
      console.log('Placement test error:', testsError);
    }

    // حساب المعدل من اختبار تحديد المستوى
    let averageScore = 0;
    let totalTests = 0;
    if (placementTest) {
      const quantScore = placementTest.quantitative_percentage || 0;
      const verbalScore = placementTest.verbal_percentage || 0;
      averageScore = Math.round((quantScore + verbalScore) / 2);
      totalTests = 1; // اختبار واحد فقط (تحديد المستوى)
    }

    // جلب النقاط
    const { data: pointsData, error: pointsError } = await supabase
      .from('points_transactions')
      .select('points')
      .eq('user_id', userId);

    if (pointsError) throw pointsError;

    const totalPoints = pointsData?.reduce((sum, t) => sum + t.points, 0) || 0;

    return {
      completedLessons: progress?.length || 0,
      totalLessons: allLessons?.length || 30,
      averageScore,
      totalTests,
      totalPoints,
      placementTest: placementTest || null
    };
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return {
      completedLessons: 0,
      totalLessons: 30,
      averageScore: 0,
      totalTests: 0,
      totalPoints: 0,
      placementTest: null
    };
  }
};

/**
 * جلب معلومات اشتراك الطالب
 */
export const getSubscriptionInfo = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, email, subscription_tier, subscription_end, subscription_status')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // حساب الأيام المتبقية
    let daysRemaining = 0;
    if (data.subscription_end) {
      const endDate = new Date(data.subscription_end);
      const today = new Date();
      const diffTime = endDate - today;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
    }

    return {
      name: data.name,
      email: data.email,
      tier: data.subscription_tier || 'free',
      endDate: data.subscription_end,
      status: data.subscription_status || 'inactive',
      daysRemaining
    };
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return {
      name: '',
      email: '',
      tier: 'free',
      endDate: null,
      status: 'inactive',
      daysRemaining: 0
    };
  }
};

/**
 * جلب معلومات عامة عن الطالب
 */
export const getStudentInfo = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, email, phone, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      name: data.name,
      email: data.email,
      phone: data.phone,
      joinDate: data.created_at
    };
  } catch (error) {
    console.error('Error fetching student info:', error);
    return {
      name: '',
      email: '',
      phone: '',
      joinDate: null
    };
  }
};
