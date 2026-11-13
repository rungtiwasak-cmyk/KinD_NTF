// ตัวเลือกโปรไฟล์ที่ใช้ร่วมกันหลายหน้า (ตั้งค่าครั้งแรก / แก้ไขโปรไฟล์ / เป้าหมาย)

export const USER_GROUPS = ['นักศึกษาหอพัก', 'แม่บ้าน', 'สายสุขภาพ-นักกีฬา', 'อื่นๆ'];

export const HEALTH_GOALS = ['สร้างกล้ามเนื้อ (High Protein)', 'ควบคุมน้ำหนัก', 'ประหยัดงบ'];

// ข้อจำกัดอาหาร = อาหารที่แพ้ / ไม่กิน / กินไม่ได้ (แพ้, ศาสนา-ความเชื่อ, สุขภาพ, รสชาติ)
export const ALLERGY_SUGGEST = [
  'กุ้ง',
  'ถั่วลิสง',
  'นม',
  'ไข่',
  'ถั่วเหลือง',
  'ข้าวสาลี',
  'หอย',
  'ปลา',
  'ไม่กินเผ็ด',
  'มังสวิรัติ',
];

// ข้อจำกัดที่เป็น "รูปแบบการกิน" ตรวจด้วยคำค้นในส่วนผสมไม่ได้ ปล่อยให้ AI พิจารณาแทน
const NON_KEYWORD = ['เผ็ด', 'มังสวิรัติ', 'ฮาลาล', 'เจ'];

// "แพ้ถั่ว" -> "ถั่ว", "ไม่กินกุ้ง" -> "กุ้ง"
export function restrictionKeywords(restrictions = []) {
  return restrictions
    .map((r) => String(r).replace(/^(แพ้|ไม่กิน|งด)\s*/, '').trim())
    .filter((k) => k && !NON_KEYWORD.includes(k));
}

// คืนรายการข้อจำกัดที่พบในส่วนผสม/ข้อความของโพสต์ (ใช้เตือนผู้ใช้ และกรองเมนูที่ Scan AI จับคู่ให้)
export function findRestrictionHits(post, restrictions = []) {
  const keywords = restrictionKeywords(restrictions);
  if (keywords.length === 0 || !post) return [];
  const text = [...(post.ingredients || []), post.caption || '', post.title || ''].join(' ');
  return keywords.filter((k) => text.includes(k));
}
