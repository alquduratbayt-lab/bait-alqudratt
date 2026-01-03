import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة السهم للأسفل
const ChevronDownIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة السهم للأعلى
const ChevronUpIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15l-6-6-6 6" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const problemTypes = [
  'مشكلة في التسجيل أو إنشاء الحساب',
  'مشكلة في عرض الدروس',
  'مشكلة في الاشتراك',
  'مشكلة تقنية أخرى',
  'اقتراح لتحسين التطبيق',
  'استفسار عام',
];

export default function ParentTicketScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('new');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProblemTypeDropdown, setShowProblemTypeDropdown] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchTickets();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData, error } = await supabase
        .from('users')
        .select('name, phone, type')
        .eq('id', user.id)
        .single();

      if (userData) {
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setUserType('ولي الأمر');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى الصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return null;

    try {
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: fileName,
      });

      const { error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(fileName, formData, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('خطأ', 'فشل رفع الصورة. حاول مرة أخرى.');
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!problemType || !description.trim()) {
      Alert.alert('خطأ', 'يرجى اختيار نوع المشكلة وكتابة الوصف');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const imageUrl = await uploadImage();

      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          name,
          phone,
          user_type: 'ولي الأمر',
          problem_type: problemType,
          description: description.trim(),
          image_url: imageUrl,
          status: 'جديدة',
          priority: 'عادية',
        });

      if (error) throw error;

      setProblemType('');
      setDescription('');
      setImageUri(null);
      
      await fetchTickets();
      setActiveTab('list');
      
      Alert.alert(
        'تم الإرسال بنجاح',
        'تم إرسال تذكرتك بنجاح. سيتم الرد عليك في أقرب وقت.'
      );
    } catch (error) {
      console.error('Error submitting ticket:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال التذكرة. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'جديدة': return '#3b82f6';
      case 'قيد المعالجة': return '#f59e0b';
      case 'محلولة': return '#10b981';
      case 'مغلقة': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تذاكر الدعم</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            إرسال تذكرة جديدة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            تذاكري ({tickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>الاسم الكامل</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>رقم الهاتف</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textAlign="right"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>نوع المستخدم</Text>
          <View style={[styles.input, { backgroundColor: '#f9f9f9' }]}>
            <Text style={styles.inputText}>{userType}</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>نوع المشكلة أو الاقتراح</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowProblemTypeDropdown(!showProblemTypeDropdown)}
          >
            <View style={styles.dropdownIcon}>
              {showProblemTypeDropdown ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </View>
            <Text style={[styles.dropdownText, !problemType && styles.placeholder]}>
              {problemType || 'اختر نوع المشكلة'}
            </Text>
          </TouchableOpacity>
          {showProblemTypeDropdown && (
            <View style={styles.dropdownList}>
              {problemTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setProblemType(type);
                    setShowProblemTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>وصف المشكلة أو الاقتراح</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="اكتب وصفاً تفصيلياً للمشكلة أو الاقتراح..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            textAlign="right"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>إرفاق صورة (اختياري)</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Text style={styles.imagePickerButtonText}>اختر صورة</Text>
          </TouchableOpacity>
          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>إرسال التذكرة</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          style={styles.ticketsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke="#d1d5db"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.emptyText}>لا توجد تذاكر</Text>
              <Text style={styles.emptySubtext}>اضغط على "إرسال تذكرة جديدة" لإنشاء تذكرة دعم</Text>
            </View>
          ) : (
            tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => navigation.navigate('ParentTicketDetail', { ticketId: ticket.id })}
              >
                <View style={styles.ticketHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                  <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
                </View>
                <Text style={styles.ticketType}>{ticket.problem_type}</Text>
                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {ticket.description}
                </Text>
                {ticket.admin_response && (
                  <View style={styles.responseIndicator}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.responseIndicatorText}>تم الرد</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  dropdown: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  placeholder: {
    color: '#999',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    height: 150,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  inputText: {
    fontSize: 15,
    color: '#333',
  },
  imagePickerButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePickerButtonText: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: '500',
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  ticketsList: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  ticketType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'right',
  },
  responseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0fdf4',
  },
  responseIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
});
