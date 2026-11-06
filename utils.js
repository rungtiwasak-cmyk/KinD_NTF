// ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันหลายหน้า

const pad = (n) => String(n).padStart(2, '0');

// dd/mm/yyyy HH:MM
export const fmtDate = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "5 นาทีที่แล้ว" / "2 ชั่วโมงที่แล้ว" ...
export const ago = (ms) => {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'เมื่อสักครู่';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;
  return fmtDate(ms);
};

// ข้อความโภชนาการของโพสต์ (ช่องว่างได้ เพราะไม่บังคับกรอก)
export const nutriText = (post) => {
  const k = String(post.kcal || '').trim();
  const p = String(post.protein || '').trim();
  if (k && p) return `~${k} kcal | Protein ~${p}g`;
  if (k) return `~${k} kcal`;
  if (p) return `Protein ~${p}g`;
  return '';
};
