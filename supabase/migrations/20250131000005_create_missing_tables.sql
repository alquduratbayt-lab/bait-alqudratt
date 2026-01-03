-- إنشاء جدول الاشتراكات
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('trial', 'monthly', 'yearly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول معاملات النقاط
CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول طلبات الجوائز
CREATE TABLE IF NOT EXISTS public.reward_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول تقدم المستخدم
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- إنشاء جدول التذاكر
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS لجميع الجداول
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- سياسات RLS - القراءة للجميع (للـ admin dashboard)
DROP POLICY IF EXISTS "Allow read access for all" ON public.subscriptions;
CREATE POLICY "Allow read access for all" ON public.subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for all" ON public.payments;
CREATE POLICY "Allow read access for all" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for all" ON public.points_transactions;
CREATE POLICY "Allow read access for all" ON public.points_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for all" ON public.reward_requests;
CREATE POLICY "Allow read access for all" ON public.reward_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for all" ON public.user_progress;
CREATE POLICY "Allow read access for all" ON public.user_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for all" ON public.tickets;
CREATE POLICY "Allow read access for all" ON public.tickets FOR SELECT USING (true);

-- سياسات الكتابة للمصادقين
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.subscriptions;
CREATE POLICY "Allow insert for authenticated users" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.payments;
CREATE POLICY "Allow insert for authenticated users" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.points_transactions;
CREATE POLICY "Allow insert for authenticated users" ON public.points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.reward_requests;
CREATE POLICY "Allow insert for authenticated users" ON public.reward_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_progress;
CREATE POLICY "Allow insert for authenticated users" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.tickets;
CREATE POLICY "Allow insert for authenticated users" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_points_user_id ON public.points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON public.reward_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
