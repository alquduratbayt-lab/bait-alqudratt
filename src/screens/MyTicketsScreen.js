import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function MyTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

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
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} 
          style={styles.backButton}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تذاكري</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Ticket')}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ جديدة</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
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
            <Text style={styles.emptySubtext}>اضغط على "جديدة" لإنشاء تذكرة دعم</Text>
          </View>
        ) : (
          tickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketHeaderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                  {ticket.priority !== 'عادية' && (
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                      <Text style={styles.priorityText}>{ticket.priority}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
              </View>

              <Text style={styles.ticketType}>{ticket.problem_type}</Text>
              <Text style={styles.ticketDescription} numberOfLines={2}>
                {ticket.description}
              </Text>

              {ticket.image_url && (
                <Image source={{ uri: ticket.image_url }} style={styles.ticketImage} />
              )}

              {ticket.admin_response && (
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeader}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.responseLabel}>رد الإدارة:</Text>
                  </View>
                  <Text style={styles.responseText} numberOfLines={3}>
                    {ticket.admin_response}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
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
  addButton: {
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
  ticketHeaderRight: {
    flexDirection: 'row',
    gap: 8,
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
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
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
  ticketImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  responseText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
    textAlign: 'right',
  },
});
