
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainScreen from './screens/MainScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';   // เพิ่มบรรทัดนี้
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getCurrentSession } from './lib/api';

function AppContent() {
  const [screen, setScreen] = useState('loading');

  // เปิดแอปมา: ถ้ายังมี session ค้างอยู่ (เคยล็อกอินไว้) เข้าหน้าหลักเลย ไม่ต้องล็อกอินใหม่
  useEffect(() => {
    let alive = true;
    getCurrentSession()
      .then((session) => alive && setScreen(session ? 'home' : 'login'))
      .catch(() => alive && setScreen('login'));
    return () => {
      alive = false;
    };
  }, []);

  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1E0' }}>
        <ActivityIndicator size="large" color="#F9511E" />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={() => setScreen('home')}
        onRegister={() => setScreen('register')}
        onForgot={() => setScreen('forgot')}
      />
    );
  }
  if (screen === 'forgot') {
  return <ForgotPasswordScreen onBack={() => setScreen('login')} />;
  }
  if (screen === 'register') {
    return (
      <RegisterScreen
        onBack={() => setScreen('login')}
        onRegister={() => setScreen('home')}
      />
    );
  }
  if (screen === 'home') return <MainScreen onLogout={() => setScreen('login')} />;
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
