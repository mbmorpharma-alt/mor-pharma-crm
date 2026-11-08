export const STATUSES = ["חדש", "🔥 חם", "🌡️ פושר", "❄️ קר", "📵 ללא מענה", "⚙️ בטיפול", "✅ סגור", "🚫 לא רלוונטי"];

export const STATUS_COLORS: Record<string, string> = {
  "חדש": "bg-blue-100 text-blue-800",
  "🔥 חם": "bg-red-100 text-red-800",
  "🌡️ פושר": "bg-orange-100 text-orange-800",
  "❄️ קר": "bg-sky-100 text-sky-800",
  "📵 ללא מענה": "bg-gray-100 text-gray-800",
  "⚙️ בטיפול": "bg-yellow-100 text-yellow-800",
  "✅ סגור": "bg-green-100 text-green-800",
  "🚫 לא רלוונטי": "bg-neutral-200 text-neutral-700",
};

// Validated categorical palette (fixed hue order, one hex per status) for the
// status-breakdown chart on the dashboard — a different concern from the
// badge classes above, which just need to look OK next to Hebrew text.
export const STATUS_CHART_COLORS: Record<string, string> = {
  "חדש": "#2a78d6",
  "🔥 חם": "#eb6834",
  "🌡️ פושר": "#1baf7a",
  "❄️ קר": "#eda100",
  "📵 ללא מענה": "#e87ba4",
  "⚙️ בטיפול": "#008300",
  "✅ סגור": "#6250d6",
  "🚫 לא רלוונטי": "#e34948",
};
