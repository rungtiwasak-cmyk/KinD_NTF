import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const FAQ = [
  {
    q: 'สแกนตู้เย็นใช้ยังไง',
    a: 'ที่หน้าหลักแตะปุ่มกล้องหรือปุ่ม "เคลียร์ตู้เย็น & เจนเมนูด้วย AI" แล้วถ่ายรูป เลือกไฟล์ หรือพิมพ์วัตถุดิบที่มี จากนั้นกด "เจนเมนูด้วย AI" ระบบจะแสดงเมนูที่ทำได้ และบอกว่าขาดวัตถุดิบอะไร',
  },
  {
    q: 'ดูประวัติการสแกนได้ที่ไหน',
    a: 'ไปที่แท็บ PROFILE USER แล้วแตะกล่อง "ประวัติการสแกน" จะเห็นวันเวลา วัตถุดิบ และเมนูที่แนะนำในแต่ละครั้ง และลบรายการที่ไม่ต้องการได้',
  },
  {
    q: 'จะโพสต์สูตรอาหารต้องกรอกอะไรบ้าง',
    a: 'ต้องมีรูปหรือวิดีโอ แคปชั่น หมวดหมู่ ส่วนผสม และวิธีทำ ส่วนข้อมูลโภชนาการ (แคลอรี่/โปรตีน) ไม่บังคับ รู้คร่าวๆ ก็ใส่ ไม่รู้ข้ามได้เลย',
  },
  {
    q: 'Favorite ต่างจากการกดหัวใจยังไง',
    a: 'หัวใจคือการกดถูกใจ ส่วน Favorite (ไอคอน bookmark) คือการเก็บโพสต์ไว้ดูภายหลัง และจัดเป็นกลุ่มได้ ดูทั้งสองอย่างได้ที่โปรไฟล์ในเมนู "Favorite ของฉัน" และ "ที่กดหัวใจไว้"',
  },
  {
    q: 'เปลี่ยนเป้าหมายแคลอรี่ได้ไหม',
    a: 'ได้ ที่โปรไฟล์แตะ "เป้าหมายแคลอรี่" แล้วปรับตัวเลขหรือเลือกค่าที่ตั้งไว้ให้ จากนั้นกดบันทึก แถบแคลอรี่ที่หน้าหลักจะอัปเดตตาม',
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faq}>
      <TouchableOpacity style={styles.faqHead} onPress={() => setOpen(!open)} activeOpacity={0.7}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </TouchableOpacity>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </View>
  );
}

export default function HelpScreen({ onBack }) {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = () => {
    if (!msg.trim()) {
      setError('กรุณาพิมพ์ข้อความก่อนส่ง');
      return;
    }
    setError('');
    setSent(true);
    setMsg('');
  };

  return (
    <ImageBackground
      source={require('../assets/bg_help.jpg')} // เรียกใช้ไฟล์ bg_help.jpg
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>ช่วยเหลือ</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>คำถามที่พบบ่อย</Text>
        {FAQ.map((f) => (
          <FaqItem key={f.q} item={f} />
        ))}

        <Text style={styles.section}>ส่งข้อเสนอแนะ / แจ้งปัญหา</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={msg}
            onChangeText={(t) => {
              setMsg(t);
              setSent(false);
            }}
            placeholder="เล่าปัญหาที่เจอหรือสิ่งที่อยากให้ปรับปรุง..."
            placeholderTextColor={colors.muted}
            multiline
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {sent ? <Text style={styles.sent}>✅ ส่งข้อความแล้ว ขอบคุณที่ช่วยกันปรับปรุงแอป</Text> : null}
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.sendText}>ส่งข้อความ</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>KinD v1.0.0 · กินดี มีสุข ทุกมื้อ</Text>
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
  section: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 18, marginBottom: 10 },
  faq: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, marginBottom: 8 },
  faqHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  faqA: { color: colors.text, fontSize: 13, lineHeight: 20, paddingBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 14 },
  input: { minHeight: 90, textAlignVertical: 'top', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, fontSize: 13 },
  error: { color: '#E53935', fontSize: 12, marginTop: 8 },
  sent: { color: '#2E7D32', fontSize: 12, marginTop: 8 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 30, height: 46, marginTop: 12 },
  sendText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  version: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 24 },
});
