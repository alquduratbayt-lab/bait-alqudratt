import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// إعداد كيفية عرض الإشعارات عندما يكون التطبيق مفتوحاً
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SupportScreen from './src/screens/SupportScreen';
import TicketScreen from './src/screens/TicketScreen';
import CalmMomentsScreen from './src/screens/CalmMomentsScreen';
import PointsScreen from './src/screens/PointsScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import TicketDetailScreen from './src/screens/TicketDetailScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import ExamScreen from './src/screens/ExamScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import StudentNotificationsScreen from './src/screens/StudentNotificationsScreen';
import AITeacherScreen from './src/screens/AITeacherScreen';
import ParentConfirmScreen from './src/screens/ParentConfirmScreen';
import ParentChildrenScreen from './src/screens/ParentChildrenScreen';
import ParentHomeScreen from './src/screens/ParentHomeScreen';
import ParentReportsScreen from './src/screens/ParentReportsScreen';
import ParentNotificationsScreen from './src/screens/ParentNotificationsScreen';
import ParentProfileScreen from './src/screens/ParentProfileScreen';
import ParentEditProfileScreen from './src/screens/ParentEditProfileScreen';
import ParentRegisterScreen from './src/screens/ParentRegisterScreen';
import ParentTicketScreen from './src/screens/ParentTicketScreen';
import ParentTicketDetailScreen from './src/screens/ParentTicketDetailScreen';
import WaitingApprovalScreen from './src/screens/WaitingApprovalScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import UserTypeSelectionScreen from './src/screens/UserTypeSelectionScreen';
import PlacementTestScreen from './src/screens/PlacementTestScreen';
import PlacementTestResultsScreen from './src/screens/PlacementTestResultsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // طلب إذن الإشعارات فور فتح التطبيق
    const requestNotificationPermissions = async () => {
      const { registerForPushNotificationsAsync } = require('./src/lib/pushNotifications');
      await registerForPushNotificationsAsync();
    };
    
    requestNotificationPermissions();

    // الاستماع للإشعارات الواردة
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // الاستماع لتفاعل المستخدم مع الإشعار
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ParentRegister" component={ParentRegisterScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="PlacementTest" component={PlacementTestScreen} />
        <Stack.Screen name="PlacementTestResults" component={PlacementTestResultsScreen} />
        <Stack.Screen name="WaitingApproval" component={WaitingApprovalScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Books" component={BooksScreen} />
        <Stack.Screen name="Curriculum" component={CurriculumScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="CalmMoments" component={CalmMomentsScreen} />
        <Stack.Screen name="Points" component={PointsScreen} />
        <Stack.Screen name="Rewards" component={RewardsScreen} />
        <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: 'تذاكري' }} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'تفاصيل التذكرة' }} />
        <Stack.Screen name="Lessons" component={LessonsScreen} />
        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
        <Stack.Screen name="Exam" component={ExamScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
        <Stack.Screen name="AITeacher" component={AITeacherScreen} />
        <Stack.Screen name="ParentConfirm" component={ParentConfirmScreen} />
        <Stack.Screen name="ParentChildren" component={ParentChildrenScreen} />
        <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
        <Stack.Screen name="ParentReports" component={ParentReportsScreen} />
        <Stack.Screen name="ParentNotifications" component={ParentNotificationsScreen} />
        <Stack.Screen name="ParentProfile" component={ParentProfileScreen} />
        <Stack.Screen name="ParentEditProfile" component={ParentEditProfileScreen} />
        <Stack.Screen name="ParentTicket" component={ParentTicketScreen} />
        <Stack.Screen name="ParentTicketDetail" component={ParentTicketDetailScreen} />
        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
        <Stack.Screen name="Training" component={TrainingScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
