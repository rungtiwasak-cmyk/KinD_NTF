import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';

// สีอ้างอิงจากหน้า Login / Register / Home ของแอพ
const COLORS = {
  bg: '#FFF1E0',
  card: '#FFFFFF',
  primary: '#F9511E',
  header: '#FF8A3D',
  text: '#3A2420',
  muted: '#9A8F8A',
  border: '#F1E6DC',
  chipBg: '#FFF1E0',
};

// เมนูตั้งค่า (เอา "แก้ไขโปรไฟล์" กับ "การแจ้งเตือน" ออกแล้ว เพราะมีปุ่มอยู่ที่อื่น)
const MENU = [
  { key: 'posts', icon: 'albums-outline', label: 'โพสต์ของฉัน' },
  { key: 'favorites', icon: 'bookmark-outline', label: 'Favorite ของฉัน' },
  { key: 'liked', icon: 'heart-outline', label: 'ที่กดหัวใจไว้' },
  { key: 'goal', icon: 'flame-outline', label: 'เป้าหมายแคลอรี่' },
  { key: 'help', icon: 'help-circle-outline', label: 'ช่วยเหลือ' },
];

export default function ProfileScreen({
  profile,
  postCount = 0,
  onLogout,
  onEditProfile,
  onOpenMyPosts,
  onOpenFavorites,
  onOpenLiked,
  onOpenHistory,
  onOpenGoal,
  onOpenHelp,
}) {
  const handlers = {
    posts: onOpenMyPosts,
    favorites: onOpenFavorites,
    liked: onOpenLiked,
    goal: onOpenGoal,
    help: onOpenHelp,
  };
  const onMenuPress = (key) => {
    const fn = handlers[key];
    if (fn) fn();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <ImageBackground
    source={require('../assets/bg_profile.jpg')} // เรียกใช้ไฟล์ bg_profile.jpg จากโฟลเดอร์ assets
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ส่วนหัวสีส้ม */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Avatar emoji={profile.avatar} uri={profile.avatarUrl} fontSize={48} />
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.email ? <Text style={styles.email}>{profile.email}</Text> : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={onEditProfile}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editBtnText}>แก้ไขโปรไฟล์</Text>
          </TouchableOpacity>
        </View>

        {/* การ์ดสถิติ ซ้อนทับส่วนหัว */}
        <View style={styles.statsRow}>
          {/* เปลี่ยนเป็นปุ่มประวัติการสแกน */}
          <TouchableOpacity 
            style={styles.statCard} 
            activeOpacity={0.7}
            onPress={onOpenHistory}
          >
            <Ionicons name="time-outline" size={32} color={COLORS.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.statLabel, { fontSize: 13, fontWeight: '700', color: COLORS.text }]}>
              ประวัติการสแกน
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} activeOpacity={0.7} onPress={onOpenMyPosts}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>โพสต์ของฉัน</Text>
          </TouchableOpacity>
        </View>

        {/* ข้อมูลสุขภาพ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ข้อมูลสำหรับ AI แนะนำเมนู</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>กลุ่มผู้ใช้</Text>
            {profile.group ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{profile.group}</Text>
              </View>
            ) : (
              <Text style={styles.infoLabel}>ยังไม่ได้ตั้ง</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>แคลอรี่ต่อวัน</Text>
            <Text style={styles.infoValue}>
              {profile.calorieGoal.toLocaleString()} kcal
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เป้าหมาย</Text>
            {profile.healthGoal ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{profile.healthGoal}</Text>
              </View>
            ) : (
              <Text style={styles.infoLabel}>ยังไม่ได้ตั้ง</Text>
            )}
          </View>

          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.infoLabel}>แพ้อาหาร</Text>
            <View style={styles.chipWrap}>
              {profile.allergies.length === 0 ? (
                <Text style={styles.infoLabel}>ไม่มี</Text>
              ) : (
                profile.allergies.map((item) => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* เมนูตั้งค่า */}
        <View style={styles.card}>
          {MENU.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                index !== MENU.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
              onPress={() => onMenuPress(item.key)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ออกจากระบบ */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(58, 36, 32, 0.08)' },
  default: {
    shadowColor: '#3A2420',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
   },
   container: { flex: 1, backgroundColor: 'transparent' },

  header: {
    backgroundColor:'transparent',
    alignItems: 'center',
    paddingTop: 1,
    paddingBottom: 56,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  avatarEmoji: { fontSize: 48 },
  name: { marginTop: 12, fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  email: { marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  bio: { marginTop: 8, marginHorizontal: 32, fontSize: 13, lineHeight: 19, color: '#FFFFFF', textAlign: 'center' },
  editBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editBtnText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -32,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center', // จัดให้อยู่ตรงกลางมากขึ้น
    ...shadow,
  },
  statNumber: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  statLabel: { marginTop: 2, fontSize: 12, color: COLORS.muted },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    ...shadow,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, color: COLORS.muted },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: { fontSize: 13, color: COLORS.text },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});