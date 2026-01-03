import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/adminAuth';
import { ActivityLogger } from '@/lib/activityLogger';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const result = await loginAdmin(email, password);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // حفظ بيانات المشرف في الكوكيز
    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify(result.admin), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // أسبوع
      path: '/',
    });

    // تسجيل النشاط
    if (result.admin) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await ActivityLogger.login(result.admin.id, email, ipAddress);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
