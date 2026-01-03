import { supabase } from './supabase';

/**
 * تحويل LaTeX إلى صورة ورفعها على Supabase Storage
 * @param latex - كود LaTeX
 * @returns رابط الصورة المرفوعة
 */
export async function latexToImage(latex: string): Promise<string> {
  try {
    // تنظيف LaTeX
    const cleanLatex = latex.trim();
    
    // إنشاء URL لـ API الذي يحول LaTeX إلى صورة
    const apiUrl = `https://latex.codecogs.com/png.latex?\\dpi{150}\\bg_white ${encodeURIComponent(cleanLatex)}`;
    
    // تحميل الصورة من API
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to generate LaTeX image');
    }
    
    const blob = await response.blob();
    
    // إنشاء اسم فريد للملف
    const fileName = `equation_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    
    // رفع الصورة على Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equations')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // الحصول على الرابط العام
    const { data: { publicUrl } } = supabase.storage
      .from('equations')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in latexToImage:', error);
    throw error;
  }
}

/**
 * حذف صورة معادلة من Storage
 * @param imageUrl - رابط الصورة
 */
export async function deleteEquationImage(imageUrl: string): Promise<void> {
  try {
    // استخراج اسم الملف من الرابط
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;
    
    const { error } = await supabase.storage
      .from('equations')
      .remove([fileName]);
    
    if (error) {
      console.error('Delete error:', error);
    }
  } catch (error) {
    console.error('Error deleting equation image:', error);
  }
}
