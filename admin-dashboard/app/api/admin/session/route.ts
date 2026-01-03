import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminPermissions } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'لا توجد جلسة نشطة' },
        { status: 401 }
      );
    }

    const admin = JSON.parse(sessionCookie.value);

    // جلب الصلاحيات من قاعدة البيانات
    const permissions = await getAdminPermissions(admin.id);

    return NextResponse.json({ 
      success: true, 
      admin,
      permissions 
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب الجلسة' },
      { status: 500 }
    );
  }
}
