import { supabase } from '../lib/supabase';

export const sendOTP = async (phone, userName = null) => {
  try {
    console.log('📤 Calling send-otp Edge Function with:', { phone, userName });
    
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { phone, userName, purpose: 'registration' },
    });

    console.log('📥 send-otp response data:', JSON.stringify(data));
    console.log('📥 send-otp response error:', error);

    if (error) {
      console.error('Edge Function error:', error);
      let errorMessage = 'فشل إرسال رمز التحقق';
      if (error.context) {
        try {
          const errorBody = await error.context.json();
          console.error('Edge Function error body:', JSON.stringify(errorBody));
          errorMessage = errorBody.error || errorMessage;
        } catch (e) {
          const errorText = await error.context.text();
          console.error('Edge Function error text:', errorText);
        }
      }
      throw new Error(errorMessage);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'فشل إرسال رمز التحقق');
    }

    console.log('✅ تم إرسال رمز التحقق بنجاح');
    return { success: true, phone };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const sendOTPForPasswordReset = async (phone, userName = null) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { phone, userName, purpose: 'password_reset' },
    });

    if (error) {
      console.error('Edge Function error:', error);
      let errorMessage = 'فشل إرسال رمز التحقق';
      if (error.context) {
        try {
          const errorBody = await error.context.json();
          console.error('Edge Function error body:', JSON.stringify(errorBody));
          errorMessage = errorBody.error || errorMessage;
        } catch (e) {
          const errorText = await error.context.text();
          console.error('Edge Function error text:', errorText);
        }
      }
      throw new Error(errorMessage);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'فشل إرسال رمز التحقق');
    }

    console.log('✅ تم إرسال رمز التحقق بنجاح');
    return { success: true, phone };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (phone, code) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { phone, code },
    });

    if (error) {
      console.error('Edge Function error:', error);
      if (error.context) {
        try {
          const errorBody = await error.context.json();
          console.error('Edge Function error body:', JSON.stringify(errorBody));
          return { success: false, message: errorBody.error || 'حدث خطأ أثناء التحقق' };
        } catch (e) {
          // ignore parse error
        }
      }
      return { success: false, message: 'حدث خطأ أثناء التحقق' };
    }

    return {
      success: data?.success ?? false,
      message: data?.message || (data?.success ? 'تم التحقق بنجاح' : 'رمز التحقق غير صحيح'),
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'حدث خطأ أثناء التحقق' };
  }
};
