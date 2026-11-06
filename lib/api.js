import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system"; // หรือ "expo-file-system/legacy" ถ้ามีเส้นแดงแจ้งเตือน
import { supabase } from "./supabase"; // แก้ path ให้ตรงกับที่อยู่ไฟล์ supabase ของคุณ
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

    media: row.media_url ? { uri: row.media_url, type: "image" } : null,

    // ดึงชื่อผู้ใช้จากตาราง users
    author: row.users?.username || "ไม่ระบุชื่อ",
    emoji: "🍽️", // ฐานข้อมูลไม่มีรูปโปรไฟล์ เลยใช้อีโมจิแทนไปก่อน

    mine: row.creator_id === currentUserId,
    likes: likesList.length,
    liked: likesList.some((l) => l.user_id === currentUserId),

    comments: (row.comments || []).map((c) => ({
      id: c.comment_id,
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
      users ( username ),
      recipe_ingredients ( ingredient_name, amount ),
      recipe_steps ( step_number, instruction ),
      likes ( user_id ),
      comments ( comment_id, content, users ( username ) )
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

// นำเข้าต่อท้ายไฟล์ lib/api.js

export async function createPostInDB(postData, userId) {
  try {
    let mediaUrl = null;

    // 1. จัดการรูปภาพ (ถ้ามีรูปส่งมา)
    if (postData.media && postData.media.uri) {
      // ดึงนามสกุลไฟล์ และตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำกัน (ใช้ ID ผู้ใช้ + เวลาปัจจุบัน)
      const fileExt = postData.media.uri.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // ใช้ FormData แพ็คไฟล์รูปภาพให้ React Native ส่งเป็น binary file จริงๆ
      // อ่านไฟล์รูปเป็นข้อความ Base64
      const base64 = await FileSystem.readAsStringAsync(postData.media.uri, {
        encoding: "base64",
      });

      // โยนรูปขึ้นไปเก็บที่ Storage ชื่อ bucket ว่า 'post-media' (แปลง base64 เป็น ArrayBuffer ด้วย decode)
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
        });

      if (uploadError) throw uploadError;

      // ขอลิงก์รูป (Public URL) เพื่อเอาไปเก็บในฐานข้อมูล
      const { data: publicUrlData } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);
      mediaUrl = publicUrlData.publicUrl;
    }

    // 2. บันทึกข้อมูลหลักลงตาราง posts
    const { data: newPost, error: postError } = await supabase
      .from("posts")
      .insert({
        creator_id: userId,
        caption: postData.caption,
        category: postData.category,
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
      await supabase.from("recipe_ingredients").insert(ingData);
    }

    // 4. บันทึกวิธีทำลงตาราง recipe_steps
    if (postData.steps && postData.steps.length > 0) {
      const stepData = postData.steps.map((step, index) => ({
        post_id: newPost.post_id, // ผูกกับโพสต์ที่เพิ่งสร้าง
        step_number: index + 1,
        instruction: step,
      }));
      await supabase.from("recipe_steps").insert(stepData);
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
export async function registerUser(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error) throw error;

  // ถ้าสมัครสำเร็จ ให้สร้างโปรไฟล์ในตาราง users ด้วย
  if (data.user) {
    await supabase.from("users").insert({
      user_id: data.user.id,
      username: username || email.split("@")[0],
    });
  }
  return data;
}
