import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const TABS = [
  { key: 'home', label: 'หน้าหลัก', icon: 'home' },
  { key: 'search', label: 'ค้นหา', icon: 'search' },
  { key: 'post', label: 'ปุ่มโพสต์', icon: 'plus-square' },
  { key: 'profile', label: 'PROFILE USER', icon: 'user' },
];

export default function BottomTabs({ active, onChange }) {
  // เว้นที่ด้านล่างให้แถบปุ่มระบบของมือถือ (ปุ่ม Back/Home/Recent หรือแถบท่าทาง) ไม่ให้ทับเมนู
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: 8 + insets.bottom }]}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        const color = isActive ? colors.primary : colors.muted;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => onChange(t.key)}>
            <View>
              <Feather name={t.icon} size={24} color={color} />
              {t.key === 'post' && (
                <View style={styles.postBadge}>
                  <Text style={styles.postBadgeText}>โพสต์</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 2 },
  postBadge: {
    position: 'absolute',
    top: -6,
    right: -22,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  postBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
});
