import { useEffect, useMemo, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import BottomTabs from "../components/BottomTabs";
import { findCreator } from "../data/creators";
import { createPostInDB, fetchPosts } from "../lib/api";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

import HomeScreen from "./HomeScreen";
import PostScreen from "./PostScreen";
import Profile from "./Profile";
import SearchScreen from "./SearchScreen";

import CreatorScreen from "./CreatorScreen";
import EditProfileScreen from "./EditProfileScreen";
import FavoritesScreen from "./FavoritesScreen";
import GoalScreen from "./GoalScreen";
import HelpScreen from "./HelpScreen";
import MyPostsScreen from "./MyPostsScreen";
import NotificationsScreen from "./NotificationsScreen";
import PostDetailScreen from "./PostDetailScreen";
import ScanHistoryScreen from "./ScanHistoryScreen";
import ScanScreen from "./ScanScreen";

const DAY = 86400000;
const EATEN_TODAY = 1400; // ข้อมูลจำลอง (ยังไม่มีระบบบันทึกมื้ออาหาร)

const INITIAL_PROFILE = {
  name: "รุ่งทิวา",
  email: "rungtiwa@example.com",
  avatar: "👩",
  group: "นักศึกษาหอพัก",
  calorieGoal: 2000,
  healthGoal: null,
  allergies: ["กุ้ง", "ถั่วลิสง"],
};

const SAMPLE_SCANS = [
  {
    id: 1,
    at: Date.now() - 1 * DAY,
    prompt: "healthy",
    ingredients: ["อกไก่", "บรอกโคลี", "ไข่"],
    menus: ["อกไก่ย่างซอสส้ม", "ไข่ตุ๋นบรอกโคลี"],
  },
  {
    id: 2,
    at: Date.now() - 4 * DAY,
    prompt: "",
    ingredients: ["แซลมอน", "มะเขือเทศ"],
    menus: ["แซลมอนอบผัก"],
  },
];

const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: "menu",
    text: "แซลมอนอบผัก เมนูใหม่ที่เหมาะกับเป้าหมายของคุณ",
    at: Date.now() - 12 * 60000,
    read: false,
    postId: 2,
  },
  {
    id: 2,
    type: "follow",
    text: "FitFood Pim เริ่มติดตามคุณ",
    at: Date.now() - 2 * 3600000,
    read: false,
  },
  {
    id: 3,
    type: "reply",
    text: "หนุ่มกะเพรา ตอบกลับความคิดเห็นของคุณในโพสต์อกไก่ย่างซอสส้ม",
    at: Date.now() - 5 * 3600000,
    read: true,
    postId: 1,
  },
  {
    id: 4,
    type: "system",
    text: "วันนี้คุณกินไปแล้ว 70% ของเป้าหมายแคลอรี่",
    at: Date.now() - 1 * DAY,
    read: true,
  },
];

export default function MainScreen({ onLogout }) {
  const [tab, setTab] = useState("home");
  // stack ของหน้าที่เปิดทับแท็บ เช่น แจ้งเตือน สแกน รายละเอียดโพสต์
  const [stack, setStack] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [scanHistory, setScanHistory] = useState(SAMPLE_SCANS);

  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  const push = (name, params = {}) => setStack((s) => [...s, { name, params }]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const changeTab = (t) => {
    setTab(t);
    setStack([]);
  };

  // ปุ่ม Back ของ Android ให้ย้อนหน้า
  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 0) {
        setStack((s) => s.slice(0, -1));
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length]);
  // ---------- โหลดข้อมูลโพสต์และโปรไฟล์จากฐานข้อมูล ----------
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        // 1. ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ปัจจุบันจาก Auth
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 2. ดึงข้อมูลโปรไฟล์จริงจากตาราง users โดยใช้ user_id
          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (!profileError && profileData && !cancelled) {
            // อัปเดตข้อมูลโปรไฟล์ด้วยข้อมูลจริงจากฐานข้อมูล
            setProfile((prev) => ({
              ...prev,
              name: profileData.username || prev.name,
              email: user.email,
              group: profileData.user_groups?.[0] || prev.group,
              healthGoal: profileData.usage_goals?.[0] || prev.healthGoal,
              allergies: profileData.dietary_restrictions || prev.allergies,
            }));
          }
        }

        // 3. ดึงโพสต์ทั้งหมด
        const list = await fetchPosts(user?.id);

        if (!cancelled) {
          setPosts(list);
        }
      } catch (error) {
        console.log("โหลดข้อมูลไม่สำเร็จ:", error.message);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);
  // ---------- โพสต์ ----------
  const addPost = async (postData) => {
    try {
      // 1. เช็กว่าตอนนี้ใครล็อกอินอยู่ (จะได้เอา ID ไปผูกกับโพสต์)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("กรุณาล็อกอินก่อนทำการโพสต์");
        return;
      }

      alert("กำลังอัปโหลดโพสต์ กรุณารอสักครู่...");

      // 2. ส่งข้อมูลไปให้ฟังก์ชันที่เราเขียนไว้ใน api.js จัดการ
      await createPostInDB(postData, user.id);

      // 3. เมื่อเสร็จแล้ว ให้ดึงโพสต์ทั้งหมดจากฐานข้อมูลใหม่ เพื่อให้หน้า Home โชว์โพสต์ใหม่ทันที
      const list = await fetchPosts(user.id);
      setPosts(list);

      alert("โพสต์สำเร็จ!");
    } catch (error) {
      console.log("สร้างโพสต์ไม่สำเร็จ:", error.message);
      alert("เกิดข้อผิดพลาดในการโพสต์ โปรดลองอีกครั้ง");
    }
  };
  const deletePost = (id) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  // ---------- ติดตาม Creator ----------
  const [following, setFollowing] = useState({}); // { ชื่อ creator: true }
  const toggleFollow = (name) =>
    setFollowing((prev) => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = true;
      return next;
    });
  const openCreator = (name) => {
    // ถ้าอยู่หน้าของ creator คนนี้อยู่แล้ว ไม่ต้องเปิดซ้ำ
    if (top && top.name === "creator" && top.params.name === name) return;
    push("creator", { name });
  };
  const openPost = (id) => push("postDetail", { postId: id });

  const toggleLike = (id) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
          : p,
      ),
    );

  const addComment = (id, text) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: Date.now(), user: profile.name, mine: true, text },
              ],
            }
          : p,
      ),
    );

  // ชื่อ/รูปของเราอัปเดตตามโปรไฟล์ทุกที่ (โพสต์และคอมเมนต์ของเรา)
  const viewPosts = useMemo(
    () =>
      posts.map((p) => {
        const comments = p.comments.map((c) =>
          c.mine ? { ...c, user: profile.name } : c,
        );
        return p.mine
          ? { ...p, author: profile.name, emoji: profile.avatar, comments }
          : { ...p, comments };
      }),
    [posts, profile],
  );
  const myPosts = viewPosts.filter((p) => p.mine);

  // ---------- Favorite ----------
  // favs = { รหัสโพสต์: [รหัสกลุ่ม, ...] } ถ้ามีรหัสโพสต์ แปลว่าบันทึกอยู่
  const [collections, setCollections] = useState([
    { id: "c1", name: "อยากลองทำ" },
    { id: "c2", name: "โปรตีนสูง" },
  ]);
  const [favs, setFavs] = useState({});

  const toggleFav = (postId) =>
    setFavs((prev) => {
      const next = { ...prev };
      if (next[postId] !== undefined) delete next[postId];
      else next[postId] = [];
      return next;
    });

  const toggleInCollection = (postId, cid) =>
    setFavs((prev) => {
      const cur = prev[postId] || [];
      return {
        ...prev,
        [postId]: cur.includes(cid)
          ? cur.filter((x) => x !== cid)
          : [...cur, cid],
      };
    });

  const createCollection = (name) =>
    setCollections((prev) => [...prev, { id: "c" + Date.now(), name }]);

  const favApi = {
    favs,
    collections,
    toggleFav,
    toggleInCollection,
    createCollection,
  };

  // ---------- ประวัติการสแกน ----------
  const addScan = (scan) =>
    setScanHistory((prev) => [
      {
        id: Date.now(),
        at: Date.now(),
        prompt: "",
        ingredients: [],
        menus: [],
        ...scan,
      },
      ...prev,
    ]);
  const deleteScan = (id) =>
    setScanHistory((prev) => prev.filter((s) => s.id !== id));

  // ---------- แจ้งเตือน ----------
  const unreadCount = notifications.filter((n) => !n.read).length;
  const readAll = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const openNotification = (n) => {
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
    if (n.postId) push("postDetail", { postId: n.postId });
  };

  // ---------- โปรไฟล์ ----------
  const saveProfile = (patch) => setProfile((prev) => ({ ...prev, ...patch }));

  // ---------- หน้าที่เปิดทับแท็บ ----------
  const renderOverlay = () => {
    if (!top) return null;
    switch (top.name) {
      case "notifications":
        return (
          <NotificationsScreen
            notifications={notifications}
            onOpen={openNotification}
            onReadAll={readAll}
            onBack={pop}
          />
        );
      case "scan":
        return (
          <ScanScreen
            posts={viewPosts}
            initialPrompt={top.params.prompt}
            onSaveScan={addScan}
            onOpenPost={(id) => push("postDetail", { postId: id })}
            onBack={pop}
          />
        );
      case "postDetail":
        return (
          <PostDetailScreen
            post={viewPosts.find((p) => p.id === top.params.postId)}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            favApi={favApi}
            onOpenCreator={openCreator}
            onBack={pop}
          />
        );
      case "creator":
        return (
          <CreatorScreen
            creator={findCreator(top.params.name)}
            posts={viewPosts.filter(
              (p) => p.author === top.params.name && !p.mine,
            )}
            isFollowing={!!following[top.params.name]}
            onToggleFollow={toggleFollow}
            favApi={favApi}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onBack={pop}
          />
        );
      case "favorites":
      case "liked":
        return (
          <FavoritesScreen
            key={top.name}
            initialTab={top.name === "liked" ? "liked" : "fav"}
            posts={viewPosts}
            favApi={favApi}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onOpenCreator={openCreator}
            onBack={pop}
          />
        );
      case "history":
        return (
          <ScanHistoryScreen
            history={scanHistory}
            onDelete={deleteScan}
            onBack={pop}
          />
        );
      case "myPosts":
        return (
          <MyPostsScreen
            posts={myPosts}
            favApi={favApi}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onDelete={deletePost}
            onCreate={() => changeTab("post")}
            onBack={pop}
          />
        );
      case "goal":
        return (
          <GoalScreen
            profile={profile}
            eaten={EATEN_TODAY}
            onSave={saveProfile}
            onBack={pop}
          />
        );
      case "editProfile":
        return (
          <EditProfileScreen
            profile={profile}
            onSave={saveProfile}
            onBack={pop}
          />
        );
      case "help":
        return <HelpScreen onBack={pop} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        {tab === "home" && (
          <HomeScreen
            posts={viewPosts}
            profile={profile}
            calorieGoal={profile.calorieGoal}
            eaten={EATEN_TODAY}
            unreadCount={unreadCount}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            favApi={favApi}
            onOpenScan={(prompt) => push("scan", { prompt })}
            onOpenNotifications={() => push("notifications")}
            onOpenPost={openPost}
            onOpenCreator={openCreator}
            following={following}
            onToggleFollow={toggleFollow}
          />
        )}
        {tab === "search" && (
          <SearchScreen
            posts={viewPosts}
            following={following}
            onToggleFollow={toggleFollow}
            onToggleLike={toggleLike}
            onOpenPost={openPost}
            onOpenCreator={openCreator}
          />
        )}
        {tab === "post" && (
          <PostScreen
            onAddPost={addPost}
            onOpenMyPosts={() => push("myPosts")}
          />
        )}
        {tab === "profile" && (
          <Profile
            profile={profile}
            postCount={myPosts.length}
            onLogout={onLogout}
            onEditProfile={() => push("editProfile")}
            onOpenMyPosts={() => push("myPosts")}
            onOpenFavorites={() => push("favorites")}
            onOpenLiked={() => push("liked")}
            onOpenHistory={() => push("history")}
            onOpenGoal={() => push("goal")}
            onOpenHelp={() => push("help")}
          />
        )}

        {top && (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}
          >
            {renderOverlay()}
          </View>
        )}
      </View>
      <BottomTabs active={tab} onChange={changeTab} />
    </View>
  );
}
