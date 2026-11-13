import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import Avatar from '../components/Avatar';
import { nutriText } from '../utils';

// ---------- ข้อมูลจำลอง ----------
const CATEGORIES = [
  'เส้น',
  'ของทอด',
  'ข้าว',
  'ต้ม',
  'ผัด',
  'เผ็ด',
  'เปรี้ยว',
  'หวาน',
];
const REGIONS = ['ภาคเหนือ', 'ภาคอีสาน', 'ภาคกลาง', 'ภาคใต้', 'อาหารต่างประเทศ'];

// ---------- ชิปตัวกรอง ----------
function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------- การ์ด creator (กดเข้าไปดูหน้า Creator ได้) ----------
function CreatorCard({ item, isFollowing, onToggleFollow, onPress }) {
  return (
    <TouchableOpacity style={styles.creatorCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.creatorAvatar}>
        <Avatar emoji={item.emoji || "🧑‍🍳"} uri={item.avatarUrl} fontSize={30} />
      </View>
      <Text style={styles.creatorName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.creatorFocus} numberOfLines={1}>
        {item.postCount} โพสต์
      </Text>
      <Text style={styles.creatorFollowers}>{item.followers} ผู้ติดตาม</Text>
      <TouchableOpacity
        style={[styles.followBtn, isFollowing && styles.followBtnOn]}
        onPress={() => onToggleFollow(item.id)}>
        <Text style={[styles.followText, isFollowing && { color: '#fff' }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ---------- แถวเมนูอันดับ (กดเข้าไปดูสูตรได้) ----------
function MenuRow({ item, rank, onPress, onToggleLike }) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.85} onPress={onPress}>
      <Text style={[styles.rank, rank <= 3 && { color: colors.primary }]}>
        {rank}
      </Text>
      <View style={styles.menuImg}>
        {item.media && item.media.type === 'image' ? (
          <Image source={{ uri: item.media.uri }} style={styles.menuPhoto} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 30 }}>{item.emoji}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuName} numberOfLines={1}>
          {item.title || item.caption}
        </Text>
        {nutriText(item) ? <Text style={styles.menuInfo}>{nutriText(item)}</Text> : null}
        <Text style={styles.menuRegion}>
          {[item.region, item.author].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <TouchableOpacity style={styles.likeBtn} onPress={() => onToggleLike(item.id)}>
        <Ionicons
          name={item.liked ? 'heart' : 'heart-outline'}
          size={20}
          color={colors.primary}
        />
        <Text style={styles.likeCount}>{item.likes}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ---------- หน้าค้นหา ----------
export default function SearchScreen({
  posts = [],
  creators: allCreators = [],
  following = {},
  onToggleFollow,
  onToggleLike,
  onOpenPost,
  onOpenCreator,
}) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState(null);
  const [region, setRegion] = useState(null);

  const q = query.trim().toLowerCase();

  const creators = allCreators.filter(
    (c) => !q || c.name.toLowerCase().includes(q)
  );

  // หมวดของโพสต์: ใช้ cats ถ้ามี ไม่งั้นใช้หมวดที่ผู้โพสต์เลือก
  const catsOf = (p) => p.cats || (p.category ? [p.category] : []);

  const menus = posts
    .filter(
      (p) =>
        (!cat || catsOf(p).includes(cat)) &&
        (!region || p.region === region) &&
        (!q || (p.title || p.caption || '').toLowerCase().includes(q))
    )
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10);

  // ตั้งชื่อหัวข้อตามตัวกรองที่เลือก
  let title = '🔥 เมนูยอดนิยมวันนี้';
  if (cat && region) title = `🏆 10 อันดับเมนู${cat} (${region})`;
  else if (cat) title = `🏆 10 อันดับเมนู${cat}ประจำวัน`;
  else if (region) title = region.startsWith('อาหาร') ? `🏆 10 อันดับ${region}` : `🏆 10 อันดับอาหาร${region}`;
  if (q) title = `ผลการค้นหาเมนู "${query.trim()}"`;

  const clearAll = () => {
    setQuery('');
    setCat(null);
    setRegion(null);
  };
  const hasFilter = q || cat || region;

  return (
    <ImageBackground
      source={require('../assets/bg_search.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* ช่องค้นหา */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหา creator หรือเมนูอาหาร"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Creator */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>👩‍🍳 Creator แนะนำ</Text>
        </View>
        {creators.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {creators.map((c) => (
              <CreatorCard
                key={c.id}
                item={c}
                isFollowing={!!following[c.id]}
                onToggleFollow={onToggleFollow}
                onPress={() => onOpenCreator(c.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.empty}>ไม่พบ creator ที่ค้นหา</Text>
        )}

        {/* ตัวกรอง: อยากกินอะไรดี */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>😋 อยากกินอะไรดี</Text>
        </View>
        <View style={styles.chipWrap}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={`อยากกิน${c}`}
              selected={cat === c}
              onPress={() => setCat(cat === c ? null : c)}
            />
          ))}
        </View>

        {/* ตัวกรอง: อาหารประจำภาค */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>🗺️ อาหารประจำภาค</Text>
        </View>
        <View style={styles.chipWrap}>
          {REGIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              selected={region === r}
              onPress={() => setRegion(region === r ? null : r)}
            />
          ))}
        </View>

        {/* รายการเมนู */}
        <View style={[styles.sectionHead, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { flex: 1 }]}>{title}</Text>
          {hasFilter ? (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clear}>ล้างตัวกรอง</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {menus.length > 0 ? (
          menus.map((m, i) => (
            <MenuRow
              key={m.id}
              item={m}
              rank={i + 1}
              onPress={() => onOpenPost(m.id)}
              onToggleLike={onToggleLike}
            />
          ))
        ) : (
          <Text style={styles.empty}>
            ไม่พบเมนูที่ตรงกับตัวกรอง ลองเปลี่ยนหรือล้างตัวกรองดูครับ
          </Text>
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
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  clear: { color: colors.primary, fontSize: 13, fontWeight: 'bold' },
  empty: { color: colors.muted, textAlign: 'center', marginVertical: 16 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: 'bold' },

  creatorCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  creatorName: { fontWeight: 'bold', color: colors.text, fontSize: 13 },
  creatorFocus: { color: colors.muted, fontSize: 11, marginTop: 2 },
  creatorFollowers: { color: colors.text, fontSize: 11, marginTop: 4 },
  followBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  followBtnOn: { backgroundColor: colors.primary },
  followText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  rank: {
    width: 28,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.muted,
  },
  menuImg: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  menuName: { fontWeight: 'bold', color: colors.text, fontSize: 14 },
  menuInfo: { color: colors.muted, fontSize: 11, marginTop: 2 },
  menuPhoto: { width: '100%', height: '100%', borderRadius: 14 },
  menuRegion: { color: colors.primary, fontSize: 11, marginTop: 2 },
  likeBtn: { alignItems: 'center', paddingHorizontal: 6 },
  likeCount: { fontSize: 10, color: colors.text, marginTop: 1 },
});
