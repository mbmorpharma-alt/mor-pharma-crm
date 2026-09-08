export const CAMPAIGNS = [
  { name: "מוצרים לתחום הביוטי", opening: "אשמח לקבל פרטים על מוצרים לתחום הביוטי" },
  { name: "על נייר לעסק", opening: "אשמח לקבל פרטים על נייר לעסק" },
  { name: "כפפות ורודות", opening: "אשמח לקבל פרטים על כפפות ורודות" },
  { name: "כפפות בקניה סיטונאית", opening: "אשמח לקבל פרטים על כפפות בקניה סיטונאית" },
  { name: "כפפות פרו מקס ועוד מוצרים", opening: "אשמח לקבל פרטים על כפפות פרו מקס ועוד מוצרים" },
  { name: "כפפות עבודה", opening: "אשמח לקבל פרטים על כפפות עבודה" },
];

export const CAMPAIGN_NAMES = CAMPAIGNS.map((c) => c.name);

// Sorted longest-opening-first so a longer, more specific sentence
// is matched before a shorter one that could also be a prefix of it.
const BY_LENGTH_DESC = [...CAMPAIGNS].sort((a, b) => b.opening.length - a.opening.length);

export function detectCampaign(message: string | null | undefined): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  const match = BY_LENGTH_DESC.find((c) => trimmed.startsWith(c.opening));
  return match ? match.name : null;
}
