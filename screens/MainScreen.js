import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import BottomTabs from "../components/BottomTabs";
import {
  addCommentInDB,
  clearAvatar,
  createCollectionInDB,
  createPostInDB,
  deletePostInDB,
  fetchCollections,
  fetchCreators,
  fetchFavorites,
  fetchFollows,
  fetchNotifications,
  fetchPosts,
  followUser,
  likePost,
  markAllNotificationsRead,
  markNotificationRead,
  removeFavorite,
  saveFavorite,
  unfollowUser,
  unlikePost,
  uploadAvatar,
} from "../lib/api";
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
  avatarUrl: null, // รูปโปรไฟล์ที่ผู้ใช้อัปโหลดเอง (ถ้าไม่มีใช้อีโมจิ)
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

export default function MainScreen({ onLogout }) {
  const [tab, setTab] = useState("home");
  // stack ของหน้าที่เปิดทับแท็บ เช่น แจ้งเตือน สแกน รายละเอียดโพสต์
  const [stack, setStack] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [notifications, setNotifications] = useState([]);
  const [scanHistory, setScanHistory] = useState(SAMPLE_SCANS);
  const [userId, setUserId] = useState(null); // id ผู้ใช้ที่ล็อกอิน
  const [creators, setCreators] = useState([]); // ผู้ใช้ทั้งหมดจาก Supabase
  const [follows, setFollows] = useState([]); // [{ follower_id, following_id }]
  const [collections, setCollections] = useState([]); // กลุ่ม Favorite
  const [favs, setFavs] = useState({}); // { รหัสโพสต์: [รหัสกลุ่ม, ...] }

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

    // โหลดข้อมูลเสริมจาก Supabase (แต่ละอย่างพังแยกกัน ไม่ทำให้แอปทั้งหมดพัง)
    const loadExtras = async (uid) => {
      const [cr, fo, fa, co] = await Promise.allSettled([
        fetchCreators(),
        fetchFollows(),
        fetchFavorites(uid),
        fetchCollections(uid),
      ]);
      if (cancelled) return;
      if (cr.status === "fulfilled") setCreators(cr.value);
      else console.log("โหลดรายชื่อ creator ไม่สำเร็จ:", cr.reason?.message);
      if (fo.status === "fulfilled") setFollows(fo.value);
      else console.log("โหลดการติดตามไม่สำเร็จ:", fo.reason?.message);
      if (fa.status === "fulfilled") setFavs(fa.value);
      else console.log("โหลด Favorite ไม่สำเร็จ:", fa.reason?.message);
      if (co.status === "fulfilled") {
        if (co.value.length > 0) setCollections(co.value);
        else {
          // ผู้ใช้ใหม่: สร้างกลุ่มเริ่มต้นให้ 2 กลุ่ม
          try {
            const defaults = [];
            for (const n of ["อยากลองทำ", "โปรตีนสูง"]) {
              defaults.push(await createCollectionInDB(uid, n));
            }
            if (!cancelled) setCollections(defaults);
          } catch (e) {
            console.log("สร้างกลุ่มเริ่มต้นไม่สำเร็จ:", e?.message);
          }
        }
      } else console.log("โหลดกลุ่ม Favorite ไม่สำเร็จ:", co.reason?.message);
    };

    const loadData = async () => {
      try {
        // 1. ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ปัจจุบันจาก Auth
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          loadExtras(user.id); // ติดตาม / Favorite / รายชื่อ creator (ไม่รอ ไม่ให้ขวางการโหลดโพสต์)

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
              avatarUrl: profileData.avatar_url || null,
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
      console.log("สร้างโพสต์ไม่สำเร็จ:", error);
      alert(
        "เกิดข้อผิดพลาดในการโพสต์: " +
          (error?.message || "โปรดลองอีกครั้ง"),
      );
    }
  };
  // ลบโพสต์จริงใน Supabase ก่อน สำเร็จแล้วค่อยเอาออกจากหน้าจอ
  const deletePost = async (id) => {
    const target = posts.find((p) => p.id === id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาล็อกอินก่อน");
      await deletePostInDB(id, user.id, target?.media?.uri);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.log("ลบโพสต์ไม่สำเร็จ:", error);
      alert("ลบโพสต์ไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };

  // ---------- ติดตาม Creator (บันทึกลง Supabase ตาราง follows) ----------
  const following = useMemo(() => {
    const m = {};
    follows.forEach((f) => {
      if (f.follower_id === userId) m[f.following_id] = true;
    });
    return m;
  }, [follows, userId]);
  const followerCount = (id) =>
    follows.filter((f) => f.following_id === id).length;

  const toggleFollow = async (targetId) => {
    if (!userId || !targetId || targetId === userId) return;
    const was = !!following[targetId];
    const row = { follower_id: userId, following_id: targetId };
    const apply = (on) =>
      setFollows((prev) =>
        on
          ? [...prev, row]
          : prev.filter(
              (f) =>
                !(f.follower_id === userId && f.following_id === targetId),
            ),
      );
    apply(!was); // อัปเดตหน้าจอทันที
    try {
      if (was) await unfollowUser(userId, targetId);
      else await followUser(userId, targetId);
    } catch (error) {
      console.log("ติดตามไม่สำเร็จ:", error);
      apply(was); // ย้อนกลับ
      alert("ติดตามไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };
  const openCreator = (id) => {
    if (!id) return;
    // ถ้าอยู่หน้าของ creator คนนี้อยู่แล้ว ไม่ต้องเปิดซ้ำ
    if (top && top.name === "creator" && top.params.id === id) return;
    push("creator", { id });
  };
  const openPost = (id) => push("postDetail", { postId: id });

  // ---------- ไลก์ (บันทึกลง Supabase ตาราง likes) ----------
  const setLiked = (id, liked) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id && p.liked !== liked
          ? { ...p, liked, likes: p.likes + (liked ? 1 : -1) }
          : p,
      ),
    );
  const toggleLike = async (id) => {
    const target = posts.find((p) => p.id === id);
    if (!target || !userId) return;
    const willLike = !target.liked;
    setLiked(id, willLike);
    try {
      if (willLike) await likePost(id, userId);
      else await unlikePost(id, userId);
    } catch (error) {
      console.log("ไลก์ไม่สำเร็จ:", error);
      setLiked(id, !willLike);
      alert("กดไลก์ไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };

  // ---------- คอมเมนต์ (บันทึกลง Supabase ตาราง comments) ----------
  const addComment = async (id, text) => {
    if (!userId) return;
    const tempId = "tmp-" + Date.now();
    const patchComments = (fn) =>
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, comments: fn(p.comments) } : p)),
      );
    // แสดงทันที แล้วค่อยบันทึก
    patchComments((cs) => [
      ...cs,
      { id: tempId, user: profile.name, mine: true, text },
    ]);
    try {
      const realId = await addCommentInDB(id, userId, text);
      patchComments((cs) =>
        cs.map((c) => (c.id === tempId ? { ...c, id: realId } : c)),
      );
    } catch (error) {
      console.log("ส่งคอมเมนต์ไม่สำเร็จ:", error);
      patchComments((cs) => cs.filter((c) => c.id !== tempId));
      alert("ส่งคอมเมนต์ไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };

  // ชื่อ/รูปของเราอัปเดตตามโปรไฟล์ทุกที่ (โพสต์และคอมเมนต์ของเรา)
  const viewPosts = useMemo(
    () =>
      posts.map((p) => {
        const comments = p.comments.map((c) =>
          c.mine ? { ...c, user: profile.name } : c,
        );
        return p.mine
          ? {
              ...p,
              author: profile.name,
              emoji: profile.avatar,
              avatarUrl: profile.avatarUrl,
              comments,
            }
          : { ...p, comments };
      }),
    [posts, profile],
  );
  const myPosts = viewPosts.filter((p) => p.mine);

  // รายชื่อ creator สำหรับหน้าค้นหา (ไม่รวมตัวเอง) พร้อมจำนวนผู้ติดตาม/โพสต์
  const creatorList = creators
    .filter((c) => c.id !== userId)
    .map((c) => ({
      ...c,
      followers: followerCount(c.id),
      postCount: posts.filter((p) => p.creatorId === c.id).length,
    }))
    .sort((a, b) => b.followers - a.followers || b.postCount - a.postCount);

  // ---------- Favorite (บันทึกลง Supabase ตาราง favorites / collections) ----------
  // favs = { รหัสโพสต์: [รหัสกลุ่ม, ...] } ถ้ามีรหัสโพสต์ แปลว่าบันทึกอยู่
  const toggleFav = async (postId) => {
    if (!userId) return;
    const was = favs[postId] !== undefined;
    const old = favs[postId];
    setFavs((prev) => {
      const next = { ...prev };
      if (was) delete next[postId];
      else next[postId] = [];
      return next;
    });
    try {
      if (was) await removeFavorite(userId, postId);
      else await saveFavorite(userId, postId, []);
    } catch (error) {
      console.log("บันทึก Favorite ไม่สำเร็จ:", error);
      setFavs((prev) => {
        const next = { ...prev };
        if (was) next[postId] = old;
        else delete next[postId];
        return next;
      });
      alert("บันทึก Favorite ไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };

  const toggleInCollection = async (postId, cid) => {
    if (!userId) return;
    const cur = favs[postId] || [];
    const next = cur.includes(cid) ? cur.filter((x) => x !== cid) : [...cur, cid];
    setFavs((prev) => ({ ...prev, [postId]: next }));
    try {
      await saveFavorite(userId, postId, next);
    } catch (error) {
      console.log("จัดกลุ่ม Favorite ไม่สำเร็จ:", error);
      setFavs((prev) => ({ ...prev, [postId]: cur }));
      alert("จัดกลุ่มไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };

  const createCollection = async (name) => {
    if (!userId) return;
    try {
      const c = await createCollectionInDB(userId, name);
      setCollections((prev) => [...prev, c]);
    } catch (error) {
      console.log("สร้างกลุ่มไม่สำเร็จ:", error);
      alert("สร้างกลุ่มไม่สำเร็จ: " + (error?.message || "โปรดลองอีกครั้ง"));
    }
  };

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
  const readAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (userId)
      markAllNotificationsRead(userId).catch((e) =>
        console.log("อ่านทั้งหมดไม่สำเร็จ:", e?.message),
      );
  };
  const openNotification = (n) => {
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
    if (!n.read)
      markNotificationRead(n.id).catch((e) =>
        console.log("อ่านแจ้งเตือนไม่สำเร็จ:", e?.message),
      );
    if (n.postId) push("postDetail", { postId: n.postId });
  };

  // โหลดแจ้งเตือนจริงจาก Supabase: ตอนเข้าแอป, ทุก 30 วินาที และตอนเปิดหน้าแจ้งเตือน
  useEffect(() => {
    if (!userId) return undefined;
    let isMounted = true;
    fetchNotifications(userId)
      .then((data) => {
        if (isMounted) setNotifications(data);
      })
      .catch((e) => console.log("โหลดแจ้งเตือนไม่สำเร็จ:", e?.message));

    const timer = setInterval(() => {
      fetchNotifications(userId)
        .then((data) => {
          if (isMounted) setNotifications(data);
        })
        .catch((e) => console.log("โหลดแจ้งเตือนไม่สำเร็จ:", e?.message));
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [userId]);

  const activeTopName = top ? top.name : null;
  useEffect(() => {
    if (activeTopName === "notifications" && userId) {
      fetchNotifications(userId)
        .then(setNotifications)
        .catch((e) => console.log("โหลดแจ้งเตือนไม่สำเร็จ:", e?.message));
    }
  }, [activeTopName, userId]);

  // ---------- โปรไฟล์ ----------
  const saveProfile = (patch) => setProfile((prev) => ({ ...prev, ...patch }));

  // บันทึกหน้าแก้ไขโปรไฟล์ (รวมอัปโหลดรูปโปรไฟล์ที่เลือกจากเครื่อง)
  // avatarPick = { uri, mimeType, base64 } ถ้าเลือกรูปใหม่ / "clear" ถ้ากลับไปใช้อีโมจิ / null ถ้าไม่เปลี่ยน
  const saveEditedProfile = async ({ avatarPick, ...patch }) => {
    if (avatarPick) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาล็อกอินก่อน");
      if (avatarPick === "clear") {
        await clearAvatar(user.id);
        patch.avatarUrl = null;
      } else {
        patch.avatarUrl = await uploadAvatar(
          { ...avatarPick, type: "image" },
          user.id,
        );
      }
    }
    saveProfile(patch);
  };

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
      case "creator": {
        const cid = top.params.id;
        const fromList = creators.find((c) => c.id === cid);
        const fromPost = viewPosts.find((p) => p.creatorId === cid);
        const base =
          fromList ||
          (fromPost
            ? { id: cid, name: fromPost.author, avatarUrl: fromPost.avatarUrl }
            : null);
        const creator = base
          ? { ...base, followers: followerCount(cid), emoji: "🧑‍🍳" }
          : null;
        return (
          <CreatorScreen
            creator={creator}
            posts={viewPosts.filter((p) => p.creatorId === cid && !p.mine)}
            isFollowing={!!following[cid]}
            onToggleFollow={toggleFollow}
            favApi={favApi}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onBack={pop}
          />
        );
      }
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
            onSave={saveEditedProfile}
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
      {/* ดันเนื้อหาขึ้นเหนือแป้นพิมพ์ จะได้เห็นสิ่งที่กำลังพิมพ์ (ทุกหน้า) */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
            creators={creatorList}
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
      </KeyboardAvoidingView>
      <BottomTabs active={tab} onChange={changeTab} />
    </View>
  );
}
