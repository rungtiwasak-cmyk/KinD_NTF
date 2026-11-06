import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const USER_GROUPS = ['นักศึกษาหอพัก', 'แม่บ้าน', 'สายสุขภาพ-นักกีฬา', 'อื่นๆ'];
const GOALS = ['สร้างกล้ามเนื้อ (High Protein)', 'ควบคุมน้ำหนัก', 'ประหยัดงบ'];
const RESTRICTIONS = ['แพ้ถั่ว', 'มังสวิรัติ', 'ไม่กินเผ็ด', 'อื่นๆ'];

// ปุ่มเลือกแบบ chip ใช้ซ้ำได้ทั้งกลุ่มผู้ใช้และเป้าหมาย
function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ช่องกรอกที่ใช้ซ้ำได้
function Field({ icon, placeholder, value, onChangeText, secure }) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function RegisterScreen({ onBack, onRegister }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [group, setGroup] = useState(null); // เลือกได้ 1
  const [goal, setGoal] = useState(null); // เลือกได้ 1
  const [restrictions, setRestrictions] = useState([]); // เลือกได้หลายอัน
  const [otherText, setOtherText] = useState('');

  const toggleRestriction = (item) => {
    setRestrictions((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  return (
    <ImageBackground
      source={require('../assets/bg_regis.jpg')}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
        source={require('../assets/H_logo.jpg')} // หากไฟล์เป็น .jpg ให้เปลี่ยนเป็น H_logo.jpg
        style={styles.logoImage}
        resizeMode="contain"
    />
        <Text style={styles.title}>สร้างบัญชีเพื่อเริ่มต้นดูแลสุขภาพ</Text>

        {/* ข้อมูลบัญชี */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลบัญชี</Text>
          <Field
            icon="person-outline"
            placeholder="ชื่อ-นามสกุล"
            value={name}
            onChangeText={setName}
          />
          <Field
            icon="mail-outline"
            placeholder="อีเมล Address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            icon="lock-closed-outline"
            placeholder="รหัสผ่าน"
            value={password}
            onChangeText={setPassword}
            secure
          />
          <Field
            icon="lock-closed-outline"
            placeholder="ยืนยันรหัสผ่าน"
            value={confirm}
            onChangeText={setConfirm}
            secure
          />
        </View>

        {/* ข้อมูลสำหรับ AI */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลสำหรับ AI แนะนำเมนู</Text>

          <Text style={styles.label}>กลุ่มผู้ใช้ (เลือกได้ 1)</Text>
          <View style={styles.chipWrap}>
            {USER_GROUPS.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={group === g}
                onPress={() => setGroup(g)}
              />
            ))}
          </View>

          <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
          <View style={styles.chipWrap}>
            {GOALS.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={goal === g}
                onPress={() => setGoal(g)}
              />
            ))}
          </View>

          <Text style={styles.label}>ข้อจำกัดอาหาร (เลือกได้มากกว่า 1)</Text>
          <View style={styles.chipWrap}>
            {RESTRICTIONS.map((r) => {
              const checked = restrictions.includes(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={styles.checkRow}
                  onPress={() => toggleRestriction(r)}>
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={checked ? colors.primary : colors.muted}
                  />
                  <Text style={styles.checkText}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="ระบุข้อจำกัดเพิ่มเติม"
              value={otherText}
              onChangeText={setOtherText}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={onRegister}>
          <Text style={styles.registerText}>สมัครสมาชิก (Register)</Text>
        </TouchableOpacity>

        <Text style={styles.bottom}>
          มีบัญชีอยู่แล้ว?{' '}
          <Text style={{ color: colors.primary }} onPress={onBack}>
            เข้าสู่ระบบ
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%',
    height: '100%', },
  scroll: { padding: 20, alignItems: 'center' },
  logoImage: {
    width: 150,        // ปรับขนาดความกว้างตามความเหมาะสม
    height: 60,        // ปรับขนาดความสูงตามความเหมาะสม
    alignSelf: 'center', // จัดภาพให้อยู่ตรงกลางหน้าจอ
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextSelected: { color: '#fff', fontWeight: 'bold' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  checkText: { marginLeft: 6, color: colors.text },
  registerBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bottom: { marginTop: 16, marginBottom: 24, color: colors.text },
});
