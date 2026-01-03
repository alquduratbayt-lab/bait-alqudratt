import { NextRequest, NextResponse } from 'next/server';
import { createAdmin, updateAdmin, deleteAdmin } from '@/lib/adminAuth';

// إنشاء مشرف جديد
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role_id, phone } = await request.json();

    if (!email || !password || !name || !role_id) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const result = await createAdmin(email, password, name, role_id, phone);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إنشاء المشرف' },
      { status: 500 }
    );
  }
}

// تحديث مشرف
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المشرف مطلوب' },
        { status: 400 }
      );
    }

    const result = await updateAdmin(id, updates);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث المشرف' },
      { status: 500 }
    );
  }
}

// حذف مشرف
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المشرف مطلوب' },
        { status: 400 }
      );
    }

    const result = await deleteAdmin(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف المشرف' },
      { status: 500 }
    );
  }
}
