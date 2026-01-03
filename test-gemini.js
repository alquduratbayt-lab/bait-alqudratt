// اختبار جميع نماذج Gemini المتاحة
const GEMINI_API_KEY = 'AIzaSyBo2CokRGnK8WdIyH6ONmJEhTQfDgzajP4';

const models = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro'
];

async function testModel(modelName, apiVersion) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent`;
  
  try {
    const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'اشرح 2+2'
          }]
        }]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${modelName} (${apiVersion}): يعمل!`);
      return true;
    } else {
      console.log(`❌ ${modelName} (${apiVersion}): لا يعمل`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${modelName} (${apiVersion}): خطأ`);
    return false;
  }
}

async function findWorkingModel() {
  console.log('جاري اختبار النماذج المتاحة...\n');
  
  for (const model of models) {
    // جرب v1beta أولاً
    const v1betaWorks = await testModel(model, 'v1beta');
    if (v1betaWorks) {
      console.log(`\n🎯 النموذج الذي يعمل: ${model} مع v1beta`);
      return;
    }
    
    // جرب v1
    const v1Works = await testModel(model, 'v1');
    if (v1Works) {
      console.log(`\n🎯 النموذج الذي يعمل: ${model} مع v1`);
      return;
    }
  }
  
  console.log('\n❌ لم يتم العثور على نموذج يعمل');
}

findWorkingModel();
