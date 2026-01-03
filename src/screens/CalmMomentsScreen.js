import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الفانوس
const LanternIcon = () => (
  <Svg width={50} height={70} viewBox="0 0 50 70" fill="none">
    <Path d="M20 5h10v5H20z" fill="#1a5f7a" />
    <Path d="M25 0v5" stroke="#1a5f7a" strokeWidth={2} />
    <Path d="M15 10h20l5 15v25l-5 10H15l-5-10V25l5-15z" fill="#1a5f7a" />
    <Path d="M18 20h14v20H18z" fill="#fbbf24" opacity={0.6} />
    <Circle cx={25} cy={35} r={3} fill="#fff" />
  </Svg>
);

// أيقونة التشغيل
const PlayIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="rgba(255,255,255,0.9)" />
    <Path d="M16 12l12 8-12 8V12z" fill="#1a5f7a" />
  </Svg>
);

export default function CalmMomentsScreen({ navigation }) {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    try {
      const { data, error } = await supabase
        .from('calm_moments')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setMoments(data || []);
    } catch (error) {
      console.error('Error fetching calm moments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMomentsByType = (type) => {
    return moments.filter(m => m.type === type);
  };

  const verseItems = getMomentsByType('verse');
  const duaItems = getMomentsByType('dua');
  const azkarItems = getMomentsByType('azkar');
  const videoItems = getMomentsByType('video');

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
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لحظات هدوء</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* آيات */}
        {verseItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.arabicText}>{item.content}</Text>
              </View>
              <View style={styles.lanternContainer}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: 50, height: 70, borderRadius: 8 }} />
                ) : (
                  <LanternIcon />
                )}
              </View>
            </View>
          </View>
        ))}

        {/* أدعية */}
        {duaItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.arabicText}>{item.content}</Text>
              </View>
              <View style={styles.lanternContainer}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: 50, height: 70, borderRadius: 8 }} />
                ) : (
                  <LanternIcon />
                )}
              </View>
            </View>
          </View>
        ))}

        {/* أذكار */}
        {azkarItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.arabicText}>{item.content}</Text>
              </View>
              <View style={styles.lanternContainer}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: 50, height: 70, borderRadius: 8 }} />
                ) : (
                  <LanternIcon />
                )}
              </View>
            </View>
          </View>
        ))}

        {/* فيديوهات */}
        {videoItems.length > 0 && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>استراحة روحانية</Text>
            {videoItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.videoCard}>
                <View style={styles.videoOverlay}>
                  <View style={styles.videoLabel}>
                    <Text style={styles.videoLabelText}>A+</Text>
                  </View>
                  <Text style={styles.videoTitle}>{item.title}</Text>
                  <View style={styles.playButton}>
                    <PlayIcon />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#e8f4fc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d0e8f5',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'right',
    marginBottom: 10,
  },
  arabicText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    lineHeight: 24,
  },
  lanternContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  videoSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 12,
  },
  videoCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#4a5568',
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 85, 104, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoLabel: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  videoLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  videoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  playButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
  },
});
