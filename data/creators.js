// รายชื่อ Creator (ใช้ร่วมกันในหน้าค้นหา หน้า Creator และการ์ดโพสต์)
// name ต้องตรงกับ author ของโพสต์ เพื่อจับว่าโพสต์ไหนเป็นของใคร
export const CREATORS = [
  { id: 1, name: 'ครัวคุณมะลิ', handle: 'mali_kitchen', emoji: '👩‍🍳', followers: '12.4k', focus: 'อาหารคลีนทำง่าย' },
  { id: 2, name: 'หนุ่มกะเพรา', handle: 'kaprao_boy', emoji: '🧑‍🍳', followers: '8.9k', focus: 'อาหารจานเดียว' },
  { id: 3, name: 'แม่ครัวอีสาน', handle: 'isan_mae', emoji: '👵', followers: '21k', focus: 'อาหารอีสานแท้' },
  { id: 4, name: 'FitFood Pim', handle: 'fitfood_pim', emoji: '🏃‍♀️', followers: '15.2k', focus: 'โปรตีนสูง คุมแคล' },
  { id: 5, name: 'ปักษ์ใต้บ้านเรา', handle: 'south_home', emoji: '🧔', followers: '6.1k', focus: 'แกงใต้ อาหารทะเล' },
];

export const findCreator = (name) => CREATORS.find((c) => c.name === name);
