import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Path, Circle } from 'react-native-svg';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة السهم للأمام
const ChevronIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الهاتف
const PhoneIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة واتساب
const WhatsAppIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
      fill="#1a5f7a"
    />
    <Path
      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة التذكرة
const TicketIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة Instagram
const InstagramIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 11.37a4 4 0 11-7.914 1.174A4 4 0 0116 11.37z"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={17.5} cy={6.5} r={1} fill="#1a5f7a" />
  </Svg>
);

// أيقونة X (Twitter)
const TwitterIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة TikTok
const TikTokIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12a4 4 0 104 4V4a5 5 0 005 5"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SupportScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = React.useState('+966500000000');
  const [whatsappNumber, setWhatsappNumber] = React.useState('+966500000000');
  const [socialMedia, setSocialMedia] = React.useState({
    instagram: '',
    twitter: '',
    tiktok: ''
  });

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { getSetting } = require('../lib/appSettingsService');
      const phone = await getSetting('support_phone', '+966500000000');
      const whatsapp = await getSetting('support_whatsapp', '+966500000000');
      const instagram = await getSetting('social_instagram', '');
      const twitter = await getSetting('social_twitter', '');
      const tiktok = await getSetting('social_tiktok', '');
      
      setPhoneNumber(phone);
      setWhatsappNumber(whatsapp);
      setSocialMedia({
        instagram,
        twitter,
        tiktok
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    const cleanNumber = whatsappNumber.replace(/\+/g, '');
    Linking.openURL(`https://wa.me/${cleanNumber}`);
  };

  const handleTicket = () => {
    navigation.navigate('Ticket');
  };

  const handleSocialMedia = (url) => {
    if (url && url.trim() !== '') {
      Linking.openURL(url);
    }
  };

  const hasSocialMedia = socialMedia.instagram || socialMedia.twitter || socialMedia.tiktok;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الدعم الفني</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* اتصال */}
        <TouchableOpacity style={styles.menuItem} onPress={handleCall}>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>اتصال</Text>
            <PhoneIcon />
          </View>
        </TouchableOpacity>

        {/* رسالة واتس */}
        <TouchableOpacity style={styles.menuItem} onPress={handleWhatsApp}>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>رسالة واتس</Text>
            <WhatsAppIcon />
          </View>
        </TouchableOpacity>

        {/* إرسال تذكرة دعم */}
        <TouchableOpacity style={styles.menuItem} onPress={handleTicket}>
          <ChevronIcon />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>إرسال تذكرة دعم</Text>
            <TicketIcon />
          </View>
        </TouchableOpacity>

        {/* قسم السوشيال ميديا */}
        {hasSocialMedia && (
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>تابعنا على:</Text>
            <View style={styles.socialIcons}>
              {socialMedia.instagram && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocialMedia(socialMedia.instagram)}
                >
                  <InstagramIcon />
                  <Text style={styles.socialLabel}>Instagram</Text>
                </TouchableOpacity>
              )}
              {socialMedia.twitter && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocialMedia(socialMedia.twitter)}
                >
                  <TwitterIcon />
                  <Text style={styles.socialLabel}>Twitter</Text>
                </TouchableOpacity>
              )}
              {socialMedia.tiktok && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocialMedia(socialMedia.tiktok)}
                >
                  <TikTokIcon />
                  <Text style={styles.socialLabel}>TikTok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
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
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f4fc',
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a5f7a',
    fontWeight: '500',
  },
  socialSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e8f4fc',
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginBottom: 20,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  socialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f4fc',
    minWidth: 80,
  },
  socialLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
