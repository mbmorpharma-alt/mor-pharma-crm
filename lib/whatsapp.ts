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
    build: (name: string) =>
      `היי ${name}, עדיין חסרים לנו כמה פרטים - אשמח לקבל אותם בהקדם :)`,
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
    build: (name: string) => `היי ${name}, איך מתקדם? רציתי לשמוע ממך :)`,
  },
];
