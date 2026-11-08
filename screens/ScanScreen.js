import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { matchPosts } from '../data/posts';
import { nutriText } from '../utils';
import {
  isGeminiConfigured,
  analyzeIngredientsAndSuggestMenus,
  DEMO_AI_RESULT,
} from '../lib/gemini';

const QUICK = [
  'ไข่',
  'อกไก่',
  'บรอกโคลี',
  'มะเขือเทศ',
  'แซลมอน',
  'ข้าวกล้อง',
  'หมูสับ',
  'เต้าหู้',
  'กะเพรา',
  'พริก',
];

export default function ScanScreen({
  posts = [],
  initialPrompt = '',
  onSaveScan,
  onOpenPost,
  onBack,
}) {
  const [phase, setPhase] = useState('form'); // form | loading | result
  const [media, setMedia] = useState(null); // { uri, base64, mimeType, type }
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [error, setError] = useState('');
  const [loadingText, setLoadingText] = useState('AI กำลังวิเคราะห์รูปภาพและวัตถุดิบ...');
  const [result, setResult] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({}); // { [menuId]: boolean }
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const addItems = (raw) => {
    const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setItems((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
      });
      return next;
    });
    setText('');
    setError('');
  };

  const removeItem = (name) => setItems((prev) => prev.filter((x) => x !== name));

  const toggleSteps = (id) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('ไม่ได้รับอนุญาตให้ใช้กล้อง ลองเลือกรูปจากคลังแทน');
        return;
      }
      const r = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        base64: true,
      });
      if (!r.canceled && r.assets && r.assets[0]) {
        const asset = r.assets[0];
        setMedia({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image',
        });
        setError('');
      }
    } catch (_e) {
      setError('เปิดกล้องไม่ได้ ลองเลือกรูปจากคลังแทน');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });
      if (!r.canceled && r.assets && r.assets[0]) {
        const asset = r.assets[0];
        setMedia({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image',
        });
        setError('');
      }
    } catch (_e) {
      setError('เลือกไฟล์ไม่ได้ ลองใหม่อีกครั้ง');
    }
  };

  const run = async (forceDemo = false) => {
    // รวมข้อความที่พิมพ์ค้างในช่องเข้าไปด้วย
    const pending = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const all = [...items];
    pending.forEach((p) => {
      if (!all.some((x) => x.toLowerCase() === p.toLowerCase())) all.push(p);
    });

    if (!media && all.length === 0) {
      setError('ถ่ายรูป/เลือกรูปตู้เย็น หรือพิมพ์วัตถุดิบอย่างน้อย 1 อย่าง');
      return;
    }

    const hasKey = isGeminiConfigured();
    if (!hasKey && !forceDemo) {
      setError(
        'ยังไม่ได้ระบุ EXPO_PUBLIC_GEMINI_API_KEY ใน .env สามารถกดปุ่ม "ทดลองด้วยโหมดจำลอง (Demo)" หรือใส่ Key จาก Google AI Studio เพื่อใช้งานจริง'
      );
      return;
    }

    setItems(all);
    setText('');
    setError('');
    setPhase('loading');
    setLoadingText(
      media
        ? 'AI กำลังมองภาพเพื่อตรวจจับวัตถุดิบและสร้างสูตรเมนู...'
        : 'AI กำลังวิเคราะห์วัตถุดิบและคิดค้นเมนูอาหาร...'
    );

    try {
      let aiData;
      let isDemoResult = false;

      if (!hasKey || forceDemo) {
        // จำลอง delay ให้เสมือนจริงเล็กน้อย
        await new Promise((resolve) => setTimeout(resolve, 1000));
        aiData = DEMO_AI_RESULT;
        isDemoResult = true;
      } else {
        aiData = await analyzeIngredientsAndSuggestMenus({
          base64Image: media?.base64,
          mimeType: media?.mimeType || 'image/jpeg',
          manualIngredients: all,
          prompt,
        });
      }

      // นำวัตถุดิบที่ AI ตรวจพบ มารวมกับที่พิมพ์เพิ่ม
      const detected = Array.from(
        new Set([...(aiData.detected_ingredients || []), ...all])
      );

      // จับคู่กับโพสต์ที่มีในแอป
      const matches = matchPosts(posts, detected, prompt);

      const finalResult = {
        detected,
        aiMenus: aiData.suggested_menus || [],
        matches,
        isDemo: isDemoResult,
      };

      setResult(finalResult);

      // บันทึกลงประวัติการสแกน
      if (onSaveScan) {
        const savedMenus = [
          ...(aiData.suggested_menus || []).map((m) => `[AI] ${m.title}`),
          ...matches.slice(0, 3).map((m) => m.post.title || m.post.caption),
        ];
        onSaveScan({
          prompt: prompt.trim(),
          ingredients: detected,
          menus: savedMenus,
        });
      }

      setPhase('result');
    } catch (err) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการประมวลผล AI ลองใหม่อีกครั้ง');
      setPhase('form');
    }
  };

  const editAgain = () => {
    if (result?.detected) setItems(result.detected);
    setPhase('form');
  };

  const reset = () => {
    setMedia(null);
    setItems([]);
    setText('');
    setResult(null);
    setError('');
    setExpandedSteps({});
    setPhase('form');
  };

  const hasKeyConfigured = isGeminiConfigured();

  return (
    <ImageBackground
      source={require('../assets/bg_scanscreen.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>สแกนตู้เย็นด้วย AI</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          {phase === 'form' && (
            <>
              {/* แถบแจ้งเตือนสถานะ API Key */}
              {!hasKeyConfigured && (
                <View style={styles.keyNotice}>
                  <Ionicons name="key-outline" size={20} color="#D97706" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.keyNoticeTitle}>ยังไม่ได้ใส่ Gemini API Key</Text>
                    <Text style={styles.keyNoticeSub}>
                      รับ API Key ฟรีได้ที่ <Text style={{ fontWeight: 'bold' }}>aistudio.google.com</Text> แล้วนำมาใส่ในไฟล์ <Text style={{ fontFamily: 'monospace' }}>.env</Text> หรือกดปุ่มโหมดจำลองด้านล่างเพื่อทดสอบได้ทันที
                    </Text>
                  </View>
                </View>
              )}

              {/* รูปวัตถุดิบ/ตู้เย็น */}
              <Text style={styles.label}>1. ถ่ายรูปหรือเลือกรูปตู้เย็น / วัตถุดิบ</Text>
              <View style={styles.mediaBox}>
                {media && media.uri ? (
                  <View style={styles.mediaPreviewContainer}>
                    <Image source={{ uri: media.uri }} style={styles.mediaImg} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removeMediaBtn}
                      onPress={() => setMedia(null)}
                    >
                      <Ionicons name="close-circle" size={28} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="camera-outline" size={44} color={colors.primary} />
                    <Text style={styles.mediaText}>ยังไม่ได้เลือกรูปภาพ</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                      ถ่ายรูปวัตถุดิบเพื่อให้ AI ช่วยสแกน
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.outBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={18} color={colors.primary} />
                  <Text style={styles.outBtnText}>ถ่ายรูปด้วยกล้อง</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outBtn, { marginLeft: 10 }]}
                  onPress={pickFromLibrary}
                >
                  <Ionicons name="images-outline" size={18} color={colors.primary} />
                  <Text style={styles.outBtnText}>เลือกรูปจากคลัง</Text>
                </TouchableOpacity>
              </View>

              {/* พิมพ์วัตถุดิบเพิ่มเติม */}
              <Text style={styles.label}>2. พิมพ์วัตถุดิบที่มี (พิมพ์หลายอย่างคั่นด้วย , ได้)</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น ไข่, อกไก่, บรอกโคลี, หมูสับ"
                  placeholderTextColor={colors.muted}
                  value={text}
                  onChangeText={setText}
                  onSubmitEditing={() => addItems(text)}
                />
                <TouchableOpacity style={styles.addBtn} onPress={() => addItems(text)}>
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {items.length > 0 && (
                <View style={styles.wrap}>
                  {items.map((x) => (
                    <TouchableOpacity
                      key={x}
                      style={styles.itemChip}
                      onPress={() => removeItem(x)}
                    >
                      <Text style={styles.itemChipText}>{x}</Text>
                      <Ionicons
                        name="close"
                        size={14}
                        color={colors.primary}
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.sub}>แตะเพื่อเพิ่มวัตถุดิบด่วน</Text>
              <View style={styles.wrap}>
                {QUICK.filter((q) => !items.includes(q)).map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.quickChip}
                    onPress={() => addItems(q)}
                  >
                    <Text style={styles.quickText}>+ {q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Prompt สไตล์เมนู */}
              <Text style={styles.label}>3. สไตล์เมนูที่อยากทาน (ไม่บังคับ)</Text>
              <TextInput
                style={[styles.input, { flex: 0 }]}
                placeholder="เช่น คลีน, แคลอรีต่ำ, อาหารจานเดียว, ทำง่ายๆ"
                placeholderTextColor={colors.muted}
                value={prompt}
                onChangeText={setPrompt}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity style={styles.runBtn} onPress={() => run(false)}>
                <Text style={styles.runText}>✨ เจนเมนูด้วย AI</Text>
              </TouchableOpacity>

              {/* ปุ่มทดลองด้วย Demo หากยังไม่มี Key */}
              {!hasKeyConfigured && (
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => run(true)}
                >
                  <Ionicons name="flask-outline" size={18} color="#D97706" />
                  <Text style={styles.demoBtnText}>🧪 ทดลองด้วยข้อมูลจำลอง (Demo Mode)</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {phase === 'loading' && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{loadingText}</Text>
              <Text style={styles.loadingSub}>กำลังประมวลผลสูตรอาหารและวัตถุดิบ...</Text>
            </View>
          )}

          {phase === 'result' && result && (
            <>
              {result.isDemo && (
                <View style={styles.note}>
                  <Ionicons name="information-circle-outline" size={20} color="#8D6E63" />
                  <Text style={styles.noteText}>
                    ผลลัพธ์นี้ทำงานใน <Text style={{ fontWeight: 'bold' }}>Demo Mode</Text> (ข้อมูลจำลอง) เพื่อเชื่อมต่อ AI จริง ให้ใส่ Gemini API Key ฟรี ในไฟล์ <Text style={{ fontFamily: 'monospace' }}>.env</Text>
                  </Text>
                </View>
              )}

              {/* วัตถุดิบที่ตรวจพบ */}
              <View style={styles.sectionHeader}>
                <Ionicons name="basket-outline" size={20} color={colors.primary} />
                <Text style={[styles.label, { marginTop: 0, marginLeft: 6 }]}>
                  วัตถุดิบที่ตรวจพบ ({result.detected.length})
                </Text>
              </View>
              <View style={styles.wrap}>
                {result.detected.map((x) => (
                  <View key={x} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{x}</Text>
                  </View>
                ))}
              </View>
              {prompt.trim() ? (
                <Text style={styles.sub}>สไตล์ที่เลือก: {prompt.trim()}</Text>
              ) : null}

              {/* 1. เมนูที่ AI แนะนำ */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="sparkles" size={20} color="#FF9800" />
                <Text style={[styles.label, { marginTop: 0, marginLeft: 6 }]}>
                  เมนูสร้างสรรค์จาก AI ({result.aiMenus.length})
                </Text>
              </View>

              {result.aiMenus.length === 0 && (
                <Text style={styles.empty}>AI ไม่พบเมนูที่เหมาะสม ลองเปลี่ยนวัตถุดิบดูนะ</Text>
              )}

              {result.aiMenus.map((menu) => {
                const isExpanded = !!expandedSteps[menu.id];
                return (
                  <View key={menu.id} style={styles.aiMenuCard}>
                    {/* Header เมนู */}
                    <View style={styles.aiMenuTop}>
                      <View style={styles.aiMenuIcon}>
                        <Text style={{ fontSize: 28 }}>{menu.emoji || '🍳'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.aiMenuTitle} numberOfLines={1}>
                            {menu.title}
                          </Text>
                        </View>
                        <View style={styles.metaRow}>
                          {menu.category ? (
                            <View style={styles.metaBadge}>
                              <Text style={styles.metaBadgeText}>{menu.category}</Text>
                            </View>
                          ) : null}
                          {menu.cooking_time ? (
                            <View style={styles.metaBadge}>
                              <Ionicons name="time-outline" size={11} color="#666" />
                              <Text style={[styles.metaBadgeText, { marginLeft: 3 }]}>
                                {menu.cooking_time}
                              </Text>
                            </View>
                          ) : null}
                          {menu.difficulty ? (
                            <View
                              style={[
                                styles.metaBadge,
                                {
                                  backgroundColor:
                                    menu.difficulty === 'ง่าย' ? '#E8F5E9' : '#FFF3E0',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.metaBadgeText,
                                  {
                                    color:
                                      menu.difficulty === 'ง่าย' ? '#2E7D32' : '#E65100',
                                  },
                                ]}
                              >
                                {menu.difficulty}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    {/* คำอธิบาย */}
                    {menu.description ? (
                      <Text style={styles.aiMenuDesc}>{menu.description}</Text>
                    ) : null}

                    {/* ข้อมูลโภชนาการ */}
                    {(menu.calories || menu.protein) && (
                      <View style={styles.nutriRow}>
                        {menu.calories && (
                          <Text style={styles.nutriChip}>🔥 {menu.calories}</Text>
                        )}
                        {menu.protein && (
                          <Text style={[styles.nutriChip, { marginLeft: 8 }]}>
                            💪 โปรตีน {menu.protein}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* วัตถุดิบที่ใช้ & ที่ขาด */}
                    <View style={styles.ingredientsBox}>
                      {menu.used_ingredients && menu.used_ingredients.length > 0 && (
                        <View style={{ marginBottom: 6 }}>
                          <Text style={styles.ingSub}>วัตถุดิบที่มี:</Text>
                          <View style={styles.wrap}>
                            {menu.used_ingredients.map((ing, i) => (
                              <View key={i} style={styles.usedTag}>
                                <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                                <Text style={styles.usedTagText}>{ing}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {menu.missing_ingredients && menu.missing_ingredients.length > 0 && (
                        <View>
                          <Text style={[styles.ingSub, { color: '#C62828' }]}>
                            ต้องเตรียมเพิ่ม:
                          </Text>
                          <View style={styles.wrap}>
                            {menu.missing_ingredients.map((ing, i) => (
                              <View key={i} style={styles.missingTag}>
                                <Ionicons name="add-circle-outline" size={12} color="#C62828" />
                                <Text style={styles.missingTagText}>{ing}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* วิธีทำแบบพับเก็บได้ */}
                    {menu.quick_steps && menu.quick_steps.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <TouchableOpacity
                          style={styles.stepToggleBtn}
                          onPress={() => toggleSteps(menu.id)}
                        >
                          <Text style={styles.stepToggleText}>
                            {isExpanded ? 'ซ่อนวิธีทำ' : 'ดูวิธีทำด่วน'}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={colors.primary}
                          />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.stepsContainer}>
                            {menu.quick_steps.map((st, idx) => (
                              <View key={idx} style={styles.stepRow}>
                                <Text style={styles.stepNumber}>{idx + 1}.</Text>
                                <Text style={styles.stepText}>{st.replace(/^\d+[\.\s]*/, '')}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* 2. โพสต์สูตรอาหารในชุมชน */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                <Text style={[styles.label, { marginTop: 0, marginLeft: 6 }]}>
                  โพสต์สูตรในแอปที่ตรงกัน ({result.matches.length})
                </Text>
              </View>

              {result.matches.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.empty}>
                    ยังไม่พบโพสต์สูตรในแอปที่ตรงกับวัตถุดิบนี้ แต่สามารถทำตามเมนูแนะนำของ AI ด้านบนได้เลย!
                  </Text>
                </View>
              ) : (
                result.matches.map(({ post, missing }) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.menuRow}
                    onPress={() => onOpenPost(post.id)}
                  >
                    <View style={styles.menuImg}>
                      <Text style={{ fontSize: 30 }}>{post.emoji || '🍽️'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuName} numberOfLines={1}>
                        {post.title || post.caption}
                      </Text>
                      {nutriText(post) ? (
                        <Text style={styles.menuInfo}>{nutriText(post)}</Text>
                      ) : null}
                      <View
                        style={[
                          styles.tag,
                          {
                            backgroundColor:
                              missing.length === 0 ? '#E8F5E9' : '#FFEBEE',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            {
                              color: missing.length === 0 ? '#2E7D32' : '#C62828',
                            },
                          ]}
                        >
                          {missing.length === 0
                            ? 'ทำได้เลย มีวัตถุดิบครบ'
                            : `ขาด ${missing.length} อย่าง: ${missing.join(', ')}`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.saved}>✅ บันทึกลงประวัติการสแกนแล้ว ดูได้ที่หน้าโปรไฟล์</Text>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.outBtn} onPress={editAgain}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                  <Text style={styles.outBtnText}>แก้ไขวัตถุดิบ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outBtn, { marginLeft: 10 }]}
                  onPress={reset}
                >
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.outBtnText}>สแกนใหม่</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  sub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  error: {
    color: '#E53935',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  // กล่องแจ้งเตือน API Key
  keyNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  keyNoticeTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#92400E',
  },
  keyNoticeSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },

  mediaBox: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  mediaText: {
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 6,
    fontSize: 13,
  },

  btnRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  outBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 30,
    height: 44,
    backgroundColor: '#fff',
  },
  outBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 44,
    fontSize: 13,
  },
  addBtn: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0B2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  itemChipText: {
    color: colors.text,
    fontSize: 13,
  },
  quickChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  quickText: {
    color: colors.primary,
    fontSize: 12,
  },

  runBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  runText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoBtnText: {
    color: '#B45309',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },

  loading: {
    alignItems: 'center',
    marginTop: 80,
  },
  loadingText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  note: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    color: '#6D4C41',
    fontSize: 12,
    lineHeight: 18,
  },

  // การ์ดเมนู AI
  aiMenuCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  aiMenuTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiMenuIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  aiMenuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  metaBadgeText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  aiMenuDesc: {
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
    lineHeight: 18,
  },
  nutriRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  nutriChip: {
    fontSize: 11,
    color: '#E65100',
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ingredientsBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
  },
  ingSub: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  usedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  usedTagText: {
    fontSize: 11,
    color: '#2E7D32',
    marginLeft: 3,
  },
  missingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  missingTagText: {
    fontSize: 11,
    color: '#C62828',
    marginLeft: 3,
  },
  stepToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  stepToggleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  stepsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 6,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },

  // โพสต์ในชุมชน
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  menuImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuName: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 14,
  },
  menuInfo: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  tagText: {
    fontSize: 10,
  },
  saved: {
    color: '#2E7D32',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 14,
  },
});
