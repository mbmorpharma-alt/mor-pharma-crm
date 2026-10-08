import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Phrasings that mean the same thing — differing only by gender (זכר/נקבה)
// or word order — collapsed into one canonical, gender-neutral suggestion.
const CANONICAL_GROUPS: { variants: string[]; canonical: string }[] = [
  { variants: ["בוצעה הזמנה", "ביצעה הזמנה"], canonical: "בוצעה הזמנה" },
  {
    variants: ["לא היה זמין", "לא הייתה זמינה", "לא זמין"],
    canonical: "לא היה/הייתה זמין/ה",
  },
  {
    variants: [
      "לא היה זמין נשלחה הודעה",
      "נשלחה הודעה לא היה זמין",
      "לא הייתה זמינה נשלחה הודעה",
    ],
    canonical: "לא היה/הייתה זמין/ה, נשלחה הודעה",
  },
  {
    variants: [
      "לקוחה פרטית לא רלוונטי",
      "לקוח פרטי לא רלוונטי",
      "פרטית לא רלוונטי",
      "לא רלוונטי לקוחה פרטית",
    ],
    canonical: "לקוח/ה פרטי/ת לא רלוונטי",
  },
  {
    variants: [
      "צריך הזמנה קטנה קיבל מחירון",
      "צריכה הזמנה קטנה קיבלה מחירון",
      "קיבלה מחירון צריכה הזמנה קטנה",
    ],
    canonical: "צריך/ה הזמנה קטנה קיבל/ה מחירון",
  },
  { variants: ["שלחה הודעה בטעות", "שלח הודעה בטעות"], canonical: "שלח/ה הודעה בטעות" },
  {
    variants: [
      "צריך הזמנה קטנה לא רלוונטי",
      "צריכה הזמנה קטנה לא רלוונטי",
      "לא רלוונטי צריכה הזמנה קטנה",
    ],
    canonical: "צריך/ה הזמנה קטנה לא רלוונטי",
  },
];

const variantToCanonical = new Map<string, string>();
for (const group of CANONICAL_GROUPS) {
  for (const variant of group.variants) variantToCanonical.set(variant, group.canonical);
}

export async function GET() {
  const rows = await prisma.$queryRaw<{ title: string; count: bigint }[]>`
    SELECT trim(title) as title, count(*) as count
    FROM "Task"
    WHERE trim(title) <> ''
    GROUP BY trim(title)
    ORDER BY count(*) DESC
    LIMIT 100
  `;

  const merged = new Map<string, number>();
  for (const row of rows) {
    const label = variantToCanonical.get(row.title) ?? row.title;
    merged.set(label, (merged.get(label) ?? 0) + Number(row.count));
  }

  const top15 = [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([title]) => title);

  return NextResponse.json(top15);
}
