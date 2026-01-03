import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // جلب إحصائيات الإشعارات من جدول student_notifications
    const { data: studentNotifs, error: studentError } = await supabase
      .from('student_notifications')
      .select('id, created_at, is_read', { count: 'exact' });

    if (studentError) {
      console.error('Error fetching student notifications:', studentError);
    }

    // جلب إحصائيات الإشعارات من جدول parent_notifications
    const { data: parentNotifs, error: parentError } = await supabase
      .from('parent_notifications')
      .select('id, created_at, is_read', { count: 'exact' });

    if (parentError) {
      console.error('Error fetching parent notifications:', parentError);
    }

    // حساب الإحصائيات
    const studentTotal = studentNotifs?.length || 0;
    const parentTotal = parentNotifs?.length || 0;
    const totalNotifications = studentTotal + parentTotal;

    const studentRead = studentNotifs?.filter(n => n.is_read).length || 0;
    const parentRead = parentNotifs?.filter(n => n.is_read).length || 0;
    const totalRead = studentRead + parentRead;
    const totalUnread = totalNotifications - totalRead;

    // حساب الإشعارات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const studentToday = studentNotifs?.filter(n => new Date(n.created_at) >= today).length || 0;
    const parentToday = parentNotifs?.filter(n => new Date(n.created_at) >= today).length || 0;
    const todayTotal = studentToday + parentToday;

    // حساب الإشعارات هذا الأسبوع
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const studentWeek = studentNotifs?.filter(n => new Date(n.created_at) >= weekAgo).length || 0;
    const parentWeek = parentNotifs?.filter(n => new Date(n.created_at) >= weekAgo).length || 0;
    const weekTotal = studentWeek + parentWeek;

    // حساب الإشعارات هذا الشهر
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const studentMonth = studentNotifs?.filter(n => new Date(n.created_at) >= monthAgo).length || 0;
    const parentMonth = parentNotifs?.filter(n => new Date(n.created_at) >= monthAgo).length || 0;
    const monthTotal = studentMonth + parentMonth;

    return NextResponse.json({
      success: true,
      stats: {
        total: totalNotifications,
        read: totalRead,
        unread: totalUnread,
        students: {
          total: studentTotal,
          read: studentRead,
          unread: studentTotal - studentRead,
        },
        parents: {
          total: parentTotal,
          read: parentRead,
          unread: parentTotal - parentRead,
        },
        timeframes: {
          today: todayTotal,
          week: weekTotal,
          month: monthTotal,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification stats' },
      { status: 500 }
    );
  }
}
