import { decode } from "base64-arraybuffer";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const OAUTH_TIMEOUT_MS = 120000; // รอล็อกอิน Google สูงสุด 2 นาที
const BUCKET = "post-media";
const VIDEO_EXT = ["mp4", "mov", "m4v", "webm", "3gp", "avi"];

// เดาชนิดไฟล์ (image/video) จาก URL ที่เก็บใน DB
function mediaTypeFromUrl(url) {
  const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
  return VIDEO_EXT.includes(ext) ? "video" : "image";
}

// หานามสกุลไฟล์ + content-type ให้ถูกต้อง (ไม่เดาจาก uri เพราะบนเว็บเป็น blob: ไม่มีนามสกุล)
function resolveFileInfo(media) {
  const mime = media.mimeType || "";
  let ext = "";
  if (mime.includes("/")) ext = mime.split("/")[1].toLowerCase();
  else {
    const m = /\.([a-zA-Z0-9]{2,5})(?:\?|$)/.exec(media.uri);
    ext = m ? m[1].toLowerCase() : "";
  }
  if (ext === "jpeg") ext = "jpg";
  if (ext === "quicktime") ext = "mov";
  if (!ext) ext = media.type === "video" ? "mp4" : "jpg";
  const contentType =
    mime ||
    (media.type === "video"
      ? `video/${ext === "mov" ? "quicktime" : ext}`
      : `image/${ext === "jpg" ? "jpeg" : ext}`);
  return { ext, contentType };
}

// แปลงไฟล์เป็น ArrayBuffer โดยไม่ต้องพึ่ง expo-file-system
// (ใน Expo SDK 54+ readAsStringAsync ใน "expo-file-system" ตัวหลักถูกเปลี่ยนแล้ว ทำให้ error)
async function mediaToArrayBuffer(media) {
  if (media.base64) return decode(media.base64);
  const res = await fetch(media.uri);
  return await res.arrayBuffer();
}
/**
 * ฟังก์ชันแปลงข้อมูลดิบจากฐานข้อมูล ให้เป็นโครงสร้างที่หน้าจอแอป React Native ต้องการ
 */
export function mapPost(row, currentUserId) {
  const likesList = row.likes || [];

  return {
    id: row.post_id,

    // ฐานข้อมูลไม่มีคอลัมน์ title เลยขอดึงคำแรกๆ ของ caption มาใช้ หรือถ้าว่างให้ใส่ 'ไม่มีชื่อ'
    title: row.caption ? row.caption.substring(0, 30) + "..." : "ไม่มีชื่อ",
    caption: row.caption,
    category: row.category,
    region: row.region || null,

    // แปลงส่วนผสมจากตารางแยก ให้กลายเป็น Array ตามที่แอปน่าจะใช้
    ingredients: (row.recipe_ingredients || []).map((i) =>
      `${i.ingredient_name} ${i.amount || ""}`.trim(),
    ),

    // แปลงวิธีทำจากตารางแยก โดยเรียงตาม step_number ก่อน
    steps: (row.recipe_steps || [])
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => s.instruction),

    // ดึงค่าโภชนาการจากคอลัมน์ jsonb
    kcal: row.nutrition_info?.kcal || 0,
    protein: row.nutrition_info?.protein || 0,

    media: row.media_url
      ? { uri: row.media_url, type: mediaTypeFromUrl(row.media_url) }
      : null,

    // ดึงชื่อผู้ใช้จากตาราง users
    author: row.users?.username || "ไม่ระบุชื่อ",
    creatorId: row.creator_id, // ใช้เปิดหน้า Creator และติดตาม
    avatarUrl: row.users?.avatar_url || null,
    emoji: "🍽️", // ฐานข้อมูลไม่มีรูปโปรไฟล์ เลยใช้อีโมจิแทนไปก่อน

    mine: row.creator_id === currentUserId,
    likes: likesList.length,
    liked: likesList.some((l) => l.user_id === currentUserId),

    comments: (row.comments || []).map((c) => ({
      id: c.comment_id,
      mine: !!currentUserId && c.user_id === currentUserId,
      user: c.users?.username || "ไม่ระบุชื่อ",
      text: c.content,
    })),
  };
}

/**
 * ฟังก์ชันดึงโพสต์ทั้งหมด พร้อมดึงข้อมูลจากตารางที่เชื่อมกัน (Join)
 */
export async function fetchPosts(currentUserId) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      users ( username, avatar_url ),
      recipe_ingredients ( ingredient_name, amount ),
      recipe_steps ( step_number, instruction ),
      likes ( user_id ),
      comments ( comment_id, content, user_id, users ( username ) )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดโพสต์:", error.message);
    throw error;
  }

  // ส่งข้อมูลที่ผ่านการจัดรูปแบบ (mapPost) แล้วกลับไปให้หน้าจอ
  return data.map((row) => mapPost(row, currentUserId));
}

// อัปโหลดไฟล์ขึ้น Storage แล้วคืน public URL (ใช้ทั้งรูปโพสต์และรูปโปรไฟล์)
async function uploadMediaFile(media, userId, prefix = "") {
  const { ext, contentType } = resolveFileInfo(media);
  const fileName = `${userId}/${prefix}${Date.now()}.${ext}`;

  const fileData = await mediaToArrayBuffer(media);
  if (!fileData || fileData.byteLength === 0) {
    throw new Error("อ่านไฟล์รูปไม่ได้ (ไฟล์ว่าง)");
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileData, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// นำเข้าต่อท้ายไฟล์ lib/api.js

export async function createPostInDB(postData, userId) {
  try {
    let mediaUrl = null;

    // 1. จัดการรูปภาพ/วิดีโอ (ถ้ามีส่งมา)
    if (postData.media && postData.media.uri) {
      mediaUrl = await uploadMediaFile(postData.media, userId);
      console.log("อัปโหลดสำเร็จ:", mediaUrl);
    }

    // 2. บันทึกข้อมูลหลักลงตาราง posts
    const { data: newPost, error: postError } = await supabase
      .from("posts")
      .insert({
        creator_id: userId,
        caption: postData.caption,
        category: postData.category,
        region: postData.region || null,
        media_url: mediaUrl, // ใส่ลิงก์รูปที่ได้จากข้อ 1 ลงไป
        nutrition_info: { kcal: postData.kcal, protein: postData.protein },
      })
      .select() // สั่งให้อ่านข้อมูลแถวใหม่กลับมาด้วย เพื่อเอา post_id
      .single();

    if (postError) throw postError;

    // 3. บันทึกส่วนผสมลงตาราง recipe_ingredients
    if (postData.ingredients && postData.ingredients.length > 0) {
      const ingData = postData.ingredients.map((ing) => ({
        post_id: newPost.post_id, // ผูกกับโพสต์ที่เพิ่งสร้าง
        ingredient_name: ing,
        amount: "",
      }));
      const { error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingData);
      if (ingError) throw ingError;
    }

    // 4. บันทึกวิธีทำลงตาราง recipe_steps
    if (postData.steps && postData.steps.length > 0) {
      const stepData = postData.steps.map((step, index) => ({
        post_id: newPost.post_id, // ผูกกับโพสต์ที่เพิ่งสร้าง
        step_number: index + 1,
        instruction: step,
      }));
      const { error: stepError } = await supabase
        .from("recipe_steps")
        .insert(stepData);
      if (stepError) throw stepError;
    }

    return true; // สำเร็จ!
  } catch (error) {
    console.error("เกิดข้อผิดพลาดตอนอัปโหลดโพสต์:", error);
    throw error; // โยน error กลับไปให้หน้าจอแจ้งเตือน
  }
}

// ฟังก์ชันเข้าสู่ระบบ
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) throw error;
  return data;
}

// ฟังก์ชันสมัครสมาชิกใหม่
// profile = { group, healthGoal, allergies, bio } (ไม่บังคับ) บันทึกลงตาราง users ทันทีถ้ามี session
// ถ้า Supabase เปิด "ยืนยันอีเมล" จะยังไม่มี session ตอนสมัคร (คืนค่า data.session = null)
// กรณีนั้นผู้ใช้จะได้กรอกโปรไฟล์ในหน้า "ตั้งค่าโปรไฟล์ครั้งแรก" ตอนล็อกอินครั้งแรกแทน
export async function registerUser(email, password, username, profile = {}) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error) throw error;

  if (data.user && data.session) {
    await saveMyProfile(data.user.id, {
      name: username || email.split("@")[0],
      ...profile,
    });
  }
  return data;
}

// ---------- โปรไฟล์ของผู้ใช้ (ตาราง users) ----------

// แปลงแถวจากตาราง users เป็นรูปแบบ profile ที่หน้าจอใช้
// ไม่ใช้ค่าตัวอย่างปลอมอีกต่อไป: ถ้ายังไม่ได้ตั้งค่า จะเป็นค่าว่าง
export function mapProfileRow(row, authUser) {
  const asArray = (v) => (Array.isArray(v) ? v : []);
  return {
    name:
      row?.username ||
      authUser?.user_metadata?.full_name ||
      authUser?.email?.split("@")[0] ||
      "",
    email: authUser?.email || "",
    avatar: row?.avatar_emoji || "👩",
    avatarUrl: row?.avatar_url || null,
    bio: row?.bio || "",
    group: asArray(row?.user_groups)[0] || null,
    healthGoal: asArray(row?.usage_goals)[0] || null,
    allergies: asArray(row?.dietary_restrictions),
    calorieGoal: row?.calorie_goal || 2000,
  };
}

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data; // null ถ้ายังไม่มีแถว
}

// บันทึกเฉพาะช่องที่ส่งมาใน patch
// patch: { name, bio, group, healthGoal, allergies, calorieGoal, avatar (อีโมจิ) }
export async function saveMyProfile(userId, patch) {
  const row = {};
  if (patch.name !== undefined) row.username = patch.name;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.group !== undefined) row.user_groups = patch.group ? [patch.group] : [];
  if (patch.healthGoal !== undefined)
    row.usage_goals = patch.healthGoal ? [patch.healthGoal] : [];
  if (patch.allergies !== undefined) row.dietary_restrictions = patch.allergies || [];
  if (patch.calorieGoal !== undefined) row.calorie_goal = patch.calorieGoal;
  if (patch.avatar !== undefined) row.avatar_emoji = patch.avatar;
  if (Object.keys(row).length === 0) return;

  // .select() เพื่อรู้ว่ามีแถวถูกแก้จริง (ถ้า RLS ไม่อนุญาต หรือยังไม่มีแถว จะได้ 0 แถว)
  const { data, error } = await supabase
    .from("users")
    .update(row)
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw error;

  if (!data || data.length === 0) {
    // ยังไม่มีแถวของผู้ใช้คนนี้ (เช่นสมัครแล้วสร้างโปรไฟล์ไม่สำเร็จ) -> สร้างใหม่
    const { error: insertError } = await supabase
      .from("users")
      .insert({ user_id: userId, username: row.username || "ผู้ใช้งาน", ...row });
    if (insertError) throw insertError;
  }
}

// ---------- Session / ออกจากระบบ / รีเซ็ตรหัสผ่าน ----------

// เช็กว่ามีการล็อกอินค้างอยู่ไหม (ใช้ตอนเปิดแอป จะได้ไม่ต้องล็อกอินใหม่ทุกครั้ง)
export async function getCurrentSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch (err) {
    console.log("อ่าน session ไม่สำเร็จ:", err?.message);
    return null;
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) console.log("ออกจากระบบไม่สำเร็จ:", error.message);
}

// ส่งอีเมลรีเซ็ตรหัสผ่านจริงผ่าน Supabase
export async function sendPasswordReset(email) {
  const redirectTo =
    Platform.OS === "web" ? undefined : getOAuthRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

// ตรวจสอบและสร้างโปรไฟล์ในตาราง users สำหรับผู้ใช้ที่ล็อกอินผ่าน OAuth
export async function syncOAuthUser(user) {
  if (!user) return;
  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingUser) {
      const username =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "ผู้ใช้งาน";
      const avatar_url =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      const { error: insertError } = await supabase.from("users").insert({
        user_id: user.id,
        username,
        avatar_url,
      });
      // ก่อนหน้านี้ error ตรงนี้ถูกกลืนหายไปเงียบๆ (มักเกิดจาก RLS ไม่อนุญาต INSERT ตาราง users)
      if (insertError) {
        console.log(
          "สร้างโปรไฟล์ Google ในตาราง users ไม่สำเร็จ:",
          insertError.message,
        );
      }
    }
  } catch (err) {
    console.log("Sync OAuth user error:", err?.message);
  }
}

// ลิงก์ที่ให้ Supabase เด้งกลับเข้าแอปหลังล็อกอิน
// - Expo Go: ต้องเป็น exp://<IP เครื่อง>:8081/--/... (Expo Go เปิดได้เฉพาะ exp:// ไม่รู้จัก myapp://)
// - แอปที่ build เอง (dev build/ใช้งานจริง): ใช้ scheme "myapp://auth/callback"
// หมายเหตุ: ไม่ใช้ "myapp:///" (ไม่มี path) เพราะ allowlist ของ Supabase จับคู่ไม่ติด
function getOAuthRedirectUrl() {
  // กำหนดเองผ่าน .env (ชัวร์ที่สุดตอนพัฒนาด้วย Expo Go)
  if (process.env.EXPO_PUBLIC_OAUTH_REDIRECT) {
    return process.env.EXPO_PUBLIC_OAUTH_REDIRECT;
  }

  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === "expo" ||
    !!Constants.expoGoConfig;
  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  console.log("OAuth env:", {
    executionEnvironment: Constants.executionEnvironment,
    appOwnership: Constants.appOwnership,
    hostUri,
    isExpoGo,
  });
  if (isExpoGo && hostUri) {
    return `exp://${hostUri.split("/")[0]}/--/auth/callback`;
  }
  return Linking.createURL("auth/callback");
}

// ฟังก์ชันเข้าสู่ระบบด้วย Google หรือ Apple ผ่าน Supabase OAuth
export async function loginWithOAuth(provider) {
  if (Platform.OS === "web") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
    return null; // บนเว็บเบราว์เซอร์จะ redirect ไปหน้า Google เอง ยังไม่ถือว่าล็อกอินสำเร็จ
  }

  const redirectUrl = getOAuthRedirectUrl();
  console.log("OAuth Redirect URL ที่ส่งไป Supabase:", redirectUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("ไม่พบ URL สำหรับเข้าสู่ระบบ");

  // กันค้างไม่รู้จบ: ถ้า Supabase redirect กลับแอปไม่ได้ (Redirect URL ไม่อยู่ใน allowlist)
  // หน้าเบราว์เซอร์จะโหลดค้าง และ openAuthSessionAsync จะไม่ resolve สักที
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            "รอการเข้าสู่ระบบนานเกินไป — Supabase น่าจะ redirect กลับแอปไม่ได้ " +
              `ให้เพิ่ม Redirect URL นี้ใน Supabase: ${redirectUrl} (หรือ exp://** )`,
          ),
        ),
      OAUTH_TIMEOUT_MS,
    );
  });
  let res;
  try {
    res = await Promise.race([
      WebBrowser.openAuthSessionAsync(data.url, redirectUrl),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
  console.log("OAuth ผลลัพธ์จากเบราว์เซอร์:", res.type, res.url || "");

  if (res.type === "success" && res.url) {
    const url = res.url;

    // 0. ถ้า Supabase/Google ส่ง error กลับมา (เช่น "Database error saving new user") ให้แสดงจริง
    const errMatch = /[?&#](?:error_description|error)=([^&#]+)/.exec(url);
    if (errMatch) {
      throw new Error(decodeURIComponent(errMatch[1].replace(/\+/g, " ")));
    }

    // 1. ดึง authorization code (PKCE flow) ก่อน ซึ่งเป็นมาตรฐานหลัก
    let code = null;
    const parsed = Linking.parse(url);
    if (parsed.queryParams?.code) {
      code = Array.isArray(parsed.queryParams.code)
        ? parsed.queryParams.code[0]
        : parsed.queryParams.code;
    }
    if (!code) {
      const codeMatch = /[?&]code=([^&#]+)/.exec(url);
      if (codeMatch) code = decodeURIComponent(codeMatch[1]);
    }

    if (code) {
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.exchangeCodeForSession(code);
      if (sessionErr) throw sessionErr;
      if (sessionData?.user) {
        await syncOAuthUser(sessionData.user);
      }
      return sessionData;
    }

    // 2. ดึง access_token / refresh_token (กรณี hash หรือ query)
    let accessToken = null;
    let refreshToken = null;
    const accessMatch = /[#?&]access_token=([^&#]+)/.exec(url);
    const refreshMatch = /[#?&]refresh_token=([^&#]+)/.exec(url);
    if (accessMatch && refreshMatch) {
      accessToken = decodeURIComponent(accessMatch[1]);
      refreshToken = decodeURIComponent(refreshMatch[1]);
    }

    if (accessToken && refreshToken) {
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      if (sessionErr) throw sessionErr;
      if (sessionData?.user) {
        await syncOAuthUser(sessionData.user);
      }
      return sessionData;
    }
  }

  if (res.type === "cancel" || res.type === "dismiss") {
    return null; // ผู้ใช้ปิดหน้า/ยกเลิกเอง
  }

  // เด้งกลับแอปได้ แต่ไม่มี code/token มาด้วย
  throw new Error(
    "ไม่ได้รับข้อมูลเข้าสู่ระบบจาก Google กลับมา โปรดลองอีกครั้ง",
  );
}

// ---------- ลบโพสต์ (ลบจริงใน Supabase) ----------

// ดึง path ของไฟล์ใน bucket ออกมาจาก public URL
function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export async function deletePostInDB(postId, userId, mediaUrl) {
  // ลบข้อมูลลูกที่ผูกกับโพสต์ก่อน (ถ้าตั้ง ON DELETE CASCADE ไว้ ขั้นนี้ก็ไม่เสียหาย)
  for (const table of [
    "recipe_ingredients",
    "recipe_steps",
    "likes",
    "comments",
  ]) {
    const { error } = await supabase.from(table).delete().eq("post_id", postId);
    if (error) throw error;
  }

  // ลบตัวโพสต์ — .select() เพื่อเช็กว่ามีแถวถูกลบจริง
  // (ถ้า RLS ไม่อนุญาต Supabase จะไม่ error แต่ลบได้ 0 แถว)
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("post_id", postId)
    .eq("creator_id", userId)
    .select("post_id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "ลบโพสต์ไม่สำเร็จ (ฐานข้อมูลไม่อนุญาต) — ตรวจ RLS policy DELETE ของตาราง posts",
    );
  }

  // ลบไฟล์รูปออกจาก Storage (ถ้าพลาดก็ไม่เป็นไร โพสต์ถูกลบไปแล้ว)
  const path = storagePathFromUrl(mediaUrl);
  if (path) {
    const { error: rmError } = await supabase.storage
      .from(BUCKET)
      .remove([path]);
    if (rmError) console.log("ลบไฟล์รูปไม่สำเร็จ:", rmError.message);
  }
  return true;
}

// ---------- รูปโปรไฟล์ ----------

// อัปโหลดรูปโปรไฟล์ แล้วบันทึก URL ลงตาราง users (คอลัมน์ avatar_url)
export async function uploadAvatar(media, userId) {
  const url = await uploadMediaFile(media, userId, "avatar-");
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: url })
    .eq("user_id", userId);
  if (error) throw error;
  return url;
}

// กลับไปใช้อีโมจิ (ล้างรูปโปรไฟล์)
export async function clearAvatar(userId) {
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------- Creator / ติดตาม ----------

// รายชื่อผู้ใช้ทั้งหมด (ใช้เป็น Creator)
export async function fetchCreators() {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, username, avatar_url, avatar_emoji, bio");
  if (error) throw error;
  return (data || []).map((u) => ({
    id: u.user_id,
    name: u.username || "ไม่ระบุชื่อ",
    avatarUrl: u.avatar_url || null,
    emoji: u.avatar_emoji || null,
    bio: u.bio || "",
  }));
}

// การติดตามทั้งหมด [{ follower_id, following_id }]
export async function fetchFollows() {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, following_id");
  if (error) throw error;
  return data || [];
}

export async function followUser(myId, targetId) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: myId, following_id: targetId });
  if (error) throw error;
}

export async function unfollowUser(myId, targetId) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", myId)
    .eq("following_id", targetId);
  if (error) throw error;
}

// ---------- ไลก์ ----------

export async function likePost(postId, userId) {
  const { error } = await supabase
    .from("likes")
    .insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function unlikePost(postId, userId) {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------- Favorite / กลุ่มที่บันทึก ----------

// คืน { รหัสโพสต์: [รหัสกลุ่ม, ...] }
export async function fetchFavorites(userId) {
  const { data, error } = await supabase
    .from("favorites")
    .select("post_id, collection_ids")
    .eq("user_id", userId);
  if (error) throw error;
  const favs = {};
  (data || []).forEach((r) => {
    favs[r.post_id] = r.collection_ids || [];
  });
  return favs;
}

// เพิ่ม Favorite หรืออัปเดตกลุ่มของโพสต์ที่บันทึกไว้
export async function saveFavorite(userId, postId, collectionIds = []) {
  const { error } = await supabase
    .from("favorites")
    .upsert(
      { user_id: userId, post_id: postId, collection_ids: collectionIds },
      { onConflict: "user_id,post_id" },
    );
  if (error) throw error;
}

export async function removeFavorite(userId, postId) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
  if (error) throw error;
}

export async function fetchCollections(userId) {
  const { data, error } = await supabase
    .from("collections")
    .select("collection_id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((c) => ({ id: c.collection_id, name: c.name }));
}

export async function createCollectionInDB(userId, name) {
  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, name })
    .select("collection_id, name")
    .single();
  if (error) throw error;
  return { id: data.collection_id, name: data.name };
}

// ---------- คอมเมนต์ ----------

// เพิ่มคอมเมนต์ลงตาราง comments แล้วคืน comment_id
export async function addCommentInDB(postId, userId, content) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content })
    .select("comment_id")
    .single();
  if (error) throw error;
  return data.comment_id;
}

// ---------- แจ้งเตือน (สร้างอัตโนมัติด้วย trigger ในฐานข้อมูล) ----------

function notificationText(n) {
  const who = n.actor_name || "มีคน";
  if (n.type === "like") return `${who} ถูกใจโพสต์ของคุณ`;
  if (n.type === "comment") return `${who} แสดงความคิดเห็นในโพสต์ของคุณ`;
  if (n.type === "follow") return `${who} เริ่มติดตามคุณ`;
  return n.message || "มีการแจ้งเตือนใหม่";
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((n) => ({
    id: n.notification_id,
    type: n.type,
    text: notificationText(n),
    at: new Date(n.created_at).getTime(),
    read: !!n.read,
    postId: n.post_id || null,
  }));
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("notification_id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}
