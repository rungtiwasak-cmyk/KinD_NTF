import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import PostCard from '../components/PostCard';

// หน้ารายละเอียดโพสต์/เมนู: แสดงเป็นโพสต์ พร้อมกางส่วนผสมและวิธีทำให้เลย
export default function PostDetailScreen({ post, onLogMeal, onToggleLike, onAddComment, favApi, onOpenCreator, onBack }) {
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState('');
  const kcal = post ? parseInt(String(post.kcal || '').replace(/[^0-9]/g, ''), 10) || 0 : 0;

  // บันทึกว่ากินเมนูนี้แล้ว -> รวมเข้าแคลอรี่วันนี้ (บันทึกลง DB)
  const logThis = async () => {
    setLogging(true);
    setLogMsg('');
    try {
      await onLogMeal({ postId: post.id, title: post.title || post.caption || 'มื้ออาหาร', kcal });
      setLogMsg(`บันทึกแล้ว +${kcal} kcal ✓`);
    } catch (err) {
      console.log('บันทึกมื้ออาหารไม่สำเร็จ:', err);
      setLogMsg('บันทึกไม่สำเร็จ: ' + (err?.message || 'ลองอีกครั้ง'));
    }
    setLogging(false);
  };
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
        ) : null}
        {post && onLogMeal ? (
          <View style={{ marginTop: 4 }}>
            <TouchableOpacity
              style={[styles.logBtn, (kcal <= 0 || logging) && { opacity: 0.5 }]}
              onPress={logThis}
              disabled={kcal <= 0 || logging}
              activeOpacity={0.85}
            >
              {logging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.logBtnText}>
                  🍽️ บันทึกว่ากินมื้อนี้{kcal > 0 ? ` (~${kcal} kcal)` : ''}
                </Text>
              )}
            </TouchableOpacity>
            {kcal <= 0 ? <Text style={styles.logMsg}>โพสต์นี้ไม่ได้ระบุแคลอรี่ จึงบันทึกไม่ได้</Text> : null}
            {logMsg ? <Text style={styles.logMsg}>{logMsg}</Text> : null}
          </View>
        ) : null}
        {!post ? (
          <Text style={styles.empty}>ไม่พบโพสต์นี้แล้ว (อาจถูกลบไปแล้ว)</Text>
        ) : null}
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
  logBtn: { backgroundColor: colors.primary, borderRadius: 30, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  logBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  logMsg: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 6 },
});
