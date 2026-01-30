import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PackageIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2196F3" />
    <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#64748b" strokeWidth={2} fill="none" />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke="#64748b" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const SubscriptionCard = ({ data, onRenew }) => {
  const getTierLabel = (tier) => {
    const labels = {
      free: 'مجاني',
      basic: 'أساسي',
      premium: 'مميز'
    };
    return labels[tier] || tier;
  };

  const getTierColor = (tier) => {
    const colors = {
      free: '#9ca3af',
      basic: '#3b82f6',
      premium: '#8b5cf6'
    };
    return colors[tier] || '#3b82f6';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'نشط',
      expired: 'منتهي',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#22c55e',
      expired: '#ef4444',
      cancelled: '#f59e0b'
    };
    return colors[status] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatHijriDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <PackageIcon />
        <Text style={styles.cardTitle}>اشتراكك</Text>
      </View>

      <View style={styles.cardBody}>
        {/* الباقة */}
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(data.tier) }]}>
          <Text style={styles.tierText}>الباقة {getTierLabel(data.tier)}</Text>
        </View>

        {/* الحالة */}
        <View style={styles.statusRow}>
          <Text style={styles.label}>الحالة:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(data.status)}</Text>
          </View>
        </View>

        {/* تاريخ الانتهاء */}
        {data.endDate && (
          <View style={styles.dateSection}>
            <View style={styles.dateSectionHeader}>
              <CalendarIcon />
              <Text style={styles.dateSectionTitle}>ينتهي في:</Text>
            </View>
            
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>هجري:</Text>
              <Text style={styles.dateValue}>{formatHijriDate(data.endDate)}</Text>
            </View>
            
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>ميلادي:</Text>
              <Text style={styles.dateValue}>{formatDate(data.endDate)}</Text>
            </View>

            {/* الأيام المتبقية */}
            {data.status === 'active' && (
              <View style={styles.daysRemainingContainer}>
                <Text style={styles.daysRemainingText}>
                  {data.daysRemaining} يوم متبقي
                </Text>
              </View>
            )}
          </View>
        )}

        {/* معلومات الحساب */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الاسم:</Text>
            <Text style={styles.infoValue}>{data.name || '-'}</Text>
          </View>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardBody: {
    gap: 16,
  },
  tierBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tierText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dateLabel: {
    fontSize: 13,
    color: '#78350f',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    color: '#78350f',
    fontWeight: 'bold',
  },
  daysRemainingContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  daysRemainingText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400e',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  renewButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  renewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  websiteNotice: {
    marginTop: 12,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  websiteText: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 4,
  },
  websiteUrl: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1565C0',
  },
});

export default SubscriptionCard;
