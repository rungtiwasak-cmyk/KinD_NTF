import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { ago } from '../utils';

const ICONS = {
  menu: 'restaurant-outline',
  follow: 'person-add-outline',
  reply: 'chatbubble-outline',
  comment: 'chatbubble-outline',
  like: 'heart-outline',
  system: 'flame-outline',
};

export default function NotificationsScreen({ notifications, onOpen, onReadAll, onBack }) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <ImageBackground
      source={require('../assets/bg_notification.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>การแจ้งเตือน</Text>
        <TouchableOpacity onPress={onReadAll} disabled={unread === 0}>
          <Text style={[styles.readAll, unread === 0 && { color: colors.muted }]}>อ่านทั้งหมด</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {notifications.length === 0 && <Text style={styles.empty}>ยังไม่มีการแจ้งเตือน</Text>}
        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.row, !n.read && styles.rowUnread]}
            activeOpacity={0.8}
            onPress={() => onOpen(n)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={ICONS[n.type] || 'notifications-outline'} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.text, !n.read && { fontWeight: 'bold' }]}>{n.text}</Text>
              <Text style={styles.time}>{ago(n.at)}</Text>
            </View>
            {!n.read && <View style={styles.dot} />}
          </TouchableOpacity>
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
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 6 },
  readAll: { color: colors.primary, fontWeight: 'bold', fontSize: 13, paddingHorizontal: 6 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10 },
  rowUnread: { backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#FFD9B8' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.text, fontSize: 13, lineHeight: 19 },
  time: { color: colors.muted, fontSize: 11, marginTop: 3 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 8 },
});
