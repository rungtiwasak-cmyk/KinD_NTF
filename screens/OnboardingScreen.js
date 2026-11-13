import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { USER_GROUPS, HEALTH_GOALS, ALLERGY_SUGGEST } from '../data/profileOptions';

// หน้า "ตั้งค่าโปรไฟล์ครั้งแรก" แสดงตอนล็อกอินแล้วยังไม่เคยเลือกกลุ่มผู้ใช้
// (เช่น เพิ่งล็อกอินด้วย Google ครั้งแรก) บังคับเลือกกลุ่มผู้ใช้ ส่วนที่เหลือข้ามได้
export default function OnboardingScreen({ name, onDone }) {
  const [group, setGroup] = useState(null);
  const [goal, setGoal] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [custom, setCustom] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleAllergy = (a) =>
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    setAllergies((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setCustom('');
  };

  const submit = async () => {
    if (!group) {
      setError('กรุณาเลือกกลุ่มผู้ใช้อย่างน้อย 1 อย่าง');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onDone({ group, healthGoal: goal, allergies, bio: bio.trim() });
    } catch (err) {
      console.log('บันทึกโปรไฟล์ครั้งแรกไม่สำเร็จ:', err);
      setError('บันทึกไม่สำเร็จ: ' + (err?.message || 'โปรดลองอีกครั้ง'));
      setSaving(false);
    }
  };

  const options = [...ALLERGY_SUGGEST, ...allergies.filter((a) => !ALLERGY_SUGGEST.includes(a))];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.hello}>ยินดีต้อนรับ{name ? ` ${name}` : ''} 👋</Text>
        <Text style={styles.sub}>
          ตั้งค่าโปรไฟล์ของคุณสักครู่ เพื่อให้ AI แนะนำเมนูที่เหมาะกับคุณ
          และเลี่ยงอาหารที่คุณกินไม่ได้ (แก้ไขได้ภายหลังในหน้าโปรไฟล์)
        </Text>

        <Text style={styles.label}>
          คุณเป็นใคร? <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.wrap}>
          {USER_GROUPS.map((g) => (
            <Chip key={g} label={g} on={group === g} onPress={() => setGroup(g)} />
          ))}
        </View>

        <Text style={styles.label}>เป้าหมายของคุณ (ไม่บังคับ)</Text>
        <View style={styles.wrap}>
          {HEALTH_GOALS.map((g) => (
            <Chip key={g} label={g} on={goal === g} onPress={() => setGoal(goal === g ? null : g)} />
          ))}
        </View>

        <Text style={styles.label}>แพ้อาหาร / ข้อจำกัดอาหาร (ไม่บังคับ)</Text>
        <Text style={styles.hint}>
          อาหารที่คุณแพ้ ไม่กิน หรือกินไม่ได้ เช่น แพ้กุ้ง แพ้นม มังสวิรัติ ไม่กินเผ็ด
          เลือกได้หลายอย่าง
        </Text>
        <View style={styles.wrap}>
          {options.map((a) => (
            <Chip key={a} label={a} on={allergies.includes(a)} onPress={() => toggleAllergy(a)} />
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            placeholder="เพิ่มอย่างอื่น เช่น งา"
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>แนะนำตัวสั้นๆ (ไบโอ ไม่บังคับ)</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          value={bio}
          onChangeText={setBio}
          placeholder="เช่น ชอบทำอาหารง่ายๆ ในหอ งบไม่เกิน 50 บาท"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={160}
        />
        <Text style={styles.counter}>{bio.length}/160</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>เริ่มใช้งาน</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, on, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hello: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 8 },
  sub: { fontSize: 14, color: colors.text, opacity: 0.8, marginTop: 8, lineHeight: 21 },
  label: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginTop: 24, marginBottom: 8 },
  required: { color: '#E53935' },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 8, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: 'bold' },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addBtn: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 44,
    fontSize: 14,
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: colors.muted, marginTop: 4 },
  error: { color: '#E53935', fontSize: 13, marginTop: 14 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
