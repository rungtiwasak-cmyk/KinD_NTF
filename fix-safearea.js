// รันที่โฟลเดอร์นอกสุดของโปรเจกต์:  node fix-safearea.js
// ทำอะไร: เปลี่ยน SafeAreaView ของ react-native (ไม่กันแถบสถานะบน Android และถูกประกาศเลิกใช้แล้ว)
// ไปใช้ของ react-native-safe-area-context และครอบแอปด้วย SafeAreaProvider
const fs = require("fs");
const path = require("path");

const NEW_IMPORT =
  "import { SafeAreaView } from 'react-native-safe-area-context';";
const FULL_SCREEN = ["LoginScreen.js", "RegisterScreen.js"]; // หน้าที่ไม่ต้องการแถบล่าง ให้กันทุกด้าน
const backupDir = path.join(path.resolve(), "_backup_safearea"); // ใช้ path.resolve() แทน __dirname
const changed = [];

// ถ้าไฟล์ใช้ require อยู่แล้ว ให้ใช้ชุดนี้แทนครับ:
const __filename = require("url").pathToFileURL(__filename).href; // หรือประกาศแบบง่ายด้านล่าง

function backup(file) {
  // เปลี่ยนตรง __dirname เป็น path.resolve()
  const dest = path.join(backupDir, path.relative(path.resolve(), file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

function patchScreen(file) {
  let s = fs.readFileSync(file, "utf8");
  if (
    !s.includes("SafeAreaView") ||
    s.includes("from 'react-native-safe-area-context'")
  )
    return;

  // 1) เอา SafeAreaView ออกจาก import ของ react-native
  const re = /import\s*\{([^}]*)\}\s*from\s*'react-native';/;
  const m = s.match(re);
  if (!m || !/\bSafeAreaView\b/.test(m[1])) return;
  const multiline = m[1].includes("\n");
  const names = m[1]
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x && x !== "SafeAreaView");
  const rebuilt = multiline
    ? `import {\n  ${names.join(",\n  ")},\n} from 'react-native';`
    : `import { ${names.join(", ")} } from 'react-native';`;
  s = s.replace(re, rebuilt + "\n" + NEW_IMPORT);

  // 2) กันเฉพาะด้านบน (แถบล่างมี BottomTabs อยู่แล้ว) ยกเว้นหน้า Login/Register
  if (!FULL_SCREEN.includes(path.basename(file))) {
    s = s.replace(
      /<SafeAreaView(?![^>]*\bedges=)/g,
      "<SafeAreaView edges={['top']}",
    );
  }

  backup(file);
  fs.writeFileSync(file, s);
  changed.push(path.relative(path.resolve(), file));
}

// หน้าจอทั้งหมดในโฟลเดอร์ screens
const screensDir = path.join(path.resolve(), "screens");
fs.readdirSync(screensDir)
  .filter((f) => f.endsWith(".js"))
  .forEach((f) => patchScreen(path.join(screensDir, f)));

// App.js: ครอบด้วย SafeAreaProvider
const appFile = path.join(path.resolve(), "App.js");
let app = fs.readFileSync(appFile, "utf8");
if (!app.includes("SafeAreaProvider")) {
  if (/export default function App\s*\(/.test(app)) {
    backup(appFile);
    app = app.replace(
      /export default function App\s*\(/,
      "function AppContent(",
    );
    // วาง import ใหม่ต่อจากบรรทัด import สุดท้าย
    const lastImport = app.lastIndexOf("\nimport ");
    const endOfLine = app.indexOf("\n", lastImport + 1);
    app =
      app.slice(0, endOfLine + 1) +
      "import { SafeAreaProvider } from 'react-native-safe-area-context';\n" +
      app.slice(endOfLine + 1);
    app += `
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
`;
    fs.writeFileSync(appFile, app);
    changed.push("App.js");
  } else {
    console.log(
      "⚠️  App.js ไม่ตรงรูปแบบที่คาดไว้ ข้ามการครอบ SafeAreaProvider (ไม่จำเป็นเสมอไป)",
    );
  }
}

console.log("แก้แล้ว", changed.length, "ไฟล์:\n - " + changed.join("\n - "));
console.log("สำรองไฟล์เดิมไว้ที่ _backup_safearea");
