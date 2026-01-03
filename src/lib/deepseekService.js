let GEMINI_API_KEY = 'AIzaSyDcQi-TQXvsxCrNuknakmwVssEk5bKsEJc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// تحميل API Key من الإعدادات
const loadApiKey = async () => {
  try {
    const { getSetting } = require('./appSettingsService');
    const apiKey = await getSetting('gemini_api_key', GEMINI_API_KEY);
    GEMINI_API_KEY = apiKey;
  } catch (error) {
    console.error('Error loading API key:', error);
  }
};

// System Prompt المتخصص للمنهج الكمي واللفظي
const SYSTEM_PROMPT = `أنت مدرس متخصص في اختبارات القدرات السعودية (الكمي واللفظي) فقط.

**أسلوب الشرح:**
1. استخدم لغة بسيطة وواضحة جداً مناسبة لطلاب الثانوية
2. اشرح خطوة بخطوة بطريقة سهلة الفهم
3. لا تستخدم رموز رياضية معقدة أو LaTeX
4. استخدم الأرقام والعمليات الحسابية بشكل مباشر
5. قسّم الحل إلى خطوات صغيرة ومرقمة
6. أعط مثال واحد واضح فقط

**مثال على الشرح الصحيح:**
السؤال: ستة ضرب 4678

الحل:
نحسب: 6 × 4678

الخطوة 1: نقسم العدد لتسهيل الحساب
4678 = 4000 + 600 + 70 + 8

الخطوة 2: نضرب كل جزء في 6
- 6 × 4000 = 24000
- 6 × 600 = 3600  
- 6 × 70 = 420
- 6 × 8 = 48

الخطوة 3: نجمع النتائج
24000 + 3600 + 420 + 48 = 28068

الجواب النهائي: 28068

**ممنوع:**
- استخدام رموز مثل \\times أو \\begin{array}
- الشرح المعقد أو الطويل جداً
- الإجابة على أسئلة خارج القدرات

**إذا سأل عن موضوع آخر:**
"عذراً، أنا متخصص في مساعدتك في اختبار القدرات فقط. هل لديك سؤال في الرياضيات أو اللغة العربية؟"

كن ودوداً ومشجعاً للطالب.`;

export const sendMessageToDeepSeek = async (messages) => {
  try {
    await loadApiKey();
    
    const conversationHistory = messages.map(msg => 
      `${msg.isAI ? 'المساعد' : 'الطالب'}: ${msg.text}`
    ).join('\n\n');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\n${conversationHistory}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

export const sendImageToDeepSeek = async (imageUri, question) => {
  try {
    // قراءة الصورة وتحويلها إلى base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64data = reader.result.split(',')[1];
          
          const apiResponse = await fetch(`${GEMINI_VISION_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nالطالب: ${question || 'اشرح لي هذا السؤال'}`
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64data
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
              }
            }),
          });

          if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error('Gemini Vision API Error:', errorData);
            throw new Error(`API Error: ${apiResponse.status}`);
          }

          const data = await apiResponse.json();
          resolve(data.candidates[0].content.parts[0].text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error sending image to Gemini:', error);
    throw error;
  }
};
