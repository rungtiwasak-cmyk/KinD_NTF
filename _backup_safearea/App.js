
import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainScreen from './screens/MainScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';   // เพิ่มบรรทัดนี้

export default function App() {
  const [screen, setScreen] = useState('login');

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
