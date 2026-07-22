import { toWhatsAppNumber } from "./whatsapp";

export async function sendWhatsAppMessage(phone: string, message: string) {
  const idInstance = process.env.GREEN_API_ID_INSTANCE;
  const apiTokenInstance = process.env.GREEN_API_API_TOKEN;

  if (!idInstance || !apiTokenInstance) {
    throw new Error("Green API אינו מוגדר (חסרים משתני סביבה)");
  }

  const chatId = `${toWhatsAppNumber(phone)}@c.us`;

  const res = await fetch(
    `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`שליחת הודעת וואטסאפ נכשלה: ${text}`);
  }

  return res.json();
}
