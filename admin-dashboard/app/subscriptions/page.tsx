'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '30',
    features: [''],
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);
      setPlans(result.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('حدث خطأ في جلب الباقات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days),
        features: formData.features.filter(f => f.trim() !== ''),
        is_active: formData.is_active,
      };

      let response;
      if (editingPlan) {
        response = await fetch('/api/subscription-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPlan.id, ...planData }),
        });
      } else {
        response = await fetch('/api/subscription-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData),
        });
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // إعادة جلب البيانات أولاً
      await fetchPlans();
      
      // ثم إغلاق النموذج وإعادة تعيين الحالة
      setShowForm(false);
      setEditingPlan(null);
      resetForm();
      
      alert(editingPlan ? 'تم تحديث الباقة بنجاح' : 'تم إضافة الباقة بنجاح');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('حدث خطأ في حفظ الباقة');
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      features: plan.features.length > 0 ? plan.features : [''],
      is_active: plan.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      const response = await fetch(`/api/subscription-plans?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert('تم حذف الباقة بنجاح');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('حدث خطأ في حذف الباقة');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_days: '30',
      features: [''],
      is_active: true,
    });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <DashboardLayout title="إدارة الاشتراكات">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة الاشتراكات</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingPlan(null);
              resetForm();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            + إضافة باقة جديدة
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingPlan ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
              </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">اسم الباقة</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none text-gray-800 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">السعر (ريال)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none text-gray-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none text-gray-800 font-medium"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">المدة (بالأيام)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none text-gray-800 font-medium"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">المميزات</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none text-gray-800 font-bold placeholder:text-gray-900 placeholder:font-bold"
                      placeholder="أدخل ميزة"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  + إضافة ميزة
                </button>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold text-gray-700">الباقة نشطة</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold text-base shadow-lg"
                >
                  {editingPlan ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-bold text-base"
                >
                  إلغاء
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      plan.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plan.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-black">{plan.price}</span>
                  <span className="text-black mr-1">ريال</span>
                  <span className="text-sm text-black block">
                    لمدة {plan.duration_days} يوم
                  </span>
                </div>

                {plan.description && (
                  <p className="text-black text-sm mb-4">{plan.description}</p>
                )}

                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2 text-black">المميزات:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-black flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            لا توجد باقات اشتراك. قم بإضافة باقة جديدة للبدء.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
