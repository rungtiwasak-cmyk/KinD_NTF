import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,ImageBackground, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const PRESETS = [1500, 1800, 2000, 2200, 2500];
const HEALTH_GOALS = ['สร้างกล้ามเนื้อ (High Protein)', 'ควบคุมน้ำหนัก', 'ประหยัดงบ'];
const MIN = 800;
const MAX = 5000;

export default function GoalScreen({ profile, eaten, onSave, onBack }) {
  const [kcal, setKcal] = useState(profile.calorieGoal);
  const [draft, setDraft] = useState(String(profile.calorieGoal));
  const [goal, setGoal] = useState(profile.healthGoal);
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const clamp = (n) => Math.min(MAX, Math.max(MIN, n));
  const setValue = (n) => {
    const v = clamp(n);
    setKcal(v);
    setDraft(String(v));
  };

  const onType = (t) => {
    const digits = t.replace(/[^0-9]/g, '');
    setDraft(digits);
    if (digits) setKcal(Math.min(MAX, parseInt(digits, 10)));
  };
  const onBlur = () => setValue(draft ? parseInt(draft, 10) : kcal);

  const left = kcal - eaten;

  const save = () => {
    const v = clamp(kcal);
    onSave({ calorieGoal: v, healthGoal: goal });
    setSaved(true);
    timer.current = setTimeout(onBack, 700);
  };

  return (
    <ImageBackground
      source={require('../assets/bg_goal.jpg')} // เรียกใช้ไฟล์ bg_goal.jpg
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>เป้าหมายแคลอรี่</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardLabel}>แคลอรี่ที่ตั้งเป้าต่อวัน</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setValue(kcal - 50)}>
              <Ionicons name="remove" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.valueBox}>
              <TextInput
                style={styles.valueInput}
                value={draft}
                onChangeText={onType}
                onBlur={onBlur}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.unit}>kcal</Text>
            </View>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setValue(kcal + 50)}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.presetWrap}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.preset, kcal === p && styles.presetOn]}
                onPress={() => setValue(p)}
              >
                <Text style={[styles.presetText, kcal === p && styles.presetTextOn]}>{p.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.today}>
            วันนี้กินไปแล้ว {eaten.toLocaleString()} kcal{' '}
            {left >= 0 ? `เหลืออีก ${left.toLocaleString()} kcal` : `เกินเป้า ${Math.abs(left).toLocaleString()} kcal`}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>เป้าหมายสุขภาพ (ให้ AI ใช้แนะนำเมนู)</Text>
          <View style={styles.presetWrap}>
            {HEALTH_GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.preset, goal === g && styles.presetOn]}
                onPress={() => setGoal(goal === g ? null : g)}
              >
                <Text style={[styles.presetText, goal === g && styles.presetTextOn]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>แตะอีกครั้งเพื่อยกเลิกการเลือก</Text>
        </View>

        {saved && (
          <View style={styles.banner}>
            <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            <Text style={styles.bannerText}>บันทึกเป้าหมายแล้ว</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saved}>
          <Text style={styles.saveText}>บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  container: { flex: 1,
    backgroundColor: 'transparent', },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 6 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  valueBox: { alignItems: 'center', marginHorizontal: 22 },
  valueInput: { fontSize: 38, fontWeight: 'bold', color: colors.primary, textAlign: 'center', minWidth: 110, padding: 0 },
  unit: { color: colors.muted, fontSize: 13 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  preset: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#fff' },
  presetOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { color: colors.text, fontSize: 13 },
  presetTextOn: { color: '#fff', fontWeight: 'bold' },
  today: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 10, marginBottom: 10 },
  bannerText: { color: '#2E7D32', fontWeight: 'bold', marginLeft: 8 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 30, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
