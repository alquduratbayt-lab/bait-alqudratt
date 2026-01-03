import { supabase } from '../lib/supabase';

const TAQNYAT_API_KEY = 'c8e65955d35c71a71dd7c17a9da0e028';
const TAQNYAT_SENDER_NAME = 'BaitAlQudratt';
const TAQNYAT_API_URL = 'https://api.taqnyat.sa/v1/messages';

export const sendOTP = async (phone) => {
  try {
    // استخدام كود افتراضي مؤقتاً حتى يتم تفعيل اسم المرسل في تقنيات
    const otp = '5555';
    
    // حساب وقت انتهاء الصلاحية (5 دقائق)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // تنسيق رقم الهاتف
    const formattedPhone = phone.startsWith('+966') ? phone : `+966${phone}`;
    
    // حفظ OTP في قاعدة البيانات
    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert([
        {
          phone: formattedPhone,
          code: otp,
          expires_at: expiresAt,
          verified: false,
          attempts: 0,
        },
      ]);
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('فشل حفظ رمز التحقق');
    }
    
    // تعطيل إرسال SMS مؤقتاً - استخدام كود افتراضي
    console.log(`⚠️ وضع التطوير: استخدم الكود ${otp} للتحقق`);
    
    // محاولة إرسال SMS (اختياري - سيفشل لكن لن يوقف العملية)
    try {
      const message = `رمز التحقق الخاص بك: ${otp}\nصالح لمدة 5 دقائق`;
      
      const response = await fetch(TAQNYAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TAQNYAT_API_KEY}`,
        },
        body: JSON.stringify({
          recipients: [formattedPhone],
          body: message,
          sender: TAQNYAT_SENDER_NAME,
        }),
      });
      
      if (response.ok) {
        console.log('✅ تم إرسال SMS بنجاح');
      }
    } catch (smsError) {
      console.log('⚠️ فشل إرسال SMS - استخدم الكود الافتراضي:', otp);
    }
    
    return { success: true, phone: formattedPhone };
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (phone, code) => {
  try {
    const formattedPhone = phone.startsWith('+966') ? phone : `+966${phone}`;
    
    // البحث عن OTP في قاعدة البيانات
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return { success: false, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' };
    }
    
    // تحديث OTP كـ verified
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', data.id);
    
    if (updateError) {
      console.error('Error updating OTP:', updateError);
      return { success: false, message: 'حدث خطأ أثناء التحقق' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'حدث خطأ أثناء التحقق' };
  }
};
