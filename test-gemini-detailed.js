// اختبار مفصل لـ Gemini API مع عرض تفاصيل الخطأ الكاملة
const GEMINI_API_KEY = 'AIzaSyDcQi-TQXvsxCrNuknakmwVssEk5bKsEJc';

async function testGeminiDetailed() {
  console.log('🔍 اختبار مفصل لـ Gemini API\n');
  console.log('API Key:', GEMINI_API_KEY.substring(0, 20) + '...\n');

  const testCases = [
    {
      name: 'gemini-pro (v1beta)',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    },
    {
      name: 'gemini-1.5-pro (v1beta)',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
    },
    {
      name: 'gemini-1.5-flash (v1beta)',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    },
    {
      name: 'gemini-pro (v1)',
      url: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
    },
    {
      name: 'gemini-1.5-pro (v1)',
      url: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent'
    },
    {
      name: 'gemini-1.5-flash (v1)',
      url: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 اختبار: ${testCase.name}`);
    console.log(`🔗 URL: ${testCase.url}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      const requestBody = {
        contents: [{
          parts: [{
            text: 'اشرح 2+2'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };

      console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${testCase.url}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
      console.log(`📥 Response Headers:`, Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('\n✅ SUCCESS!');
        console.log('📄 Response:', JSON.stringify(data, null, 2));
        console.log('\n🎯 النموذج الذي يعمل:', testCase.name);
        console.log('🔗 URL الصحيح:', testCase.url);
        return; // توقف عند أول نموذج يعمل
      } else {
        console.log('\n❌ FAILED');
        console.log('📄 Error Response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          console.log('\n🔍 تفاصيل الخطأ:');
          console.log('   - Code:', errorData.error?.code);
          console.log('   - Status:', errorData.error?.status);
          console.log('   - Message:', errorData.error?.message);
          if (errorData.error?.details) {
            console.log('   - Details:', JSON.stringify(errorData.error.details, null, 2));
          }
        } catch (e) {
          console.log('⚠️  لا يمكن تحليل رسالة الخطأ');
        }
      }
    } catch (error) {
      console.log('\n💥 EXCEPTION:', error.message);
      console.log('Stack:', error.stack);
    }
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ لم يتم العثور على أي نموذج يعمل');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testGeminiDetailed();
