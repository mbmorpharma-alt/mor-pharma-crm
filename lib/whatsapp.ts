export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return "972" + digits;
}

export const followUpTemplates = [
  {
    id: "missing-details",
    label: "חסרים פרטים",
    build: () => `היי, יצא לך לעבור על הקטלוג צריך הזמנה?`,
  },
  {
    id: "closing",
    label: "סגירה",
    build: (name: string) =>
      `היי ${name}, רציתי לדעת אם החלטת להתקדם - אנחנו כאן לכל שאלה :)`,
  },
  {
    id: "no-answer",
    label: "ניסינו לתפוס ללא מענה",
    build: (name: string) => `היי ${name}, ניסינו לתפוס אותך ללא מענה :)`,
  },
  {
    id: "check-in",
    label: "צ'ק אין",
    build: (name: string) =>
      `היי ${name}, מה שלומך?\nהאם במקרה צריכים הזמנה חדשה?`,
  },
  {
    id: "unavailable-male",
    label: "טרם היית זמין",
    tag: "זכר",
    build: () =>
      `טרם היית זמין,\nאיזה סוג נייר ומה הכמות שאתה מעוניין?\nהאם רלוונטיים לך עוד מוצרים?`,
  },
  {
    id: "unavailable-female",
    label: "טרם היית זמינה",
    tag: "נקבה",
    build: () =>
      `טרם היית זמינה,\nאיזה סוג נייר ומה הכמות שאת מעוניינת?\nהאם רלוונטיים לך עוד מוצרים?`,
  },
] as {
  id: string;
  label: string;
  tag?: string;
  build: (name: string) => string;
}[];
