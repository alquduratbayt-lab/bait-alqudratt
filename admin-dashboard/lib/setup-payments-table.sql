-- إنشاء جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  moyasar_payment_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
  payment_method TEXT,
  card_brand TEXT,
  card_last_four TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_moyasar_id ON payments(moyasar_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- تفعيل RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين بقراءة مدفوعاتهم فقط
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للإداريين بكل شيء
CREATE POLICY "Admins can do everything on payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.type = 'admin'
    )
  );

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- إضافة تعليقات توضيحية
COMMENT ON TABLE payments IS 'جدول المدفوعات من بوابة ميسر';
COMMENT ON COLUMN payments.moyasar_payment_id IS 'معرّف الدفع من ميسر';
COMMENT ON COLUMN payments.status IS 'حالة الدفع: paid, failed, pending, refunded';
COMMENT ON COLUMN payments.payment_method IS 'طريقة الدفع: creditcard, applepay, stcpay';
