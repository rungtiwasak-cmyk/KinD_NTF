import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { nutriText } from '../utils';
import Avatar from './Avatar';

// หน้าต่างจัดกลุ่ม Favorite
function CollectionSheet({ visible, onClose, postId, favApi }) {
  const [name, setName] = useState('');
  const { favs, collections, toggleInCollection, createCollection, toggleFav } = favApi;
  const selected = favs[postId] || [];

  const add = () => {
    if (!name.trim()) return;
    createCollection(name.trim());
    setName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>จัดกลุ่ม Favorite</Text>
          <ScrollView style={{ maxHeight: 220 }}>
            {collections.map((c) => {
              const on = selected.includes(c.id);
              return (
                <TouchableOpacity key={c.id} style={styles.sheetRow} onPress={() => toggleInCollection(postId, c.id)}>
                  <Ionicons name="folder-outline" size={20} color={colors.primary} />
                  <Text style={styles.sheetRowText}>{c.name}</Text>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.primary : colors.muted} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.newRow}>
            <TextInput
              style={styles.newInput}
              placeholder="สร้างกลุ่มใหม่ เช่น เมนูคุมน้ำหนัก"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              onSubmitEditing={add}
            />
            <TouchableOpacity style={styles.newBtn} onPress={add}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => {
              toggleFav(postId);
              onClose();
            }}
          >
            <Text style={styles.removeText}>ลบออกจาก Favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>เสร็จสิ้น</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function PostCard({ post, onToggleLike, onAddComment, favApi, defaultOpen = false, onOpenCreator }) {
  const canOpenCreator = !!onOpenCreator && !post.mine && !!post.creatorId;
  const [showDetail, setShowDetail] = useState(defaultOpen);
  const [showComments, setShowComments] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [text, setText] = useState('');

  const saved = favApi ? favApi.favs[post.id] !== undefined : false;

  const send = () => {
    if (!text.trim()) return;
    onAddComment(post.id, text.trim());
    setText('');
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHead}
        activeOpacity={canOpenCreator ? 0.7 : 1}
        disabled={!canOpenCreator}
        onPress={() => onOpenCreator(post.creatorId)}
      >
        <View style={styles.avatar}>
          <Avatar emoji={post.emoji} uri={post.avatarUrl} fontSize={22} />
        </View>
        <Text style={styles.author}>{post.author}</Text>
        {canOpenCreator ? <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginRight: 8 }} /> : null}
        <View style={styles.catTag}>
          <Text style={styles.catTagText}>{post.category}</Text>
        </View>
      </TouchableOpacity>

      {post.media && post.media.type === 'image' ? (
        <Image source={{ uri: post.media.uri }} style={styles.postMedia} resizeMode="cover" />
      ) : (
        <View style={[styles.postMedia, styles.postMediaEmpty]}>
          {post.media && post.media.type === 'video' ? (
            <Ionicons name="videocam" size={44} color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 60 }}>{post.emoji}</Text>
          )}
        </View>
      )}

      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      <Text style={[styles.caption, post.title ? { marginTop: 4 } : null]}>{post.caption}</Text>
      {nutriText(post) ? <Text style={styles.nutri}>{nutriText(post)}</Text> : null}

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionItem} onPress={() => onToggleLike(post.id)}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={24} color={colors.primary} />
          <Text style={styles.actionCount}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          <Text style={styles.actionCount}>{post.comments.length}</Text>
        </TouchableOpacity>
        {favApi && (
          <TouchableOpacity style={styles.actionItem} onPress={() => favApi.toggleFav(post.id)}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? '#F5A623' : colors.text} />
            <Text style={styles.actionCount}>{saved ? 'บันทึกแล้ว' : 'Favorite'}</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {saved && (
          <TouchableOpacity style={styles.groupBtn} onPress={() => setShowSheet(true)}>
            <Ionicons name="folder-open-outline" size={14} color={colors.primary} />
            <Text style={styles.groupText}>จัดกลุ่ม</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => setShowDetail(!showDetail)} style={{ marginTop: 8 }}>
        <Text style={styles.detailLink}>{showDetail ? 'ซ่อนสูตร ▲' : 'ดูส่วนผสม/วิธีทำ ▼'}</Text>
      </TouchableOpacity>

      {showDetail && (
        <View style={styles.detailBox}>
          <Text style={styles.detailTitle}>ส่วนผสม</Text>
          {post.ingredients.map((s, i) => (
            <Text key={i} style={styles.detailText}>• {s}</Text>
          ))}
          <Text style={[styles.detailTitle, { marginTop: 10 }]}>วิธีทำ</Text>
          {post.steps.map((s, i) => (
            <Text key={i} style={styles.detailText}>{i + 1}. {s}</Text>
          ))}
        </View>
      )}

      {showComments && (
        <View style={styles.commentBox}>
          {post.comments.length === 0 && <Text style={styles.noComment}>ยังไม่มีความคิดเห็น</Text>}
          {post.comments.map((c) => (
            <Text key={c.id} style={styles.commentText}>
              <Text style={{ fontWeight: 'bold' }}>{c.user}  </Text>{c.text}
            </Text>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.input}
              placeholder="เขียนความคิดเห็น..."
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {favApi && (
        <CollectionSheet visible={showSheet} onClose={() => setShowSheet(false)} postId={post.id} favApi={favApi} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  author: { flex: 1, marginLeft: 10, fontWeight: 'bold', color: colors.text },
  catTag: { backgroundColor: '#FFE0B2', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  catTagText: { color: colors.primary, fontSize: 11, fontWeight: 'bold' },
  postMedia: { width: '100%', height: 220, borderRadius: 14 },
  postMediaEmpty: { backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, marginTop: 10, fontSize: 17, fontWeight: 'bold' },
  caption: { color: colors.text, marginTop: 10, fontSize: 14 },
  nutri: { color: colors.muted, fontSize: 12, marginTop: 4 },
  actionBar: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  actionCount: { marginLeft: 4, color: colors.text, fontSize: 12 },
  groupBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  groupText: { color: colors.primary, fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  detailLink: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  detailBox: { backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginTop: 10 },
  detailTitle: { fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  detailText: { color: colors.text, fontSize: 13, marginBottom: 2 },
  commentBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  noComment: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  commentText: { color: colors.text, fontSize: 13, marginBottom: 6 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, minHeight: 40, fontSize: 13 },
  sendBtn: { marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  // หน้าต่างจัดกลุ่ม
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  sheetTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetRowText: { flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 },
  newRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  newInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, height: 42, fontSize: 13 },
  newBtn: { marginLeft: 8, width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  removeText: { color: '#E53935', fontWeight: 'bold' },
  doneBtn: { backgroundColor: colors.primary, borderRadius: 30, height: 48, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});