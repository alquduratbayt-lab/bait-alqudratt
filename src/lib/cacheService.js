import AsyncStorage from '@react-native-async-storage/async-storage';

// مدة صلاحية الـ Cache (5 دقائق)
const CACHE_DURATION = 5 * 60 * 1000;

// Memory Cache - للوصول الفوري (0ms)
const memoryCache = {};

/**
 * حفظ البيانات في الـ Cache (Memory + AsyncStorage)
 */
export const setCache = async (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    
    // حفظ في Memory Cache (فوري)
    memoryCache[key] = cacheData;
    
    // حفظ في AsyncStorage (للاستمرارية)
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * جلب البيانات من الـ Cache
 * يحاول Memory Cache أولاً (فوري)، ثم AsyncStorage
 */
export const getCache = async (key, maxAge = CACHE_DURATION) => {
  try {
    // محاولة جلب من Memory Cache أولاً (0ms!)
    if (memoryCache[key]) {
      const { data, timestamp } = memoryCache[key];
      const age = Date.now() - timestamp;
      
      if (age <= maxAge) {
        console.log(`⚡ Memory cache hit: ${key}`);
        return data;
      } else {
        // انتهت الصلاحية - حذف من Memory
        delete memoryCache[key];
      }
    }
    
    // جلب من AsyncStorage (بطيء - فقط إذا لم يوجد في Memory)
    const cached = await AsyncStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // إذا انتهت الصلاحية
    if (age > maxAge) {
      await AsyncStorage.removeItem(`cache_${key}`);
      return null;
    }

    // حفظ في Memory للمرات القادمة
    memoryCache[key] = { data, timestamp };
    console.log(`💾 Loaded from AsyncStorage to Memory: ${key}`);
    
    return data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

/**
 * حذف الـ Cache (Memory + AsyncStorage)
 */
export const clearCache = async (key) => {
  try {
    // حذف من Memory Cache
    delete memoryCache[key];
    
    // حذف من AsyncStorage
    await AsyncStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * حذف كل الـ Cache (Memory + AsyncStorage)
 */
export const clearAllCache = async () => {
  try {
    // حذف كل Memory Cache
    Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
    
    // حذف من AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * جلب البيانات مع Cache
 * يحاول جلب من الـ Cache أولاً، إذا لم يجد يجلب من الـ API
 */
export const fetchWithCache = async (key, fetchFunction, maxAge = CACHE_DURATION) => {
  // محاولة جلب من الـ Cache
  const cached = await getCache(key, maxAge);
  if (cached) {
    console.log(`✅ Cache hit: ${key}`);
    return cached;
  }

  // جلب من الـ API
  console.log(`🔄 Cache miss: ${key} - fetching from API`);
  const data = await fetchFunction();
  
  // حفظ في الـ Cache
  await setCache(key, data);
  
  return data;
};

/**
 * تحديث الـ Cache في الخلفية
 */
export const refreshCacheInBackground = async (key, fetchFunction) => {
  try {
    const data = await fetchFunction();
    await setCache(key, data);
    console.log(`🔄 Background refresh: ${key}`);
  } catch (error) {
    console.error('Error refreshing cache:', error);
  }
};
