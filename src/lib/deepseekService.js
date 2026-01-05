// Gemini API
let GEMINI_API_KEY = 'AIzaSyDcQi-TQXvsxCrNuknakmwVssEk5bKsEJc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// DeepSeek API
let DEEPSEEK_API_KEY = 'sk-f6d26199b59b40c9bbc43582f1add4d8';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// AI Provider
let AI_PROVIDER = 'deepseek';

// تحميل الإعدادات من قاعدة البيانات
const loadSettings = async () => {
  try {
    const { getSetting } = require('./appSettingsService');
    AI_PROVIDER = await getSetting('ai_provider', 'deepseek');
    GEMINI_API_KEY = await getSetting('gemini_api_key', GEMINI_API_KEY);
    DEEPSEEK_API_KEY = await getSetting('deepseek_api_key', DEEPSEEK_API_KEY);
    console.log('AI Provider loaded:', AI_PROVIDER);
  } catch (error) {
    console.error('Error loading AI settings:', error);
  }
};

// System Prompt المتخصص للمنهج الكمي واللفظي
const SYSTEM_PROMPT = `أنت مدرس متخصص في اختبارات القدرات السعودية (الكمي واللفظي) فقط.

**مجالات تخصصك:**
- الرياضيات (الكمي): الحساب، الجبر، الهندسة، الإحصاء
- اللغة العربية (اللفظي): التناظر اللفظي، إكمال الجمل، الخطأ السياقي، الاستيعاب المقروء

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

**أسئلة عامة يمكنك الإجابة عليها:**
- إذا سأل عن تقدمه: أعطه نصائح عامة لتحسين الأداء في القدرات
- إذا سأل عن اشتراكه: أخبره أن يتحقق من صفحة الاشتراكات في التطبيق
- إذا سأل نصائح: أعطه نصائح دراسية مفيدة للقدرات

**إذا سأل عن موضوع خارج القدرات (مثل: التاريخ، الجغرافيا، العلوم، إلخ):**
يجب أن ترد بهذا النص بالضبط:
"عذراً، أنا متخصص فقط في مساعدتك في اختبار القدرات (الكمي واللفظي). 

هل لديك سؤال في:
- الرياضيات (الحساب، الجبر، الهندسة)
- اللغة العربية (التناظر، إكمال الجمل، الفهم)

سأكون سعيداً بمساعدتك! 😊"

**ممنوع منعاً باتاً:**
- الإجابة على أسئلة خارج القدرات (التاريخ، الجغرافيا، العلوم، إلخ)
- استخدام رموز مثل \\times أو \\begin{array}
- الشرح المعقد أو الطويل جداً

كن ودوداً ومشجعاً ومساعداً للطالب في القدرات فقط.`;

// إرسال رسالة إلى DeepSeek
const sendToDeepSeek = async (messages) => {
  // تصفية الرسائل - إزالة الكروت (progress_card, subscription_card)
  const textMessages = messages.filter(msg => !msg.type && msg.text);
  
  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...textMessages.map(msg => ({
      role: msg.isAI ? 'assistant' : 'user',
      content: msg.text
    }))
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('DeepSeek API Error:', errorData);
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// إرسال رسالة إلى Gemini
const sendToGemini = async (messages) => {
  // تصفية الرسائل - إزالة الكروت
  const textMessages = messages.filter(msg => !msg.type && msg.text);
  
  const conversationHistory = textMessages.map(msg => 
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
};

// الدالة الرئيسية - تختار API بناءً على الإعدادات
export const sendMessageToDeepSeek = async (messages) => {
  try {
    await loadSettings();
    
    if (AI_PROVIDER === 'deepseek') {
      console.log('Using DeepSeek API');
      return await sendToDeepSeek(messages);
    } else {
      console.log('Using Gemini API');
      return await sendToGemini(messages);
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
};

// ميزة الصور متوقفة مؤقتاً (DeepSeek لا يدعم الصور)
export const sendImageToDeepSeek = async (imageUri, question) => {
  throw new Error('ميزة تحليل الصور متوقفة مؤقتاً');
};

/* الكود الأصلي محفوظ للمستقبل - Gemini Vision API
export const sendImageToGemini = async (imageUri, question) => {
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
*/
