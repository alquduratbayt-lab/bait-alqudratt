import AsyncStorage from '@react-native-async-storage/async-storage';

// حفظ user_id
export const saveUserId = async (userId) => {
  try {
    await AsyncStorage.setItem('user_id', userId);
  } catch (error) {
    console.error('Error saving user_id:', error);
  }
};

// جلب user_id
export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    return userId;
  } catch (error) {
    console.error('Error getting user_id:', error);
    return null;
  }
};

// حذف user_id (عند تسجيل الخروج)
export const removeUserId = async () => {
  try {
    await AsyncStorage.removeItem('user_id');
  } catch (error) {
    console.error('Error removing user_id:', error);
  }
};
