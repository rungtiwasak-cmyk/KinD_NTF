import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import PostCard from '../components/PostCard';

// หน้ารายละเอียดโพสต์/เมนู: แสดงเป็นโพสต์ พร้อมกางส่วนผสมและวิธีทำให้เลย
export default function PostDetailScreen({ post, onToggleLike, onAddComment, favApi, onOpenCreator, onBack }) {
  return (
    <ImageBackground
      source={require('../assets/bg_detail.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{post ? post.title || 'โพสต์' : 'โพสต์'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {post ? (
          <PostCard
            post={post}
            onToggleLike={onToggleLike}
            onAddComment={onAddComment}
            favApi={favApi}
            onOpenCreator={onOpenCreator}
            defaultOpen
          />
        ) : (
          <Text style={styles.empty}>ไม่พบโพสต์นี้แล้ว (อาจถูกลบไปแล้ว)</Text>
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
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
