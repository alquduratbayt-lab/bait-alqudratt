const GEMINI_API_KEY = 'AIzaSyDh6OS15kOr-1idBbGkYh_BZLgYC-PGaXU';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testAPI() {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'قل مرحبا'
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', JSON.stringify(errorData, null, 2));
      return false;
    }

    const data = await response.json();
    console.log('✅ API يعمل بنجاح!');
    console.log('الرد:', data.candidates[0].content.parts[0].text);
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    return false;
  }
}

testAPI();
