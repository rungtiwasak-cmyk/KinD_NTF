// เมนูแนะนำ: คำนวณจากข้อมูลจริงของผู้ใช้ (ติดตาม / ไลก์ / Favorite / วัตถุดิบที่สแกนล่าสุด)
// ไม่มีรายการสุ่มหรือค่าคงที่อีกต่อไป

const norm = (s) => String(s || '').toLowerCase().trim();

// ชื่อวัตถุดิบในโพสต์อาจมีปริมาณต่อท้าย เช่น "หมูสับ 100 g"
// ถือว่ามีของแล้วถ้าชื่อที่สแกนเจออยู่ในข้อความนั้น (หรือกลับกัน)
function hasIngredient(postIngredient, detected) {
  const p = norm(postIngredient);
  return detected.some((d) => {
    const x = norm(d);
    return x && (p.includes(x) || x.includes(p));
  });
}

// คืน null ถ้ายังไม่เคยสแกนหรือโพสต์ไม่มีส่วนผสม (ไม่รู้ว่าพร้อมทำไหม)
export function readyState(post, detected = []) {
  if (!detected.length || !(post.ingredients || []).length) return null;
  const have = post.ingredients.filter((i) => hasIngredient(i, detected)).length;
  return have / post.ingredients.length >= 0.7;
}

export function buildRecommendations({ posts = [], following = {}, favs = {}, detected = [], limit = 6 }) {
  const mine = (p) => p.mine;
  const liked = posts.filter((p) => p.liked);
  const favIds = new Set(Object.keys(favs).map(String));
  const favPosts = posts.filter((p) => favIds.has(String(p.id)));

  const likedCreators = new Set(liked.map((p) => p.creatorId));
  const likedCats = new Set([...liked, ...favPosts].map((p) => p.category).filter(Boolean));

  return posts
    .filter((p) => !mine(p) && !(p.restrictionHits && p.restrictionHits.length))
    .map((p) => {
      const ready = readyState(p, detected);
      let score = 0;
      if (following[p.creatorId]) score += 4;
      if (likedCreators.has(p.creatorId)) score += 2;
      if (p.category && likedCats.has(p.category)) score += 2;
      if (ready === true) score += 3;
      if (p.liked) score -= 1; // เคยไลก์แล้ว ให้เมนูใหม่ๆ ขึ้นก่อน
      score += Math.min(p.likes || 0, 100) / 100; // ใช้ยอดไลก์ตัดสินเมื่อคะแนนเท่ากัน
      return { postId: p.id, post: p, ready, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
