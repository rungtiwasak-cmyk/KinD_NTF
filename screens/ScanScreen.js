import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { matchPosts, DEMO_DETECTED } from '../data/posts';
import { nutriText } from '../utils';

const QUICK = ['ไข่', 'อกไก่', 'บรอกโคลี', 'มะเขือเทศ', 'แซลมอน', 'ข้าวกล้อง', 'หมูสับ', 'เต้าหู้', 'กะเพรา', 'พริก'];

export default function ScanScreen({ posts, initialPrompt = '', onSaveScan, onOpenPost, onBack }) {
  const [phase, setPhase] = useState('form'); // form | loading | result
  const [media, setMedia] = useState(null);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const addItems = (raw) => {
    const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setItems((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
      });
      return next;
    });
    setText('');
    setError('');
  };

  const removeItem = (name) => setItems((prev) => prev.filter((x) => x !== name));

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('ไม่ได้รับอนุญาตให้ใช้กล้อง ลองเลือกรูปจากคลังแทน');
        return;
      }
      const r = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!r.canceled) {
        setMedia({ uri: r.assets[0].uri, type: 'image' });
        setError('');
      }
    } catch (_e) {
      setError('เปิดกล้องไม่ได้ ลองเลือกรูปจากคลังแทน');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.6 });
      if (!r.canceled) {
        const a = r.assets[0];
        setMedia({ uri: a.uri, type: a.type === 'video' ? 'video' : 'image' });
        setError('');
      }
    } catch (_e) {
      setError('เลือกไฟล์ไม่ได้ ลองใหม่อีกครั้ง');
    }
  };

  const run = () => {
    // รวมข้อความที่พิมพ์ค้างในช่องเข้าไปด้วย
    const pending = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const all = [...items];
    pending.forEach((p) => {
      if (!all.some((x) => x.toLowerCase() === p.toLowerCase())) all.push(p);
    });

    if (!media && all.length === 0) {
      setError('ถ่ายรูป/เลือกไฟล์ หรือพิมพ์วัตถุดิบอย่างน้อย 1 อย่าง');
      return;
    }
    setItems(all);
    setText('');
    setError('');
    setPhase('loading');

    timer.current = setTimeout(() => {
      const demo = all.length === 0; // มีแต่รูป -> ใช้ผลตัวอย่าง
      const detected = demo ? DEMO_DETECTED : all;
      const matches = matchPosts(posts, detected, prompt);
      setResult({ detected, matches, demo });
      onSaveScan({
        prompt: prompt.trim(),
        ingredients: detected,
        menus: matches.slice(0, 5).map((m) => m.post.title || m.post.caption),
      });
      setPhase('result');
    }, 1200);
  };

  const editAgain = () => {
    if (result) setItems(result.detected);
    setPhase('form');
  };

  const reset = () => {
    setMedia(null);
    setItems([]);
    setText('');
    setResult(null);
    setError('');
    setPhase('form');
  };

  return (
    <ImageBackground
      source={require('../assets/bg_scanscreen.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>สแกนตู้เย็นด้วย AI</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {phase === 'form' && (
          <>
            {/* รูป / วิดีโอ */}
            <Text style={styles.label}>1. ถ่ายรูปหรือเลือกไฟล์ตู้เย็น</Text>
            <View style={styles.mediaBox}>
              {media && media.type === 'image' ? (
                <Image source={{ uri: media.uri }} style={styles.mediaImg} resizeMode="cover" />
              ) : media && media.type === 'video' ? (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="videocam" size={40} color={colors.primary} />
                  <Text style={styles.mediaText}>เลือกวิดีโอแล้ว</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="camera-outline" size={40} color={colors.primary} />
                  <Text style={styles.mediaText}>ยังไม่ได้เลือกรูป</Text>
                </View>
              )}
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.outBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={18} color={colors.primary} />
                <Text style={styles.outBtnText}>ถ่ายรูป</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.outBtn, { marginLeft: 10 }]} onPress={pickFromLibrary}>
                <Ionicons name="images-outline" size={18} color={colors.primary} />
                <Text style={styles.outBtnText}>เลือกรูป/วิดีโอ</Text>
              </TouchableOpacity>
            </View>

            {/* พิมพ์วัตถุดิบ */}
            <Text style={styles.label}>2. พิมพ์วัตถุดิบที่มี (พิมพ์หลายอย่างคั่นด้วย , ได้)</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="เช่น ไข่, อกไก่, บรอกโคลี"
                placeholderTextColor={colors.muted}
                value={text}
                onChangeText={setText}
                onSubmitEditing={() => addItems(text)}
              />
              <TouchableOpacity style={styles.addBtn} onPress={() => addItems(text)}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {items.length > 0 && (
              <View style={styles.wrap}>
                {items.map((x) => (
                  <TouchableOpacity key={x} style={styles.itemChip} onPress={() => removeItem(x)}>
                    <Text style={styles.itemChipText}>{x}</Text>
                    <Ionicons name="close" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.sub}>แตะเพื่อเพิ่มอย่างเร็ว</Text>
            <View style={styles.wrap}>
              {QUICK.filter((q) => !items.includes(q)).map((q) => (
                <TouchableOpacity key={q} style={styles.quickChip} onPress={() => addItems(q)}>
                  <Text style={styles.quickText}>+ {q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prompt */}
            <Text style={styles.label}>3. อยากทำแนวไหน (ไม่บังคับ)</Text>
            <TextInput
              style={[styles.input, { flex: 0 }]}
              placeholder="เช่น healthy, camping, ง่าย, ประหยัด"
              placeholderTextColor={colors.muted}
              value={prompt}
              onChangeText={setPrompt}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.runBtn} onPress={run}>
              <Text style={styles.runText}>✨ เจนเมนูด้วย AI</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'loading' && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>AI กำลังหาเมนูจากวัตถุดิบของคุณ...</Text>
          </View>
        )}

        {phase === 'result' && result && (
          <>
            {result.demo && (
              <View style={styles.note}>
                <Ionicons name="information-circle-outline" size={18} color="#8D6E63" />
                <Text style={styles.noteText}>
                  ตอนนี้ยังไม่ได้เชื่อมระบบอ่านภาพจริง จึงใช้วัตถุดิบตัวอย่างแทน ลองพิมพ์วัตถุดิบเองเพื่อให้ผลตรงกับของที่มี
                </Text>
              </View>
            )}

            <Text style={styles.label}>วัตถุดิบที่ใช้หาเมนู</Text>
            <View style={styles.wrap}>
              {result.detected.map((x) => (
                <View key={x} style={styles.itemChip}>
                  <Text style={styles.itemChipText}>{x}</Text>
                </View>
              ))}
            </View>
            {prompt.trim() ? <Text style={styles.sub}>แนวที่เลือก: {prompt.trim()}</Text> : null}

            <Text style={[styles.label, { marginTop: 18 }]}>เมนูที่ AI แนะนำ ({result.matches.length})</Text>
            {result.matches.length === 0 && (
              <Text style={styles.empty}>ยังไม่พบเมนูที่ตรงกับวัตถุดิบ ลองเพิ่มวัตถุดิบแล้วค้นหาใหม่</Text>
            )}
            {result.matches.map(({ post, missing }) => (
              <TouchableOpacity key={post.id} style={styles.menuRow} onPress={() => onOpenPost(post.id)}>
                <View style={styles.menuImg}>
                  <Text style={{ fontSize: 30 }}>{post.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuName} numberOfLines={1}>{post.title || post.caption}</Text>
                  {nutriText(post) ? <Text style={styles.menuInfo}>{nutriText(post)}</Text> : null}
                  <View style={[styles.tag, { backgroundColor: missing.length === 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.tagText, { color: missing.length === 0 ? '#2E7D32' : '#C62828' }]}>
                      {missing.length === 0 ? 'ทำได้เลย มีวัตถุดิบครบ' : `ขาด ${missing.length} อย่าง: ${missing.join(', ')}`}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            ))}

            <Text style={styles.saved}>✅ บันทึกลงประวัติการสแกนแล้ว ดูได้ที่โปรไฟล์</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.outBtn} onPress={editAgain}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.outBtnText}>แก้ไขวัตถุดิบ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.outBtn, { marginLeft: 10 }]} onPress={reset}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text style={styles.outBtnText}>สแกนใหม่</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    backgroundColor: 'transparent', // ตั้งเป็นโปร่งใสเพื่อมองเห็นรูปพื้นหลัง
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ตั้งเป็นโปร่งใสเพื่อมองเห็นรูปพื้นหลัง
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 6 },

  label: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginTop: 18, marginBottom: 8 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 10, marginBottom: 6 },
  error: { color: '#E53935', fontSize: 12, marginTop: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginVertical: 16 },

  mediaBox: { height: 170, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mediaImg: { width: '100%', height: '100%' },
  mediaText: { color: colors.primary, marginTop: 6, fontSize: 13 },

  btnRow: { flexDirection: 'row', marginTop: 10 },
  outBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 30, height: 44, backgroundColor: '#fff' },
  outBtnText: { color: colors.primary, fontWeight: 'bold', fontSize: 13, marginLeft: 6 },

  addRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, minHeight: 44, fontSize: 13 },
  addBtn: { marginLeft: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  itemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE0B2', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  itemChipText: { color: colors.text, fontSize: 13 },
  quickChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  quickText: { color: colors.primary, fontSize: 12 },

  runBtn: { backgroundColor: colors.primary, borderRadius: 30, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  runText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  loading: { alignItems: 'center', marginTop: 80 },
  loadingText: { color: colors.text, marginTop: 16 },

  note: { flexDirection: 'row', backgroundColor: '#FFF3CD', borderRadius: 14, padding: 12, alignItems: 'flex-start' },
  noteText: { flex: 1, marginLeft: 8, color: '#6D4C41', fontSize: 12, lineHeight: 18 },

  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 10 },
  menuImg: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuName: { fontWeight: 'bold', color: colors.text, fontSize: 14 },
  menuInfo: { color: colors.muted, fontSize: 11, marginTop: 2 },
  tag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  tagText: { fontSize: 10 },
  saved: { color: '#2E7D32', textAlign: 'center', fontSize: 12, marginTop: 14 },
});
