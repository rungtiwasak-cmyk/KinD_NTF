import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../theme";

const CATEGORIES = [
  "เส้น",
  "ของทอด",
  "ข้าว",
  "ต้ม",
  "ผัด",
  "เผ็ด",
  "เปรี้ยว",
  "หวาน",
  "ย่าง/อบ",
  "สลัด/คลีน",
  "อื่นๆ",
];

// ---------- ส่วนประกอบย่อย ----------
function Label({ title, hint, optional }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{title}</Text>
      {optional ? (
        <Text style={styles.optional}> (ไม่บังคับ)</Text>
      ) : (
        <Text style={styles.required}> *</Text>
      )}
      {hint ? <Text style={styles.hint}> {hint}</Text> : null}
    </View>
  );
}

function ErrorText({ msg }) {
  return msg ? <Text style={styles.error}>{msg}</Text> : null;
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ช่องกรอกแบบเพิ่ม/ลบแถวได้ (ใช้กับส่วนผสมและวิธีทำ)
function ListEditor({ items, setItems, placeholder, numbered, addLabel }) {
  return (
    <View>
      {items.map((v, i) => (
        <View key={i} style={styles.listRow}>
          {numbered && <Text style={styles.stepNo}>{i + 1}</Text>}
          <TextInput
            style={[styles.input, { flex: 1 }, numbered && styles.inputMulti]}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            value={v}
            multiline={numbered}
            onChangeText={(t) =>
              setItems(items.map((x, idx) => (idx === i ? t : x)))
            }
          />
          <TouchableOpacity
            style={{ marginLeft: 8 }}
            onPress={() =>
              setItems(
                items.length > 1 ? items.filter((_, idx) => idx !== i) : [""],
              )
            }
          >
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setItems([...items, ""])}
      >
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addText}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- โหมดสร้างโพสต์ ----------
function CreatePost({ onSubmit }) {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState(null);
  const [ingredients, setIngredients] = useState([""]);
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [steps, setSteps] = useState([""]);
  const [errors, setErrors] = useState({});

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.7,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      setMedia({ uri: a.uri, type: a.type === "video" ? "video" : "image" });
    }
  };

  const submit = () => {
    const e = {};
    if (!media) e.media = "กรุณาเลือกรูปหรือวิดีโอ";
    if (!caption.trim()) e.caption = "กรุณาใส่แคปชั่น";
    if (!category) e.category = "กรุณาเลือกหมวดหมู่";
    if (!ingredients.some((s) => s.trim()))
      e.ingredients = "กรุณากรอกส่วนผสมอย่างน้อย 1 รายการ";
    if (!steps.some((s) => s.trim()))
      e.steps = "กรุณากรอกวิธีทำอย่างน้อย 1 ขั้นตอน";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onSubmit({
      media,
      caption: caption.trim(),
      category,
      ingredients: ingredients.map((s) => s.trim()).filter(Boolean),
      kcal: kcal.trim(),
      protein: protein.trim(),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* รูป/วิดีโอ */}
      <Label title="รูป / วิดีโอ" />
      <TouchableOpacity style={styles.mediaBox} onPress={pickMedia}>
        {media && media.type === "image" ? (
          <Image
            source={{ uri: media.uri }}
            style={styles.mediaImg}
            resizeMode="cover"
          />
        ) : media && media.type === "video" ? (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="videocam" size={40} color={colors.primary} />
            <Text style={styles.mediaText}>
              เลือกวิดีโอแล้ว (แตะเพื่อเปลี่ยน)
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="images-outline" size={40} color={colors.primary} />
            <Text style={styles.mediaText}>แตะเพื่อเลือกรูปหรือวิดีโอ</Text>
          </View>
        )}
      </TouchableOpacity>
      <ErrorText msg={errors.media} />

      {/* แคปชั่น */}
      <Label title="แคปชั่น" />
      <TextInput
        style={[styles.input, styles.inputMulti]}
        placeholder="เล่าเมนูของคุณหน่อย..."
        placeholderTextColor={colors.muted}
        value={caption}
        onChangeText={setCaption}
        multiline
      />
      <ErrorText msg={errors.caption} />

      {/* หมวดหมู่ */}
      <Label title="หมวดหมู่" hint="เลือกได้ 1" />
      <View style={styles.chipWrap}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>
      <ErrorText msg={errors.category} />

      {/* ส่วนผสม */}
      <Label title="ส่วนผสม (เครื่องปรุง)" hint="เช่น อกไก่ 200 g" />
      <ListEditor
        items={ingredients}
        setItems={setIngredients}
        placeholder="ชื่อวัตถุดิบ + ปริมาณ"
        addLabel="เพิ่มส่วนผสม"
      />
      <ErrorText msg={errors.ingredients} />

      {/* โภชนาการ */}
      <Label
        title="ข้อมูลโภชนาการ"
        optional
        hint="รู้คร่าวๆ ก็ใส่ ไม่รู้ข้ามได้"
      />
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <TextInput
            style={styles.input}
            placeholder="แคลอรี่ (kcal)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={kcal}
            onChangeText={setKcal}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            placeholder="โปรตีน (g)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />
        </View>
      </View>

      {/* วิธีทำ */}
      <Label title="วิธีทำ" hint="เขียนแบบละเอียดทีละขั้นตอน" />
      <ListEditor
        items={steps}
        setItems={setSteps}
        placeholder="อธิบายขั้นตอนนี้"
        numbered
        addLabel="เพิ่มขั้นตอน"
      />
      <ErrorText msg={errors.steps} />

      <TouchableOpacity style={styles.submitBtn} onPress={submit}>
        <Text style={styles.submitText}>โพสต์เลย</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------- หน้า Post ----------
// ---------- หน้า Post (สร้างโพสต์อย่างเดียว) ----------
export default function PostScreen({ onAddPost, onOpenMyPosts }) {
  const [formKey, setFormKey] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <ImageBackground
      source={require("../assets/bg_post.jpg")} // เรียกใช้ไฟล์ bg_post.jpg
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.pageTitle}>สร้างโพสต์</Text>
        {done && (
          <View style={styles.banner}>
            <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            <Text style={[styles.bannerText, { flex: 1 }]}>
              โพสต์สำเร็จแล้ว!
            </Text>
            {onOpenMyPosts ? (
              <TouchableOpacity onPress={onOpenMyPosts}>
                <Text style={styles.bannerLink}>ดูโพสต์ของฉัน ›</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        <CreatePost
          key={formKey}
          onSubmit={(p) => {
            onAddPost(p);
            setFormKey(formKey + 1); // เปลี่ยน key เพื่อล้างฟอร์ม
            setDone(true);
            setTimeout(() => setDone(false), 6000);
          }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: { padding: 16, paddingBottom: 40 },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  label: { fontSize: 15, fontWeight: "bold", color: colors.text },
  required: { color: "#E53935", fontWeight: "bold" },
  optional: { color: colors.muted, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 12 },
  error: { color: "#E53935", fontSize: 12, marginTop: 4 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 44,
    fontSize: 13,
  },
  inputMulti: { minHeight: 64, textAlignVertical: "top", paddingTop: 10 },

  mediaBox: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaImg: { width: "100%", height: "100%" },
  mediaText: { color: colors.primary, marginTop: 6, fontSize: 13 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: "#fff", fontWeight: "bold" },

  listRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stepNo: { width: 24, fontWeight: "bold", color: colors.primary },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  addText: {
    color: colors.primary,
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 13,
  },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  pageTitle: {
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.88)",
    overflow: "hidden",
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  banner: { color: colors.primary, fontWeight: "bold", fontSize: 13 },
  bannerText: { color: "#2E7D32", fontWeight: "bold", marginLeft: 8 },
  bannerLink: { color: colors.primary, fontWeight: "bold", fontSize: 13 },
});
