import { toWhatsAppNumber } from "./whatsapp";

async function postToGreenApi(url: string, chatId: string, message: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`שליחת הודעת וואטסאפ נכשלה: ${text}`);
  }

  return res.json();
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  const idInstance = process.env.GREEN_API_ID_INSTANCE;
  const apiTokenInstance = process.env.GREEN_API_API_TOKEN;

  if (!idInstance || !apiTokenInstance) {
    throw new Error("Green API אינו מוגדר (חסרים משתני סביבה)");
  }

  const chatId = `${toWhatsAppNumber(phone)}@c.us`;
  const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  // The call to Green API occasionally fails at the network level (DNS/TLS/
  // connection reset) rather than with a proper HTTP error — Node surfaces
  // that as a generic "fetch failed" with no useful detail. One quick retry
  // clears most of these transient blips; a real outage still surfaces a
  // clear Hebrew error after the retry instead of hanging indefinitely.
  try {
    return await postToGreenApi(url, chatId, message);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("שליחת הודעת וואטסאפ")) throw err;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      return await postToGreenApi(url, chatId, message);
    } catch {
      throw new Error("שליחת הודעת וואטסאפ נכשלה - בעיית רשת זמנית, נסה שוב בעוד רגע");
    }
  }
}
