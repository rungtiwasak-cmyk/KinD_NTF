import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// รวมสถานะหลายแหล่งข้อมูลเป็นสถานะเดียว: error > loading > success
export const combineStatus = (...list) =>
  list.includes('error') ? 'error' : list.includes('loading') ? 'loading' : 'success';

// ตัวครอบมาตรฐานให้ทุกหน้าจอมี 4 สถานะ
//   1. loading = กำลังโหลด   2. empty = ว่าง   3. error = ผิดพลาด (มีปุ่มลองใหม่)   4. success = แสดงข้อมูลจริง
// ใช้: <StateView status={status} empty={list.length === 0} onRetry={...}>...ข้อมูลจริง...</StateView>
export default function StateView({
  status = 'success',
  empty = false,
  error = '',
  onRetry,
  loadingText = 'กำลังโหลด...',
  emptyIcon = 'restaurant-outline',
  emptyTitle = 'ยังไม่มีข้อมูล',
  emptyHint = '',
  emptyAction,
  emptyActionLabel = '',
  compact = false,
  children,
}) {
  if (status === 'loading') {
    return (
      <View style={[styles.box, compact && styles.compact]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.hint}>{loadingText}</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={[styles.box, compact && styles.compact]}>
        <Ionicons name="cloud-offline-outline" size={36} color="#E53935" />
        <Text style={styles.title}>เกิดข้อผิดพลาด</Text>
        <Text style={styles.hint}>{error || 'โหลดข้อมูลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.85}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.btnText}>ลองใหม่</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={[styles.box, compact && styles.compact]}>
        <Ionicons name={emptyIcon} size={36} color={colors.muted} />
        <Text style={styles.title}>{emptyTitle}</Text>
        {emptyHint ? <Text style={styles.hint}>{emptyHint}</Text> : null}
        {emptyAction ? (
          <TouchableOpacity style={styles.btn} onPress={emptyAction} activeOpacity={0.85}>
            <Text style={styles.btnText}>{emptyActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  compact: { paddingVertical: 18 },
  title: { marginTop: 8, fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  hint: { marginTop: 6, fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  btn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
});
