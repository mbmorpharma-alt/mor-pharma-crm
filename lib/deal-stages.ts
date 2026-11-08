export const DEAL_STAGES = ["ליד", "מו\"מ", "הצעת מחיר", "סגור-נוצח", "סגור-הפסד"];

export const DEAL_STAGE_COLORS: Record<string, string> = {
  "ליד": "bg-blue-100 text-blue-800",
  "מו\"מ": "bg-yellow-100 text-yellow-800",
  "הצעת מחיר": "bg-orange-100 text-orange-800",
  "סגור-נוצח": "bg-green-100 text-green-800",
  "סגור-הפסד": "bg-red-100 text-red-800",
};

// Validated chart palette for the deals-by-stage donut (order matters — it's
// what clears the adjacent-pair accessibility checks, wrap-around included).
export const DEAL_STAGE_CHART_COLORS: Record<string, string> = {
  "ליד": "#2a78d6",
  "הצעת מחיר": "#eb6834",
  "סגור-נוצח": "#0ca30c",
  "מו\"מ": "#eda100",
  "סגור-הפסד": "#d03b3b",
};
