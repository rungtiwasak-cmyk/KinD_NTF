import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  addMealInDB,
  clearSearchHistory,
  createCollectionInDB,
  createPostInDB,
  deleteMealInDB,
  deletePostInDB,
  deleteScanInDB,
  deleteSearchKeyword,
  fetchCollections,
  fetchCreators,
  fetchFavorites,
  fetchFollows,
  fetchMealsToday,
  fetchScanHistory,
  fetchSearchHistory,
  fetchMyProfile,
  fetchNotifications,
  fetchPosts,
  followUser,
  likePost,
  mapProfileRow,
  markAllNotificationsRead,
  markNotificationRead,
  removeFavorite,
  saveFavorite,
  saveMyProfile,
  saveScanInDB,
  saveSearchKeyword,
  signOutUser,
  unfollowUser,
  unlikePost,
  uploadAvatar,
} from "../lib/api";
import { findRestrictionHits } from "../data/profileOptions";
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
import OnboardingScreen from "./OnboardingScreen";
import ScanScreen from "./ScanScreen";
import { combineStatus } from "../components/StateView";

// ค่าเริ่มต้นก่อนโหลดโปรไฟล์จริงจาก Supabase (ไม่ใช้ข้อมูลตัวอย่างปลอมอีกต่อไป)
const INITIAL_PROFILE = {
  name: "",
  email: "",
  avatar: "👩",
  avatarUrl: null, // รูปโปรไฟล์ที่ผู้ใช้อัปโหลดเอง (ถ้าไม่มีใช้อีโมจิ)
  bio: "",
  group: null,
  calorieGoal: 2000,
  healthGoal: null,
  allergies: [],
};

export default function MainScreen({ onLogout }) {
  const [tab, setTab] = useState("home");
  // stack ของหน้าที่เปิดทับแท็บ เช่น แจ้งเตือน สแกน รายละเอียดโพสต์
  const [stack, setStack] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [notifications, setNotifications] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  // สถานะการโหลดของข้อมูลแต่ละส่วน: 'loading' | 'error' | 'success' (ว่างดูจากจำนวนรายการในแต่ละหน้า)
  const [status, setStatus] = useState({
    posts: "loading",
    creators: "loading",
    favs: "loading",
    notifications: "loading",
    scans: "loading",
    searches: "loading",
    meals: "loading",
  });
  const [loadError, setLoadError] = useState({}); // ข้อความ error ของแต่ละส่วน
  const [reloadKey, setReloadKey] = useState(0); // เพิ่มค่าเพื่อโหลดทั้งหมดใหม่ (ปุ่มลองใหม่)
  const markStatus = (key, value, message = "") => {
    setStatus((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
    setLoadError((prev) => ({ ...prev, [key]: message }));
  };
  const retryLoad = () => setReloadKey((k) => k + 1);
  const [searchHistory, setSearchHistory] = useState([]); // คำที่เคยค้นหา (search_history)
  const [meals, setMeals] = useState([]); // มื้อที่กินวันนี้ (meal_logs)
  const [userId, setUserId] = useState(null); // id ผู้ใช้ที่ล็อกอิน
  const [profileLoaded, setProfileLoaded] = useState(false); // โหลดโปรไฟล์จาก DB เสร็จแล้วหรือยัง
  const [needsOnboarding, setNeedsOnboarding] = useState(false); // ยังไม่เคยตั้งค่าโปรไฟล์ครั้งแรก
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
      const [cr, fo, fa, co, sh, ml, sr] = await Promise.allSettled([
        fetchCreators(),
        fetchFollows(),
        fetchFavorites(uid),
        fetchCollections(uid),
        fetchScanHistory(uid),
        fetchMealsToday(uid),
        fetchSearchHistory(uid),
      ]);
      if (cancelled) return;
      const track = (key, r, onOk, label) => {
        if (r.status === "fulfilled") {
          onOk(r.value);
          markStatus(key, "success");
        } else {
          console.log(`โหลด${label}ไม่สำเร็จ:`, r.reason?.message);
          markStatus(key, "error", r.reason?.message || "");
        }
      };
      track("searches", sr, setSearchHistory, "ประวัติค้นหา");
      track("meals", ml, setMeals, "มื้ออาหาร");
      track("scans", sh, setScanHistory, "ประวัติสแกน");
      track("creators", cr, setCreators, "รายชื่อ creator");
      if (fo.status === "fulfilled") setFollows(fo.value);
      else console.log("โหลดการติดตามไม่สำเร็จ:", fo.reason?.message);
      track("favs", fa, setFavs, "Favorite");
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
      // ลองใหม่: ตั้งทุกส่วนกลับเป็น "กำลังโหลด" ก่อน
      setStatus((prev) =>
        Object.fromEntries(Object.keys(prev).map((k) => [k, "loading"])),
      );
      try {
        // 1. ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ปัจจุบันจาก Auth
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          loadExtras(user.id); // ติดตาม / Favorite / รายชื่อ creator (ไม่รอ ไม่ให้ขวางการโหลดโพสต์)

          // 2. ดึงข้อมูลโปรไฟล์จริงจากตาราง users โดยใช้ user_id
          try {
            const row = await fetchMyProfile(user.id);
            if (!cancelled) {
              setProfile(mapProfileRow(row, user));
              // ยังไม่เคยเลือกกลุ่มผู้ใช้ = ยังไม่เคยตั้งค่าโปรไฟล์ -> ไปหน้าตั้งค่าครั้งแรก
              setNeedsOnboarding(
                !(Array.isArray(row?.user_groups) && row.user_groups.length > 0),
              );
            }
          } catch (profileError) {
            // โหลดไม่สำเร็จ (เช่นเน็ตหลุด) ไม่บังคับ onboarding เพื่อไม่ให้ทับข้อมูลเดิม
            console.log("โหลดโปรไฟล์ไม่สำเร็จ:", profileError?.message);
            if (!cancelled) setProfile(mapProfileRow(null, user));
          }
        }

        // ไม่มีผู้ใช้ล็อกอิน = ไม่มีข้อมูลส่วนตัวให้โหลด ถือว่าเสร็จ (ว่าง)
        if (!user && !cancelled) {
          ["creators", "favs", "notifications", "scans", "searches", "meals"].forEach(
            (k) => markStatus(k, "success"),
          );
        }

        // 3. ดึงโพสต์ทั้งหมด
        const list = await fetchPosts(user?.id);

        if (!cancelled) {
          setPosts(list);
          markStatus("posts", "success");
        }
      } catch (error) {
        console.log("โหลดข้อมูลไม่สำเร็จ:", error.message);
        if (!cancelled) markStatus("posts", "error", error.message);
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);
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
          ? {
              ...p,
              liked,
              likes: p.likes + (liked ? 1 : -1),
              likesToday: Math.max(0, (p.likesToday || 0) + (liked ? 1 : -1)),
            }
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
      }).map((p) => ({
        ...p,
        // ส่วนผสมที่ตรงกับอาหารที่ผู้ใช้แพ้/ไม่กิน (ใช้แสดงคำเตือนบนโพสต์)
        restrictionHits: findRestrictionHits(p, profile.allergies),
      })),
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
  const addScan = async (scan) => {
    const local = {
      id: `tmp-${Date.now()}`,
      at: Date.now(),
      prompt: "",
      ingredients: [],
      menus: [],
      saved: false,
      ...scan,
    };
    setScanHistory((prev) => [local, ...prev]); // แสดงทันที แล้วค่อยบันทึกลง DB
    if (!userId) return;
    try {
      const row = await saveScanInDB(userId, local);
      setScanHistory((prev) => prev.map((s) => (s.id === local.id ? row : s)));
    } catch (e) {
      console.log("บันทึกประวัติสแกนไม่สำเร็จ:", e?.message);
    }
  };
  const deleteScan = async (id) => {
    const removed = scanHistory.find((s) => s.id === id);
    setScanHistory((prev) => prev.filter((s) => s.id !== id));
    if (!userId || !removed?.saved) return;
    try {
      await deleteScanInDB(id, userId);
    } catch (e) {
      console.log("ลบประวัติสแกนไม่สำเร็จ:", e?.message);
      setScanHistory((prev) =>
        [...prev, removed].sort((a, b) => b.at - a.at),
      );
    }
  };

  // ---------- ประวัติการค้นหา ----------
  const addSearch = async (keyword) => {
    const kw = String(keyword || "").trim();
    if (!kw || !userId) return;
    // แสดงทันที (คำซ้ำย้ายขึ้นบนสุด) แล้วค่อยบันทึกลง DB
    const tmpId = `tmp-${Date.now()}`;
    setSearchHistory((prev) =>
      [{ id: tmpId, keyword: kw }, ...prev.filter((s) => s.keyword.toLowerCase() !== kw.toLowerCase())].slice(0, 10),
    );
    try {
      const row = await saveSearchKeyword(userId, kw);
      if (row) setSearchHistory((prev) => prev.map((s) => (s.id === tmpId ? row : s)));
    } catch (e) {
      console.log("บันทึกประวัติค้นหาไม่สำเร็จ:", e?.message);
    }
  };
  const removeSearch = async (id) => {
    const removed = searchHistory.find((s) => s.id === id);
    setSearchHistory((prev) => prev.filter((s) => s.id !== id));
    if (!userId || String(id).startsWith("tmp-")) return;
    try {
      await deleteSearchKeyword(id, userId);
    } catch (e) {
      console.log("ลบประวัติค้นหาไม่สำเร็จ:", e?.message);
      if (removed) setSearchHistory((prev) => [removed, ...prev]);
    }
  };
  const clearSearches = async () => {
    const old = searchHistory;
    setSearchHistory([]);
    if (!userId) return;
    try {
      await clearSearchHistory(userId);
    } catch (e) {
      console.log("ล้างประวัติค้นหาไม่สำเร็จ:", e?.message);
      setSearchHistory(old);
    }
  };

  // ---------- แคลอรี่ที่กินวันนี้ ----------
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const todayMeals = meals.filter((m) => m.at >= startOfToday);
  const eatenToday = todayMeals.reduce((sum, m) => sum + m.kcal, 0);

  const logMeal = async ({ postId = null, title, kcal }) => {
    const uid = await requireUserId();
    const row = await addMealInDB(uid, { postId, title, kcal });
    setMeals((prev) => [row, ...prev]);
  };
  const removeMeal = async (id) => {
    const removed = meals.find((m) => m.id === id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMealInDB(id, userId);
    } catch (e) {
      console.log("ลบมื้ออาหารไม่สำเร็จ:", e?.message);
      if (removed) setMeals((prev) => [removed, ...prev]);
    }
  };

  // ---------- แจ้งเตือน ----------
  const retryNotifications = () => {
    if (!userId) return;
    markStatus("notifications", "loading");
    fetchNotifications(userId)
      .then((data) => {
        setNotifications(data);
        markStatus("notifications", "success");
      })
      .catch((e) => markStatus("notifications", "error", e?.message || ""));
  };
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
    const load = () =>
      fetchNotifications(userId)
        .then((data) => {
          if (!isMounted) return;
          setNotifications(data);
          markStatus("notifications", "success");
        })
        .catch((e) => {
          console.log("โหลดแจ้งเตือนไม่สำเร็จ:", e?.message);
          // ถ้าเคยโหลดสำเร็จแล้ว (รอบ 30 วินาที) ไม่ต้องเด้งหน้า error ทับข้อมูลเดิม
          if (isMounted)
            setStatus((prev) =>
              prev.notifications === "success" ? prev : { ...prev, notifications: "error" },
            );
        });
    load();
    const timer = setInterval(load, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [userId]);

  const activeTopName = top ? top.name : null;
  useEffect(() => {
    if (activeTopName === "notifications" && userId) {
      fetchNotifications(userId)
        .then((data) => {
          setNotifications(data);
          markStatus("notifications", "success");
        })
        .catch((e) => {
          console.log("โหลดแจ้งเตือนไม่สำเร็จ:", e?.message);
          markStatus("notifications", "error", e?.message || "");
        });
    }
  }, [activeTopName, userId]);

  // ---------- โปรไฟล์ (บันทึกลง Supabase ตาราง users) ----------
  const saveProfile = (patch) => setProfile((prev) => ({ ...prev, ...patch }));

  const requireUserId = async () => {
    if (userId) return userId;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("กรุณาล็อกอินก่อน");
    return user.id;
  };

  // บันทึกหน้าแก้ไขโปรไฟล์ (รวมอัปโหลดรูปโปรไฟล์ที่เลือกจากเครื่อง)
  // avatarPick = { uri, mimeType, base64 } ถ้าเลือกรูปใหม่ / "clear" ถ้ากลับไปใช้อีโมจิ / null ถ้าไม่เปลี่ยน
  const saveEditedProfile = async ({ avatarPick, ...patch }) => {
    const uid = await requireUserId();
    if (avatarPick) {
      if (avatarPick === "clear") {
        await clearAvatar(uid);
        patch.avatarUrl = null;
      } else {
        patch.avatarUrl = await uploadAvatar({ ...avatarPick, type: "image" }, uid);
      }
    }
    await saveMyProfile(uid, {
      name: patch.name,
      bio: patch.bio,
      group: patch.group,
      allergies: patch.allergies,
      avatar: patch.avatar,
    });
    saveProfile(patch);
  };

  // บันทึกเป้าหมายแคลอรี่ / เป้าหมายสุขภาพ
  const saveGoal = async (patch) => {
    const uid = await requireUserId();
    await saveMyProfile(uid, {
      calorieGoal: patch.calorieGoal,
      healthGoal: patch.healthGoal ?? null,
    });
    saveProfile(patch);
  };

  // จบหน้าตั้งค่าโปรไฟล์ครั้งแรก
  const finishOnboarding = async (patch) => {
    const uid = await requireUserId();
    await saveMyProfile(uid, {
      ...(profile.name ? { name: profile.name } : {}),
      ...patch,
    });
    saveProfile(patch);
    setNeedsOnboarding(false);
  };

  // ออกจากระบบจริง (ล้าง session ใน Supabase) แล้วกลับไปหน้า Login
  const handleLogout = async () => {
    await signOutUser();
    if (onLogout) onLogout();
  };

  // ---------- หน้าที่เปิดทับแท็บ ----------
  const renderOverlay = () => {
    if (!top) return null;
    switch (top.name) {
      case "notifications":
        return (
          <NotificationsScreen
            notifications={notifications}
            status={status.notifications}
            error={loadError.notifications}
            onRetry={retryNotifications}
            onOpen={openNotification}
            onReadAll={readAll}
            onBack={pop}
          />
        );
      case "scan":
        return (
          <ScanScreen
            posts={viewPosts}
            restrictions={profile.allergies}
            userGroup={profile.group}
            healthGoal={profile.healthGoal}
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
            onLogMeal={logMeal}
            status={status.posts}
            error={loadError.posts}
            onRetry={retryLoad}
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
          ? { ...base, followers: followerCount(cid), emoji: base.emoji || "🧑‍🍳" }
          : null;
        return (
          <CreatorScreen
            creator={creator}
            posts={viewPosts.filter((p) => p.creatorId === cid && !p.mine)}
            status={status.posts}
            error={loadError.posts}
            onRetry={retryLoad}
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
            status={combineStatus(status.posts, status.favs)}
            error={loadError.posts || loadError.favs}
            onRetry={retryLoad}
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
            status={status.scans}
            error={loadError.scans}
            onRetry={retryLoad}
            onDelete={deleteScan}
            onBack={pop}
          />
        );
      case "myPosts":
        return (
          <MyPostsScreen
            posts={myPosts}
            status={status.posts}
            error={loadError.posts}
            onRetry={retryLoad}
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
            eaten={eatenToday}
            meals={todayMeals}
            mealsStatus={status.meals}
            onRetryMeals={retryLoad}
            onAddMeal={logMeal}
            onRemoveMeal={removeMeal}
            onSave={saveGoal}
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

  // รอโหลดโปรไฟล์จริงก่อน จะได้ไม่เห็นข้อมูลปลอมวาบขึ้นมา
  if (!profileLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ล็อกอินครั้งแรก (เช่น Google) ให้ตั้งค่าโปรไฟล์ก่อนเข้าหน้าแรก
  if (needsOnboarding) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior="padding"
      >
        <OnboardingScreen name={profile.name} onDone={finishOnboarding} />
      </KeyboardAvoidingView>
    );
  }

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
            eaten={eatenToday}
            favs={favs}
            lastScan={scanHistory[0] || null}
            postsStatus={status.posts}
            postsError={loadError.posts}
            onRetry={retryLoad}
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
            postsStatus={status.posts}
            creatorsStatus={status.creators}
            onRetry={retryLoad}
            searchHistory={searchHistory}
            onSaveSearch={addSearch}
            onRemoveSearch={removeSearch}
            onClearSearches={clearSearches}
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
            onLogout={handleLogout}
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
