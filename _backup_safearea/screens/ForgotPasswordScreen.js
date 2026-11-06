import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false); // false = กรอกอีเมล, true = ส่งลิงก์แล้ว

  const handleSend = () => {
    const value = email.trim();
    if (!value) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    setError('');
    // TODO: เชื่อมต่อ backend ตรงนี้ เช่น
    // await sendPasswordResetEmail(auth, value)  (Firebase)
    setSent(true);
  };

  return (
    <ImageBackground
      source={require('../assets/bg_regis.jpg')}
      style={styles.bg}
      resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* ปุ่มย้อนกลับ */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Image
            source={require('../assets/H_logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <View style={styles.card}>
            {!sent ? (
              <>
                <View style={styles.iconCircle}>
                  <Ionicons name="key-outline" size={32} color={colors.primary} />
                </View>
                <Text style={styles.title}>ลืมรหัสผ่าน?</Text>
                <Text style={styles.desc}>
                  กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
                </Text>

                <View style={[styles.inputRow, error && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color={colors.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="อีเมล"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (error) setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity style={styles.btn} onPress={handleSend}>
                  <Text style={styles.btnText}>ส่งลิงก์รีเซ็ตรหัสผ่าน</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={40} color="#43A047" />
                </View>
                <Text style={styles.title}>ส่งลิงก์แล้ว</Text>
                <Text style={styles.desc}>
                  เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่{'\n'}
                  <Text style={{ fontWeight: 'bold', color: colors.text }}>
                    {email.trim()}
                  </Text>
                  {'\n'}กรุณาตรวจสอบกล่องจดหมาย (รวมถึงอีเมลขยะ)
                </Text>

                <TouchableOpacity style={styles.btn} onPress={onBack}>
                  <Text style={styles.btnText}>กลับไปหน้าเข้าสู่ระบบ</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSent(false)}>
                  <Text style={styles.resend}>ไม่ได้รับอีเมล? ส่งอีกครั้ง</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {!sent && (
            <Text style={styles.bottom}>
              นึกออกแล้ว?{' '}
              <Text style={{ color: colors.primary }} onPress={onBack}>
                เข้าสู่ระบบ
              </Text>
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoImage: { width: 150, height: 60, marginBottom: 16 },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  desc: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
    width: '100%',
  },
  inputError: { borderColor: '#E53935' },
  input: { flex: 1, marginLeft: 10 },
  errorText: {
    color: '#E53935',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 6,
    fontSize: 12,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resend: { color: colors.primary, marginTop: 14 },
  bottom: { marginTop: 20, color: colors.text },
});