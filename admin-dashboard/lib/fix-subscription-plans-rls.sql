-- إصلاح RLS policies لجدول subscription_plans للسماح للإداريين بالإضافة والتعديل والحذف

-- حذف جميع Policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Admins can do everything on subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can view all subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can insert subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can update subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can delete subscription_plans" ON subscription_plans;

-- إنشاء Policies منفصلة لكل عملية
-- Policy للقراءة (SELECT)
CREATE POLICY "Admins can view all subscription_plans"
  ON subscription_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Policy للإضافة (INSERT)
CREATE POLICY "Admins can insert subscription_plans"
  ON subscription_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Policy للتعديل (UPDATE)
CREATE POLICY "Admins can update subscription_plans"
  ON subscription_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Policy للحذف (DELETE)
CREATE POLICY "Admins can delete subscription_plans"
  ON subscription_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );
