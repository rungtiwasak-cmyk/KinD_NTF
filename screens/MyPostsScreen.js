import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import PostCard from '../components/PostCard';

// โพสต์ 1 ใบ + ปุ่มลบ (กดยืนยัน 2 ครั้ง กันกดพลาด)
function MyPostItem({ post, onDelete, onToggleLike, onAddComment, favApi }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <View>
      <View style={styles.deleteRow}>
        {confirm ? (
          <>
            <Text style={styles.confirmText}>ลบโพสต์นี้ถาวร?</Text>
            <TouchableOpacity style={styles.delYes} onPress={() => onDelete(post.id)}>
              <Text style={styles.delYesText}>ลบ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.delNo} onPress={() => setConfirm(false)}>
              <Text style={styles.delNoText}>ยกเลิก</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.delBtn} onPress={() => setConfirm(true)}>
            <Ionicons name="trash-outline" size={16} color="#E53935" />
            <Text style={styles.delBtnText}>ลบโพสต์</Text>
          </TouchableOpacity>
        )}
      </View>
      <PostCard post={post} onToggleLike={onToggleLike} onAddComment={onAddComment} favApi={favApi} />
    </View>
  );
}

export default function MyPostsScreen({ posts, favApi, onToggleLike, onAddComment, onDelete, onCreate, onBack }) {
  const likes = posts.reduce((sum, p) => sum + p.likes, 0);
  const comments = posts.reduce((sum, p) => sum + p.comments.length, 0);

  return (
    <ImageBackground
      source={require('../assets/bg_myposts.jpg')} // เรียกใช้ไฟล์ bg_myposts.jpg
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>โพสต์ของฉัน</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{posts.length}</Text>
            <Text style={styles.sumLabel}>โพสต์</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{likes}</Text>
            <Text style={styles.sumLabel}>ไลก์</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{comments}</Text>
            <Text style={styles.sumLabel}>คอมเมนต์</Text>
          </View>
        </View>

        {posts.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <Text style={[styles.empty, { color: '#FFFFFF' }]}>ยังไม่มีโพสต์ของคุณ</Text>
            <TouchableOpacity style={styles.createBtn} onPress={onCreate}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createText}>สร้างโพสต์แรก</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((p) => (
            <MyPostItem
              key={p.id}
              post={p}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
              favApi={favApi}
            />
          ))
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
    height: '100%',},
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  container: { flex: 1,
    backgroundColor: 'transparent', },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 6 },
  summary: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 14, marginBottom: 16 },
  sumItem: { flex: 1, alignItems: 'center' },
  sumNum: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  sumLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, marginBottom: 14 },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 30, paddingHorizontal: 22, height: 46 },
  createText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 },
  delBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  delBtnText: { color: '#E53935', fontSize: 12, marginLeft: 4 },
  confirmText: { color: colors.text, fontSize: 12, marginRight: 8 },
  delYes: { backgroundColor: '#E53935', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginRight: 6 },
  delYesText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  delNo: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#fff' },
  delNoText: { color: colors.text, fontSize: 12 },
});
