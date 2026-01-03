import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function TicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, []);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTicket();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'جديدة':
        return '#3b82f6';
      case 'قيد المعالجة':
        return '#f59e0b';
      case 'محلولة':
        return '#10b981';
      case 'مغلقة':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'عاجلة':
        return '#ef4444';
      case 'عالية':
        return '#f59e0b';
      case 'عادية':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a5f7a" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل التذكرة</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>لم يتم العثور على التذكرة</Text>
        </View>
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
        <Text style={styles.headerTitle}>تفاصيل التذكرة</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* الحالة والأولوية */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>{ticket.status}</Text>
          </View>
          {ticket.priority !== 'عادية' && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
          )}
        </View>

        {/* التاريخ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>تاريخ الإرسال</Text>
          <Text style={styles.dateText}>{formatDate(ticket.created_at)}</Text>
        </View>

        {/* نوع المشكلة */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>نوع المشكلة</Text>
          <Text style={styles.sectionValue}>{ticket.problem_type}</Text>
        </View>

        {/* الوصف */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>الوصف</Text>
          <Text style={styles.descriptionText}>{ticket.description}</Text>
        </View>

        {/* الصورة */}
        {ticket.image_url && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>الصورة المرفقة</Text>
            <Image 
              source={{ uri: `https://xyrdpmhzwjejkstwovyx.supabase.co/storage/v1/object/public/tickets/${ticket.image_url}` }} 
              style={styles.attachedImage}
              onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
            />
          </View>
        )}

        {/* رد الإدارة */}
        {ticket.admin_response ? (
          <View style={styles.responseSection}>
            <View style={styles.responseHeader}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.responseLabel}>رد الإدارة</Text>
            </View>
            <Text style={styles.responseText}>{ticket.admin_response}</Text>
            {ticket.updated_at !== ticket.created_at && (
              <Text style={styles.responseDate}>
                تم الرد في: {formatDate(ticket.updated_at)}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noResponseSection}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.noResponseText}>لم يتم الرد بعد</Text>
            <Text style={styles.noResponseSubtext}>سيتم الرد على تذكرتك في أقرب وقت</Text>
          </View>
        )}

        {/* معلومات إضافية */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الاسم:</Text>
            <Text style={styles.infoValue}>{ticket.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الهاتف:</Text>
            <Text style={styles.infoValue}>{ticket.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نوع المستخدم:</Text>
            <Text style={styles.infoValue}>{ticket.user_type}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#1a5f7a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
  },
  dateText: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'right',
  },
  attachedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginTop: 8,
  },
  responseSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  responseText: {
    fontSize: 15,
    color: '#047857',
    lineHeight: 22,
    textAlign: 'right',
  },
  responseDate: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
    textAlign: 'right',
  },
  noResponseSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noResponseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  noResponseSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
