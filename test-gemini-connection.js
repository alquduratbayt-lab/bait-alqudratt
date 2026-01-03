// اختبار اتصال Gemini API
const GEMINI_API_KEY = 'AIzaSyDcQi-TQXvsxCrNuknakmwVssEk5bKsEJc';

// أولاً: اختبار قائمة الموديلات المتاحة
async function listAvailableModels() {
  console.log('📋 جاري جلب قائمة الموديلات المتاحة...\n');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ خطأ في جلب الموديلات:', JSON.stringify(errorData, null, 2));
      return [];
    }
    
    const data = await response.json();
    console.log('✅ تم جلب الموديلات بنجاح!\n');
    
    if (data.models && data.models.length > 0) {
      console.log('📋 الموديلات المتاحة:');
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
      });
      console.log('');
      return data.models.map(m => m.name.replace('models/', ''));
    } else {
      console.log('⚠️ لا توجد موديلات متاحة');
      return [];
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    return [];
  }
}

// قائمة الموديلات للاختبار اليدوي
const FALLBACK_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro',
  'gemini-1.0-pro'
];

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  try {
    const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'مرحباً، قل لي: تم الاتصال بنجاح'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        model: modelName,
        response: data.candidates[0].content.parts[0].text
      };
    } else {
      return {
        success: false,
        model: modelName,
        error: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      model: modelName,
      error: error.message
    };
  }
}

async function testGeminiConnection() {
  console.log('🔍 اختبار اتصال Gemini API...\n');
  console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 20) + '...\n');

  // جلب قائمة الموديلات المتاحة
  const availableModels = await listAvailableModels();
  
  const modelsToTest = availableModels.length > 0 ? availableModels : FALLBACK_MODELS;
  
  if (availableModels.length === 0) {
    console.log('⚠️ لم نتمكن من جلب الموديلات. سنجرب الموديلات الافتراضية...\n');
  }

  console.log('🧪 بدء اختبار الموديلات...\n');

  for (const model of modelsToTest) {
    console.log(`📡 اختبار ${model}...`);
    const result = await testModel(model);
    
    if (result.success) {
      console.log(`✅ نجح! الموديل: ${result.model}`);
      console.log(`📝 الرد: ${result.response}\n`);
      console.log(`\n🎉 الاتصال ناجح مع الموديل: ${result.model}`);
      console.log(`\n📋 استخدم هذا في الكود:`);
      console.log(`const GEMINI_API_KEY = '${GEMINI_API_KEY}';`);
      console.log(`const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/${result.model}:generateContent';\n`);
      return;
    } else {
      console.log(`❌ فشل (${result.error})\n`);
    }
  }

  console.log('❌ جميع الموديلات فشلت.');
  console.log('\n💡 تحقق من:');
  console.log('  1. API Key صحيح');
  console.log('  2. تم تفعيل Gemini API في Google Cloud Console');
  console.log('  3. لديك رصيد كافٍ في الحساب');
}

testGeminiConnection();
