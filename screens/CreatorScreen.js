import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';

// หน้า Creator: โปรไฟล์ของ Creator + โพสต์ทั้งหมดของเขา
export default function CreatorScreen({
  creator,
  posts,
  isFollowing,
  onToggleFollow,
  favApi,
  onToggleLike,
  onAddComment,
  onBack,
}) {
  const sorted = [...posts].sort((a, b) => b.likes - a.likes);
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

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
        <Text style={styles.title} numberOfLines={1}>{creator ? creator.name : 'Creator'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {!creator ? (
          <Text style={styles.empty}>ไม่พบ Creator คนนี้</Text>
        ) : (
          <>
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Avatar emoji={creator.emoji} uri={creator.avatarUrl} fontSize={44} />
              </View>
              <Text style={styles.name}>{creator.name}</Text>
              {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{posts.length}</Text>
                  <Text style={styles.statLabel}>โพสต์</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{creator.followers}</Text>
                  <Text style={styles.statLabel}>ผู้ติดตาม</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{fmt(totalLikes)}</Text>
                  <Text style={styles.statLabel}>ไลก์รวม</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnOn]}
                onPress={() => onToggleFollow(creator.id)}
              >
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'add'}
                  size={18}
                  color={isFollowing ? '#fff' : colors.primary}
                />
                <Text style={[styles.followText, isFollowing && { color: '#fff' }]}>
                  {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.section}>โพสต์ของ {creator.name}</Text>
            {sorted.length === 0 ? (
              <Text style={styles.empty}>ยังไม่มีโพสต์</Text>
            ) : (
              sorted.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onToggleLike={onToggleLike}
                  onAddComment={onAddComment}
                  favApi={favApi}
                />
              ))
            )}
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
  empty: { textAlign: 'center', color: colors.muted, marginTop: 30 },

  profile: { backgroundColor: '#fff', borderRadius: 24, padding: 18, alignItems: 'center' },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 10 },
  bio: { fontSize: 13, color: colors.text, opacity: 0.8, textAlign: 'center', marginTop: 6, marginHorizontal: 24, lineHeight: 19 },
  handle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  focus: { color: colors.primary, fontSize: 13, marginTop: 6 },

  stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },

  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderWidth: 1.5, borderColor: colors.primary, borderRadius: 30, height: 44, marginTop: 16 },
  followBtnOn: { backgroundColor: colors.primary },
  followText: { color: colors.primary, fontWeight: 'bold', fontSize: 14, marginLeft: 6 },

  section: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 22, marginBottom: 10 },
});
