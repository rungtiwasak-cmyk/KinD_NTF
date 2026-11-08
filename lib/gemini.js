// บริการเชื่อมต่อ Google Gemini API (Multimodal / Vision)
// รองรับโมเดลล่าสุด เช่น gemini-3.5-flash และ gemini-3.5-flash-lite

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];

/**
 * ตรวจสอบว่าผู้ใช้ได้ใส่ Gemini API Key หรือยัง
 */
export function isGeminiConfigured() {
  return Boolean(
    GEMINI_API_KEY &&
      GEMINI_API_KEY.trim().length > 10 &&
      !GEMINI_API_KEY.includes("YOUR_")
  );
}

/**
 * ข้อมูลจำลองสำหรับทดสอบ (กรณีผู้ใช้ยังไม่ได้ใส่ API Key)
 */
export const DEMO_AI_RESULT = {
  detected_ingredients: ["ไข่ไก่", "อกไก่", "บรอกโคลี", "มะเขือเทศ", "ข้าวกล้อง"],
  suggested_menus: [
    {
      id: "demo-1",
      title: "อกไก่ผัดบรอกโคลีคลีน",
      emoji: "🥦",
      category: "ผัด / คลีน",
      description: "เมนูสุขภาพโปรตีนสูง ทำง่าย อร่อยและแคลอรีต่ำ",
      used_ingredients: ["อกไก่", "บรอกโคลี"],
      missing_ingredients: ["กระเทียม", "ซีอิ๊วขาว", "น้ำมันมะกอก"],
      cooking_time: "15 นาที",
      difficulty: "ง่าย",
      calories: "280 kcal",
      protein: "32 g",
      quick_steps: [
        "หั่นอกไก่เป็นชิ้นพอดีคำ และลวกบรอกโคลีพักไว้",
        "ผัดกระเทียมในน้ำมันมะกอกจนหอม ใส่อกไก่ลงไปผัดจนสุก",
        "ใส่บรอกโคลีลงไป ปรุงรสด้วยซีอิ๊วขาวและพริกไทย คลุกเคล้าให้เข้ากัน พร้อมเสิร์ฟ",
      ],
    },
    {
      id: "demo-2",
      title: "ไข่ขยี้มะเขือเทศสด",
      emoji: "🍳",
      category: "ผัด / ง่าย",
      description: "รสชาติเปรี้ยวหวานกลมกล่อมจากมะเขือเทศสุก เข้ากันได้ดีกับไข่นุ่มๆ",
      used_ingredients: ["ไข่ไก่", "มะเขือเทศ"],
      missing_ingredients: ["ต้นหอม", "น้ำมันพืช", "เกลือ"],
      cooking_time: "10 นาที",
      difficulty: "ง่าย",
      calories: "210 kcal",
      protein: "14 g",
      quick_steps: [
        "ตีไข่ไก่พอแตก พักไว้ หั่นมะเขือเทศเป็นชิ้นพอคำ",
        "ผัดมะเขือเทศในกระทะจนนิ่มและเริ่มมีน้ำหวานออกมา",
        "เทไข่ลงไป คนเบาๆ จนไข่เริ่มเซ็ตตัวแต่ยังนุ่มฉ่ำ โรยต้นหอมก่อนยกเสิร์ฟ",
      ],
    },
    {
      id: "demo-3",
      title: "ข้าวผัดอกไก่ไข่ดาวคลีน",
      emoji: "🍚",
      category: "ข้าวผัด",
      description: "ใช้วัตถุดิบครบครัน อิ่มท้องได้พลังงานดีจากข้าวกล้อง",
      used_ingredients: ["ข้าวกล้อง", "อกไก่", "ไข่ไก่", "มะเขือเทศ"],
      missing_ingredients: ["กระเทียม", "ซอสปรุงรส"],
      cooking_time: "15 นาที",
      difficulty: "ง่าย",
      calories: "420 kcal",
      protein: "30 g",
      quick_steps: [
        "ผัดกระเทียมกับอกไก่จนสุก",
        "ใส่ข้าวกล้องและมะเขือเทศลงผัด ปรุงรสตามชอบ",
        "ทอดไข่ดาวโปะหน้าข้าวผัดร้อนๆ",
      ],
    },
  ],
};

/**
 * ส่งรูปภาพ (Base64) หรือวัตถุดิบ ไปให้ Gemini วิเคราะห์และแนะนำเมนู
 */
export async function analyzeIngredientsAndSuggestMenus({
  base64Image,
  mimeType = "image/jpeg",
  manualIngredients = [],
  prompt = "",
}) {
  if (!isGeminiConfigured()) {
    throw new Error(
      "ยังไม่ได้ระบุ EXPO_PUBLIC_GEMINI_API_KEY ในไฟล์ .env กรุณาใส่ API Key จาก Google AI Studio เพื่อใช้งาน AI จริง"
    );
  }

  const parts = [];

  // ใส่รูปภาพถ้ามี
  if (base64Image) {
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Image,
      },
    });
  }

  const systemPrompt = `คุณคือเชฟผู้เชี่ยวชาญด้านอาหารไทยและอาหารเพื่อสุขภาพ
หน้าที่ของคุณคือ:
1. หากมีรูปภาพ ให้ตรวจจับวัตถุดิบอาหาร ผัก ผลไม้ เนื้อสัตว์ เครื่องปรุง หรือของสดที่มองเห็นในภาพตู้เย็น/โต๊ะอาหาร (ระบุเป็นภาษาไทยสั้นๆ ชัดเจน)
2. รวมวัตถุดิบที่ตรวจพบ เข้ากับวัตถุดิบเพิ่มเติมที่ผู้ใช้ระบุ (ถ้ามี): ${
    manualIngredients.length > 0 ? manualIngredients.join(", ") : "ไม่มีเพิ่มเติม"
  }
3. สไตล์หรือความต้องการของผู้ใช้: ${prompt.trim() ? prompt.trim() : "ทำง่าย อร่อย ใช้วัตถุดิบที่มีให้คุ้มค่า"}
4. คิดและแนะนำเมนูอาหารที่เหมาะสม 3-5 เมนู ที่ทำได้จริงจากวัตถุดิบเหล่านี้

ตอบกลับเป็น JSON เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "detected_ingredients": ["วัตถุดิบ 1", "วัตถุดิบ 2", ...],
  "suggested_menus": [
    {
      "id": "1",
      "title": "ชื่อเมนู",
      "emoji": "🍳",
      "category": "ผัด / ต้ม / ทอด / ยำ / คลีน ฯลฯ",
      "description": "คำอธิบายเมนูสั้นๆ 1-2 ประโยค",
      "used_ingredients": ["วัตถุดิบที่มีและใช้ในเมนูนี้"],
      "missing_ingredients": ["วัตถุดิบหรือเครื่องปรุงที่ต้องหาเพิ่ม (ถ้ามี)"],
      "cooking_time": "15 นาที",
      "difficulty": "ง่าย / ปานกลาง",
      "calories": "350 kcal",
      "protein": "25 g",
      "quick_steps": [
        "ขั้นตอนที่ 1...",
        "ขั้นตอนที่ 2...",
        "ขั้นตอนที่ 3..."
      ]
    }
  ]
}`;

  parts.push({ text: systemPrompt });

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.4,
    },
  };

  let lastError = null;

  // วนลองโมเดลที่รองรับตามลำดับ (gemini-3.5-flash -> gemini-3.5-flash-lite)
  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${response.status}`;
        if (response.status === 400 && message.toLowerCase().includes("api key")) {
          throw new Error("Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบในไฟล์ .env");
        }
        if (response.status === 429) {
          throw new Error("โควตาฟรีชั่วคราวเต็ม (Rate Limit) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง");
        }
        // ถ้าเป็น 404 ไม่เจอโมเดล ให้ลองโมเดลถัดไป
        if (response.status === 404 || message.includes("not found") || message.includes("no longer available")) {
          lastError = new Error(message);
          continue;
        }
        throw new Error(`AI เกิดข้อผิดพลาด: ${message}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("ไม่สามารถอ่านข้อมูลผลลัพธ์จาก AI ได้ กรุณาลองใหม่อีกครั้ง");
      }

      const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      return {
        detected_ingredients: Array.isArray(parsed.detected_ingredients)
          ? parsed.detected_ingredients
          : [],
        suggested_menus: Array.isArray(parsed.suggested_menus)
          ? parsed.suggested_menus
          : [],
      };
    } catch (err) {
      lastError = err;
      if (err.message.includes("API Key") || err.message.includes("โควตา")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("ไม่สามารถเชื่อมต่อ AI ได้ กรุณาลองใหม่อีกครั้ง");
}
