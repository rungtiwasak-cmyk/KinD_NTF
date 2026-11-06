import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import PostCard from '../components/PostCard';

function CollectionChip({ id, label, group, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, group === id && styles.chipOn]}
      onPress={onPress}>
      <Text style={[styles.chipText, group === id && styles.chipTextOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function FavoritesScreen({
  posts,
  favApi,
  onToggleLike,
  onAddComment,
  onBack,
  onOpenCreator,
  initialTab = 'fav',
}) {
  const [tab, setTab] = useState(initialTab);
  const [group, setGroup] = useState('all'); // 'all' | 'none' | id ของกลุ่ม
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const { favs, collections, createCollection } = favApi;

  const favPosts = posts.filter((p) => favs[p.id] !== undefined);
  const likedPosts = posts.filter((p) => p.liked);
  const countIn = (id) =>
    favPosts.filter((p) => favs[p.id].includes(id)).length;
  const countNone = favPosts.filter((p) => favs[p.id].length === 0).length;

  const shown = favPosts.filter((p) => {
    if (group === 'all') return true;
    if (group === 'none') return favs[p.id].length === 0;
    return favs[p.id].includes(group);
  });

  const addGroup = () => {
    if (!name.trim()) return;
    createCollection(name.trim());
    setName('');
    setAdding(false);
  };

  return (
    <ImageBackground
      source={require('../assets/bg_favorite.jpg')} // เรียกใช้ไฟล์ bg_favorite.jpg
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Favorite ของฉัน</Text>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'fav' && styles.toggleOn]}
          onPress={() => setTab('fav')}>
          <Text
            style={[styles.toggleText, tab === 'fav' && styles.toggleTextOn]}>
            Favorite ({favPosts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'liked' && styles.toggleOn]}
          onPress={() => setTab('liked')}>
          <Text
            style={[styles.toggleText, tab === 'liked' && styles.toggleTextOn]}>
            กดหัวใจไว้ ({likedPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
        {tab === 'fav' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}>
              <CollectionChip
                id="all"
                label={`ทั้งหมด (${favPosts.length})`}
                group={group}
                onPress={() => setGroup('all')}
              />
              {collections.map((c) => (
                <CollectionChip
                  key={c.id}
                  id={c.id}
                  label={`${c.name} (${countIn(c.id)})`}
                  group={group}
                  onPress={() => setGroup(c.id)}
                />
              ))}
              <CollectionChip
                id="none"
                label={`ยังไม่จัดกลุ่ม (${countNone})`}
                group={group}
                onPress={() => setGroup('none')}
              />
              <TouchableOpacity
                style={styles.chipAdd}
                onPress={() => setAdding(!adding)}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.chipAddText}>กลุ่มใหม่</Text>
              </TouchableOpacity>
            </ScrollView>

            {adding && (
              <View style={styles.newRow}>
                <TextInput
                  style={styles.newInput}
                  placeholder="ชื่อกลุ่ม"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={addGroup}
                />
                <TouchableOpacity style={styles.newBtn} onPress={addGroup}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    เพิ่ม
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {shown.length === 0 ? (
              <Text style={styles.empty}>
                {favPosts.length === 0
                  ? 'ยังไม่มีโพสต์ใน Favorite กดรูป bookmark ที่โพสต์เพื่อเก็บไว้ได้เลย'
                  : 'ยังไม่มีโพสต์ในกลุ่มนี้'}
              </Text>
            ) : (
              shown.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onToggleLike={onToggleLike}
                  onAddComment={onAddComment}
                  favApi={favApi}
                  onOpenCreator={onOpenCreator}
                />
              ))
            )}
          </>
        )}

        {tab === 'liked' &&
          (likedPosts.length === 0 ? (
            <Text style={styles.empty}>ยังไม่ได้กดหัวใจโพสต์ไหนเลย</Text>
          ) : (
            likedPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onToggleLike={onToggleLike}
                onAddComment={onAddComment}
                favApi={favApi}
                onOpenCreator={onOpenCreator}
              />
            ))
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
  container: {flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 26,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleText: { color: colors.text, fontWeight: 'bold', fontSize: 13 },
  toggleTextOn: { color: '#fff' },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: 'bold' },
  chipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipAddText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  newRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  newInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 42,
  },
  newBtn: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
