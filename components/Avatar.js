import React from 'react';
import { Image, Text } from 'react-native';

// เนื้อในวงกลมโปรไฟล์: ถ้ามีรูปที่ผู้ใช้ตั้งเอง (uri) ให้โชว์รูป ไม่งั้นโชว์อีโมจิ
// ตัววงกลมครอบ (View) ต้องมี overflow: 'hidden' เพื่อให้รูปถูกตัดเป็นวงกลม
export default function Avatar({ emoji, uri, fontSize = 24 }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
  }
  return <Text style={{ fontSize }}>{emoji}</Text>;
}
