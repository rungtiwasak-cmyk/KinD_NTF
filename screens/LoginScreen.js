import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser, loginWithOAuth } from "../lib/api";
import { colors } from "../theme";

const BG = require("../assets/bg.png");
const BOWL = require("../assets/bowl.png");

export default function LoginScreen({ onLogin, onRegister, onForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(null); // 'google' | 'apple' | null

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSocialLogin = async (provider) => {
    if (loadingSocial) return;
    setLoadingSocial(provider);
    try {
      const session = await loginWithOAuth(provider);
      if (session && onLogin) {
        onLogin();
      }
    } catch (error) {
      console.log(`${provider} login error:`, error?.message);
      const msg = error?.message || "";
      if (
        msg.toLowerCase().includes("provider is not enabled") ||
        msg.toLowerCase().includes("not enabled") ||
        msg.toLowerCase().includes("unsupported provider")
      ) {
        Alert.alert(
          "ยังไม่ได้เปิดใช้งาน Provider ใน Supabase",
          `ระบบ Supabase ยังไม่ได้เปิดใช้งาน ${provider === "google" ? "Google" : "Apple"} Login\n\nสามารถเปิดใช้งานได้ที่ Supabase Dashboard > Authentication > Providers`
        );
      } else {
        Alert.alert(
          "เข้าสู่ระบบไม่สำเร็จ",
          `ไม่สามารถเข้าสู่ระบบผ่าน ${provider === "google" ? "Google" : "Apple"} ได้: ${error?.message || "กรุณาลองใหม่อีกครั้ง"}`
        );
      }
    } finally {
      setLoadingSocial(null);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    try {
      Alert.alert("กำลังเข้าสู่ระบบ", "กรุณารอสักครู่...");
      await loginUser(email, password);

      if (onLogin) onLogin();
    } catch (error) {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      console.log(error.message);
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../assets/H_logo.jpg")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>กินดี มีสุข ทุกมื้อ ♥</Text>
          <Text style={styles.subtitle}></Text>

          <Image source={BOWL} style={styles.bowl} resizeMode="contain" />

          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="อีเมล หรือ ชื่อผู้ใช้งาน"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons
                  name={showPw ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onForgot}>
              <Text style={styles.forgot}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginText}>เข้าสู่ระบบ (Log In)</Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.or}>หรือเข้าสู่ระบบด้วย</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, loadingSocial === "google" && { opacity: 0.7 }]}
                onPress={() => handleSocialLogin("google")}
                disabled={loadingSocial !== null}
              >
                {loadingSocial === "google" ? (
                  <ActivityIndicator size="small" color="#DB4437" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#DB4437" />
                    <Text style={styles.socialText}> เข้าสู่ระบบด้วย Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.bottom}>
            ยังไม่มีบัญชี?{" "}
            <Text style={{ color: colors.primary }} onPress={onRegister}>
              สมัครสมาชิกที่นี่
            </Text>
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: { fontSize: 48, fontWeight: "bold", color: colors.primary },
  title: { fontSize: 22, fontWeight: "bold", color: colors.text, marginTop: 4 },
  subtitle: { color: colors.muted, marginBottom: 4 },
  bowl: { width: 220, height: 130, marginBottom: 8 },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 10 },
  forgot: { color: colors.primary, textAlign: "right", marginBottom: 12 },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.muted, marginHorizontal: 10, fontSize: 13 },
  socialRow: { flexDirection: "row", justifyContent: "space-between" },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    height: 46,
    marginHorizontal: 4,
  },
  socialText: { fontSize: 13 },
  bottom: { marginTop: 20, color: colors.text },
  logoImage: { width: 150, height: 60, marginBottom: 8 },
});
