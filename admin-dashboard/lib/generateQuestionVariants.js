const GEMINI_API_KEY = 'AIzaSyDh6OS15kOr-1idBbGkYh_BZLgYC-PGaXU';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const VARIANT_GENERATION_PROMPT = `أنت مساعد لتوليد نماذج بديلة للأسئلة.

مهمتك: ولّد نسخ بديلة من السؤال بصيغة مختلفة مع الحفاظ على المعنى.

قواعد مهمة جداً:
1. غيّر صيغة السؤال والخيارات بطرق مختلفة
2. احتفظ بنفس الإجابة الصحيحة (نفس الرقم: 0, 1, 2, أو 3)
3. إذا وجدت [EQUATION:url] في السؤال، احتفظ به بالضبط كما هو
4. أرجع JSON Array فقط بدون أي نص إضافي
5. ابدأ مباشرة بـ [ وانتهي بـ ]

مثال 1 (سؤال عادي):
السؤال: "ما ناتج 5 + 3؟"
الخيارات: ["8", "7", "9", "6"]
الإجابة: 0

النماذج:
[{"question_text":"احسب مجموع 5 و 3","options":["8","7","9","6"],"correct_answer":0},{"question_text":"كم يساوي 5 + 3؟","options":["8","7","9","6"],"correct_answer":0}]

مثال 2 (سؤال بمعادلة):
السؤال: "ما قيمة [EQUATION:url]؟"
الخيارات: ["5", "6", "7", "8"]
الإجابة: 1

النماذج:
[{"question_text":"احسب قيمة [EQUATION:url]","options":["5","6","7","8"],"correct_answer":1},{"question_text":"أوجد [EQUATION:url]","options":["5","6","7","8"],"correct_answer":1}]

الآن ولّد نماذج للسؤال التالي:`;

export async function generateQuestionVariants(question, numVariants = 3) {
  try {
    const prompt = `${VARIANT_GENERATION_PROMPT}

السؤال الأصلي:
"${question.question_text}"

الخيارات: ${JSON.stringify(question.options)}
الإجابة الصحيحة: ${question.correct_answer}

المطلوب: ولّد ${numVariants} نماذج بديلة.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // التحقق من وجود البيانات
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid API response structure');
    }
    
    let content = data.candidates[0].content.parts[0].text;
    
    // تنظيف الرد من markdown والنصوص الإضافية
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // استخراج JSON من الرد - البحث عن أول [ وآخر ]
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    
    if (firstBracket === -1 || lastBracket === -1) {
      console.error('AI Response:', content);
      throw new Error('Failed to find JSON array in AI response');
    }
    
    let jsonString = content.substring(firstBracket, lastBracket + 1);
    
    // تنظيف JSON من المشاكل الشائعة
    // 1. إزالة النصوص العربية خارج الـ strings
    // 2. إصلاح الأقواس المكسورة
    jsonString = jsonString
      .replace(/\n/g, ' ')  // إزالة الأسطر الجديدة
      .replace(/\s+/g, ' ')  // تقليل المسافات المتعددة
      .replace(/,\s*]/g, ']')  // إزالة الفواصل قبل ]
      .replace(/,\s*}/g, '}'); // إزالة الفواصل قبل }
    
    let variants;
    try {
      variants = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Extracted JSON:', jsonString);
      
      // محاولة أخيرة: إزالة أي نص بعد آخر }]
      const lastClosing = jsonString.lastIndexOf('}]');
      if (lastClosing !== -1) {
        jsonString = jsonString.substring(0, lastClosing + 2);
        try {
          variants = JSON.parse(jsonString);
        } catch (e) {
          throw new Error('Invalid JSON format from AI');
        }
      } else {
        throw new Error('Invalid JSON format from AI');
      }
    }
    
    // التحقق من صحة البيانات
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('Invalid variants format');
    }
    
    return variants;
  } catch (error) {
    console.error('Error generating question variants:', error);
    throw error;
  }
}

// دالة لحفظ النسخ البديلة في قاعدة البيانات
export async function saveQuestionVariants(supabase, originalQuestionId, variants) {
  try {
    const variantsToInsert = variants.map((variant, index) => ({
      original_question_id: originalQuestionId,
      variant_number: index + 1, // 0 = الأصلي، 1-3 = البدائل
      question_text: variant.question_text,
      options: variant.options,
      correct_answer: variant.correct_answer,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('question_variants')
      .insert(variantsToInsert)
      .select();

    if (error) {
      console.error('Error saving variants:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in saveQuestionVariants:', error);
    throw error;
  }
}

// دالة لتوليد امتحان نهائي
export async function generateFinalExam(supabase, lessonId, numQuestions = 10) {
  try {
    // 1. جلب كل أسئلة الدرس
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        question_variants (*)
      `)
      .eq('lesson_id', lessonId);

    if (questionsError) throw questionsError;

    if (!questions || questions.length < numQuestions) {
      throw new Error(`Not enough questions. Found ${questions?.length || 0}, need ${numQuestions}`);
    }

    // 2. خلط الأسئلة عشوائياً
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    
    // 3. اختيار أول numQuestions
    const selectedQuestions = shuffledQuestions.slice(0, numQuestions);

    // 4. لكل سؤال، اختيار نسخة عشوائية
    const examQuestions = selectedQuestions.map((q, index) => {
      // جمع السؤال الأصلي + نسخه البديلة
      const allVariants = [
        {
          id: null, // السؤال الأصلي ليس له variant_id
          question_text: q.question_text,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correct_answer: q.correct_answer,
          original_question_id: q.id
        },
        ...(q.question_variants || [])
      ];

      // اختيار نسخة عشوائية
      const randomVariant = allVariants[Math.floor(Math.random() * allVariants.length)];
      
      return {
        variant: randomVariant,
        order_number: index + 1
      };
    });

    // 5. إنشاء الامتحان
    const { data: exam, error: examError } = await supabase
      .from('final_exams')
      .insert({
        lesson_id: lessonId,
        title: `امتحان نهائي - ${new Date().toLocaleDateString('ar-SA')}`,
        total_questions: numQuestions,
        passing_score: 70,
        time_limit_minutes: numQuestions * 2 // دقيقتين لكل سؤال
      })
      .select()
      .single();

    if (examError) throw examError;

    // 6. حفظ أسئلة الامتحان
    // أولاً: نحفظ النسخ البديلة التي ليس لها ID
    const variantsToCreate = examQuestions
      .filter(eq => !eq.variant.id)
      .map(eq => ({
        original_question_id: eq.variant.original_question_id,
        variant_number: 0, // السؤال الأصلي
        question_text: eq.variant.question_text,
        options: eq.variant.options,
        correct_answer: eq.variant.correct_answer,
        is_active: true
      }));

    let createdVariants = [];
    if (variantsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('question_variants')
        .insert(variantsToCreate)
        .select();
      
      if (error) throw error;
      createdVariants = data;
    }

    // ثانياً: نربط الأسئلة بالامتحان
    const examQuestionsToInsert = examQuestions.map((eq, index) => {
      let variantId = eq.variant.id;
      
      // إذا كان السؤال الأصلي، نستخدم الـ ID المنشأ حديثاً
      if (!variantId) {
        const createdVariant = createdVariants.find(
          v => v.original_question_id === eq.variant.original_question_id
        );
        variantId = createdVariant?.id;
      }

      return {
        exam_id: exam.id,
        question_variant_id: variantId,
        order_number: eq.order_number
      };
    });

    const { error: questionsInsertError } = await supabase
      .from('exam_questions')
      .insert(examQuestionsToInsert);

    if (questionsInsertError) throw questionsInsertError;

    return exam;
  } catch (error) {
    console.error('Error generating final exam:', error);
    throw error;
  }
}
