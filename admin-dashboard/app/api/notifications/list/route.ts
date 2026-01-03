import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // جلب إشعارات الطلاب
    const { data: studentNotifs, error: studentError } = await supabase
      .from('student_notifications')
      .select('*, users!student_notifications_student_id_fkey(id, name, email, phone, type)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (studentError) {
      console.error('Error fetching student notifications:', studentError);
    }

    // جلب إشعارات أولياء الأمور
    const { data: parentNotifs, error: parentError } = await supabase
      .from('parent_notifications')
      .select('*, users!parent_notifications_parent_id_fkey(id, name, email, phone, type)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (parentError) {
      console.error('Error fetching parent notifications:', parentError);
    }

    // دمج وترتيب الإشعارات
    const allNotifications = [
      ...(studentNotifs || []).map(n => ({
        ...n,
        recipient_type: 'student',
        recipient_name: n.users?.name || 'غير معروف',
      })),
      ...(parentNotifs || []).map(n => ({
        ...n,
        recipient_type: 'parent',
        recipient_name: n.users?.name || 'غير معروف',
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      notifications: allNotifications,
      count: allNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
