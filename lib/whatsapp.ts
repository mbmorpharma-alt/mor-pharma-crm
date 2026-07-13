export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return "972" + digits;
}

export function whatsappLink(phone: string, message: string): string {
  const number = toWhatsAppNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const followUpTemplates = [
  {
    id: "missing-details",
    label: "חסרים פרטים",
    build: (name: string) =>
      `היי ${name}, תודה שפנית אלינו! נשמח להשלים כמה פרטים כדי שנוכל להמשיך לטפל בבקשה שלך. אפשר שתחזור/י אלינו בהקדם? 🙏`,
  },
  {
    id: "closing",
    label: "סגירה",
    build: (name: string) =>
      `היי ${name}, רצינו לבדוק - האם החלטת להתקדם? נשמח לעזור בכל שאלה ולסגור יחד 😊`,
  },
  {
    id: "no-answer",
    label: "ניסינו לתפוס ללא מענה",
    build: (name: string) =>
      `היי ${name} ❤️, ניסינו להשיג אותך טלפונית ולא הצלחנו. נשמח שתחזור/י אלינו כשנוח לך!`,
  },
  {
    id: "check-in",
    label: "צ'ק אין",
    build: (name: string) =>
      `היי ${name}, רק רצינו לבדוק מה שלומך - איך מתקדם? נשמח לשמוע ולעזור אם צריך 🙌`,
  },
];
