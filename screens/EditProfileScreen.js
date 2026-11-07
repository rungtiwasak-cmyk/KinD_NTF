import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../components/Avatar';
import { colors } from '../theme';

const AVATARS = ['👩', '👨', '🧑', '👧', '👦', '👵', '👴', '👩‍🍳', '🧑‍🍳', '🐱', '🐶', '🦊'];
const GROUPS = ['นักศึกษาหอพัก', 'แม่บ้าน', 'สายสุขภาพ-นักกีฬา', 'อื่นๆ'];
const SUGGEST = ['กุ้ง', 'ถั่วลิสง', 'นม', 'ไข่', 'ถั่วเหลือง', 'ข้าวสาลี', 'หอย', 'ปลา', 'ไม่กินเผ็ด', 'มังสวิรัติ'];

function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

export default function EditProfileScreen({ profile, onSave, onBack }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatar, setAvatar] = useState(profile.avatar);
  // รูปโปรไฟล์ที่ผู้ใช้เลือกเอง: avatarUrl = รูปที่ใช้อยู่/พรีวิว, avatarPick = ไฟล์ใหม่ที่ยังไม่ได้อัปโหลด หรือ 'clear'
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || null);
  const [avatarPick, setAvatarPick] = useState(null);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState(profile.group);
  const [allergies, setAllergies] = useState(profile.allergies);
  const [custom, setCustom] = useState('');
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toggleAllergy = (a) =>
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    setAllergies((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setCustom('');
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // ให้ครอปรูป
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    setAvatarUrl(a.uri);
    setAvatarPick({ uri: a.uri, mimeType: a.mimeType, base64: a.base64 ?? null });
  };

  const chooseEmoji = (a) => {
    setAvatar(a);
    if (avatarUrl) {
      setAvatarUrl(null);
      // ถ้าเดิมมีรูปที่อัปโหลดไว้แล้ว ต้องสั่งล้างตอนบันทึก; ถ้าเป็นแค่รูปที่เพิ่งเลือกยังไม่อัปโหลด แค่ยกเลิก
      setAvatarPick(profile.avatarUrl ? 'clear' : null);
    }
  };

  const save = async () => {
    const e = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อ';
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim(), avatar, group, allergies, avatarPick });
    } catch (err) {
      console.log('บันทึกโปรไฟล์ไม่สำเร็จ:', err);
      setErrors({ save: 'บันทึกไม่สำเร็จ: ' + (err?.message || 'โปรดลองอีกครั้ง') });
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    timer.current = setTimeout(onBack, 700);
  };

  // รวมตัวเลือกแนะนำกับที่ผู้ใช้เพิ่มเอง
  const options = [...SUGGEST, ...allergies.filter((a) => !SUGGEST.includes(a))];

  return (
    <ImageBackground
      source={require('../assets/bg_edit1.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>แก้ไขโปรไฟล์</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center' }}>
          <View style={styles.bigAvatar}>
            <Avatar emoji={avatar} uri={avatarUrl} fontSize={52} />
          </View>
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} activeOpacity={0.85}>
            <Ionicons name="image-outline" size={16} color="#fff" />
            <Text style={styles.photoBtnText}>เลือกรูปจากเครื่อง</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarWrap}>
          {AVATARS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.avatarOpt, !avatarUrl && avatar === a && styles.avatarOptOn]}
              onPress={() => chooseEmoji(a)}
            >
              <Text style={{ fontSize: 24 }}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>ชื่อ-นามสกุล</Label>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ชื่อ-นามสกุล" placeholderTextColor={colors.muted} />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

        <Label>อีเมล</Label>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="อีเมล"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <Label>กลุ่มผู้ใช้ (เลือกได้ 1)</Label>
        <View style={styles.wrap}>
          {GROUPS.map((g) => (
            <TouchableOpacity key={g} style={[styles.chip, group === g && styles.chipOn]} onPress={() => setGroup(g)}>
              <Text style={[styles.chipText, group === g && styles.chipTextOn]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>แพ้อาหาร / ข้อจำกัดอาหาร (เลือกได้หลายอย่าง)</Label>
        <View style={styles.wrap}>
          {options.map((a) => {
            const on = allergies.includes(a);
            return (
              <TouchableOpacity key={a} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleAllergy(a)}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
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

        {saved && (
          <View style={styles.banner}>
            <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            <Text style={styles.bannerText}>บันทึกโปรไฟล์แล้ว</Text>
          </View>
        )}

        {errors.save ? <Text style={styles.error}>{errors.save}</Text> : null}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saved || saving}>
          <Text style={styles.saveText}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 6 },
  bigAvatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginTop: 8, borderWidth: 3, borderColor: colors.primaryLight, overflow: 'hidden' },
  photoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 16, height: 36, marginTop: 12 },
  photoBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
  avatarWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 },
  avatarOpt: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', margin: 4, borderWidth: 2, borderColor: 'transparent' },
  avatarOptOn: { borderColor: colors.primary, backgroundColor: '#FFE0B2' },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, minHeight: 44, fontSize: 14 },
  error: { color: '#E53935', fontSize: 12, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: 'bold' },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addBtn: { marginLeft: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 10, marginTop: 18 },
  bannerText: { color: '#2E7D32', fontWeight: 'bold', marginLeft: 8 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 30, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
