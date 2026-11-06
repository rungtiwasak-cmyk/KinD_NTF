import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PostCard from "../components/PostCard";
import { colors } from "../theme";
import { nutriText } from "../utils";

// ---------- ข้อมูลจำลอง ----------
// เมนูแนะนำ: อ้างอิงโพสต์ด้วย postId (กดแล้วเปิดหน้าโพสต์ที่มีวิธีทำ)
const RECOMMENDED = [
  { postId: 1, ready: true },
  { postId: 2, ready: false },
  { postId: 3, ready: true },
];

// ---------- ส่วนหัว ----------
function Header({ name, avatar, notifCount, onBell }) {
  return (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 28 }}>{avatar}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.hello}>สวัสดีคุณ {name} 👋</Text>
        <Text style={styles.helloSub}>วันนี้ทานอะไรดี?</Text>
      </View>
      <TouchableOpacity
        onPress={onBell}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="notifications-outline" size={28} color="#fff" />
        {notifCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notifCount > 9 ? "9+" : notifCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------- แถบแคลอรี่ ----------
function StatusRow({ eaten, goal }) {
  const percent = Math.min(eaten / goal, 1) * 100;
  return (
    <View style={styles.statusBox}>
      <Text style={styles.kcalText}>
        🔥 แคลอรี่วัน: {eaten.toLocaleString()} / {goal.toLocaleString()} kcal
      </Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

// ---------- การ์ดสแกนตู้เย็น ----------
function ScanCard({ prompt, setPrompt, onScan, onUpload, onGenerate }) {
  return (
    <ImageBackground
      source={require("../assets/bg_ai.jpg")}
      style={styles.scanCard}
      imageStyle={{ borderRadius: 24 }} // กำหนดความโค้งมนให้รูปภาพพื้นหลัง
      resizeMode="cover"
    >
      <View style={styles.scanCardContent}>
        <View style={styles.scanTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanTitle}>สแกนตู้เย็น{"\n"}ด้วย AI</Text>
            <Text style={styles.scanSub}>
              แค่ถ่ายรูป หรือพิมพ์รายการ{"\n"}ก็เจอเมนูที่ใช้ได้ทันที!
            </Text>
          </View>
          <TouchableOpacity style={styles.cameraBtn} onPress={onScan}>
            <Ionicons name="camera" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.actionRow} onPress={onUpload}>
        <Ionicons name="camera" size={20} color={colors.primary} />
        <Text style={styles.actionText}>ถ่ายรูปตู้เย็น / อัปโหลดวิดีโอ</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.generateBtn} onPress={onGenerate}>
        <Text style={styles.generateText}>
          ✨ เคลียร์ตู้เย็น & เจนเมนูด้วย AI
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.promptLabel}>Prompt (Optional)</Text>
      <TextInput
        style={styles.promptInput}
        placeholder="อยากทำอะไร แนวไหน เช่น camping, healthy"
        placeholderTextColor={colors.muted}
        value={prompt}
        onChangeText={setPrompt}
      />
    </ImageBackground>
  );
}

// ---------- หัวข้อของแต่ละส่วน ----------
function SectionHead({ title, action }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.seeAll}>{action}</Text> : null}
    </View>
  );
}

// ---------- การ์ดเมนูฮิต (มีเลขอันดับ) กดเข้าไปดูสูตรได้ ----------
const fmtLikes = (n) => {
  const v = Number(n) || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
};

function TopMenuCard({ item, rank, onPress, onToggleLike }) {
  return (
    <TouchableOpacity
      style={styles.topCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.topImg}>
        {item.media && item.media.type === "image" ? (
          <Image
            source={{ uri: item.media.uri }}
            style={styles.topPhoto}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
        )}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}.</Text>
        </View>
        <TouchableOpacity
          style={styles.heart}
          onPress={() => onToggleLike(item.id)}
        >
          <Ionicons
            name={item.liked ? "heart" : "heart-outline"}
            size={14}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.likePill}>
        <Text style={styles.likeText}>👍 {fmtLikes(item.likes)}</Text>
      </View>
      <Text style={styles.menuName} numberOfLines={1}>
        {rank}. {item.title || item.caption}
      </Text>
      {nutriText(item) ? (
        <Text style={styles.menuInfo}>{nutriText(item)}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ---------- การ์ดเมนูแนะนำ (มีปุ่ม Follow) กดเข้าไปดูโพสต์/วิธีทำได้ ----------
function RecommendCard({ post, ready, onPress, following, onToggleFollow }) {
  return (
    <TouchableOpacity
      style={styles.recCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.recImg}>
        <Text style={{ fontSize: 44 }}>{post.emoji}</Text>
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followBtnOn]}
          onPress={() => onToggleFollow(post.author)}
        >
          <Text style={[styles.followText, following && { color: "#fff" }]}>
            {following ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.tagBox,
          { backgroundColor: ready ? "#E8F5E9" : "#FFEBEE" },
        ]}
      >
        <Text
          style={[styles.tagText, { color: ready ? "#2E7D32" : "#C62828" }]}
        >
          {ready ? "ทำได้เลย" : "ขาดวัตถุดิบ"}
        </Text>
      </View>
      <Text style={styles.menuName} numberOfLines={1}>
        {post.title || post.caption}
      </Text>
      {nutriText(post) ? (
        <Text style={styles.menuInfo}>{nutriText(post)}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ---------- หน้า Home ----------
export default function HomeScreen({
  posts = [],
  profile = { name: "", avatar: "" },
  calorieGoal = 2000,
  eaten = 1400,
  unreadCount = 0,
  onToggleLike,
  onAddComment,
  favApi,
  onOpenScan,
  onOpenNotifications,
  onOpenPost,
  onOpenCreator,
  following = {},
  onToggleFollow,
}) {
  const [prompt, setPrompt] = useState("");

  // ฟีดแสดงเฉพาะโพสต์ของคนอื่นที่เปิดให้ขึ้นฟีด
  const feedPosts = posts.filter((p) => !p.mine && p.feed !== false);

  // 10 อันดับเมนูฮิต เรียงตามยอดไลก์ (เอา // ออก และดัก posts ว่างไว้กันแอปเด้ง)
  const topMenus = posts
    ? [...posts].sort((a, b) => b.likes - a.likes).slice(0, 10)
    : [];
  const recs = RECOMMENDED.map((r) => ({
    ...r,
    post: posts.find((p) => p.id === r.postId),
  })).filter((r) => r.post);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBg}>
          <Header
            name={profile.name}
            avatar={profile.avatar}
            notifCount={unreadCount}
            onBell={onOpenNotifications}
          />
          <StatusRow eaten={eaten} goal={calorieGoal} />
        </View>
        <View style={styles.body}>
          <ScanCard
            prompt={prompt}
            setPrompt={setPrompt}
            onScan={() => onOpenScan(prompt)}
            onUpload={() => onOpenScan(prompt)}
            onGenerate={() => onOpenScan(prompt)}
          />

          <SectionHead title="🏆 10 อันดับเมนูฮิตรายวัน" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topMenus.map((m, i) => (
              <TopMenuCard
                key={m.post_id || m.id || i}
                item={m}
                rank={i + 1}
                onPress={() => onOpenPost(m.id)}
                onToggleLike={onToggleLike}
              />
            ))}
          </ScrollView>

          <SectionHead title="🍽️ เมนูแนะนำสำหรับคุณ" action="ดูทั้งหมด ›" />
          <Text style={styles.sectionSub}>
            อิงจาก Creator ที่ follow, ค้นหา, และไลค์
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recs.map((r) => (
              <RecommendCard
                key={r.postId}
                post={r.post}
                ready={r.ready}
                onPress={() => onOpenPost(r.postId)}
                following={!!following[r.post.author]}
                onToggleFollow={onToggleFollow}
              />
            ))}
          </ScrollView>

          <SectionHead title="👥 โพสต์จาก Creator" />
          {feedPosts.length === 0 ? (
            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginVertical: 16,
              }}
            >
              ยังไม่มีโพสต์
            </Text>
          ) : (
            feedPosts.map((p) => (
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ส่วนบน
  topBg: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 56,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  hello: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  helloSub: { color: "#fff", opacity: 0.9, marginTop: 2 },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#E53935",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  statusRow: { flexDirection: "row" },
  statusBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    justifyContent: "center",
  },
  kcalText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  barBg: { height: 8, borderRadius: 4, backgroundColor: "#EEE" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },

  body: { paddingHorizontal: 16, marginTop: -36 },

  // การ์ดสแกน
  scanCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  scanCardContent: {},
  scanTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  scanTitle: { fontSize: 24, fontWeight: "bold", color: colors.text },
  scanSub: { color: colors.text, marginTop: 6, fontSize: 12 },
  cameraBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 30,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 10,
  },
  actionText: { flex: 1, marginLeft: 10, color: colors.primary, fontSize: 13 },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 48,
    paddingHorizontal: 20,
  },
  generateText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  promptLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 42,
    fontSize: 12,
    backgroundColor: "#FAFAFA",
  },

  // หัวข้อส่วน
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.text },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: "bold" },
  sectionSub: { color: colors.primary, fontSize: 12, marginBottom: 10 },

  // เมนูฮิต
  topCard: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    marginRight: 10,
  },
  topImg: {
    height: 90,
    borderRadius: 12,
    backgroundColor: "#FFE0B2",
    alignItems: "center",
    justifyContent: "center",
  },
  topPhoto: { width: "100%", height: "100%", borderRadius: 12 },
  rankBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  heart: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  likePill: {
    alignSelf: "center",
    marginTop: -10,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    elevation: 2,
  },
  likeText: { fontSize: 10, color: colors.text },
  menuName: {
    fontWeight: "bold",
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
  },
  menuInfo: { color: colors.muted, fontSize: 11, marginTop: 2 },

  // เมนูแนะนำ
  recCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    marginRight: 10,
  },
  recImg: {
    height: 100,
    borderRadius: 12,
    backgroundColor: "#FFE0B2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  followBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  followBtnOn: { backgroundColor: colors.primary },
  followText: { fontSize: 11, color: colors.primary, fontWeight: "bold" },
  tagBox: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  tagText: { fontSize: 10 },

  // tab ล่าง
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabLabel: { fontSize: 10, marginTop: 2 },
  postBadge: {
    position: "absolute",
    top: -6,
    right: -22,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  postBadgeText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
});
