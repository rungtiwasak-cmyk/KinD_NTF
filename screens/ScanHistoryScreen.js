import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const pad = (n) => String(n).padStart(2, '0');
const fmt = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ScanHistoryScreen({ history, onDelete, onBack }) {
  return (
    <ImageBackground
      source={require('../assets/bg_history.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>ประวัติการสแกน</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {history.length === 0 && <Text style={styles.empty}>ยังไม่มีประวัติการสแกน</Text>}
        {history.map((h) => (
          <View key={h.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.date}>{fmt(h.at)}</Text>
              <TouchableOpacity onPress={() => onDelete(h.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {h.prompt ? <Text style={styles.prompt}>Prompt: {h.prompt}</Text> : null}

            {h.ingredients.length > 0 && (
              <>
                <Text style={styles.sub}>วัตถุดิบที่เจอ</Text>
                <View style={styles.wrap}>
                  {h.ingredients.map((x, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{x}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {h.menus.length > 0 && (
              <>
                <Text style={styles.sub}>เมนูที่ AI แนะนำ</Text>
                {h.menus.map((m, i) => (
                  <Text key={i} style={styles.menu}>• {m}</Text>
                ))}
              </>
            )}
          </View>
        ))}
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
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 6 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  date: { flex: 1, marginLeft: 6, fontWeight: 'bold', color: colors.text },
  prompt: { color: colors.muted, fontSize: 12, marginTop: 8 },
  sub: { color: colors.primary, fontWeight: 'bold', fontSize: 12, marginTop: 10, marginBottom: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#FFE0B2', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
  tagText: { color: colors.text, fontSize: 12 },
  menu: { color: colors.text, fontSize: 13, marginBottom: 2 },
});