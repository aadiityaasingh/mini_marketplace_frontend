export const CATEGORIES = [
  { value: "books", label: "Books & Notes", icon: "📚", color: "indigo" },
  { value: "electronics", label: "Electronics & Gadgets", icon: "💻", color: "blue" },
  { value: "hostel-essentials", label: "Hostel Essentials", icon: "🛏️", color: "amber" },
  { value: "cycles", label: "Cycles & Mobility", icon: "🚲", color: "emerald" },
  { value: "stationery", label: "Stationery & Supplies", icon: "📐", color: "teal" },
  { value: "lab-equipment", label: "Lab Equipment", icon: "🔬", color: "purple" },
  { value: "clothing", label: "Clothing & Merch", icon: "👕", color: "rose" },
  { value: "furniture", label: "Furniture & Storage", icon: "🛋️", color: "orange" },
  { value: "sports", label: "Sports & Fitness", icon: "⚽", color: "green" },
  { value: "other", label: "Other Essentials", icon: "📦", color: "slate" },
];

export const CAMPUS_LOCATIONS = [
  "Hostel Block A",
  "Hostel Block B",
  "Hostel Block C",
  "Girls Hostel",
  "Academic Block 1",
  "Academic Block 2",
  "Central Library",
  "Student Center / Mess",
  "Sports Complex",
  "Off-Campus / Day Scholar",
];

export const CONDITIONS = [
  { value: "new", label: "Brand New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good Condition" },
  { value: "fair", label: "Fair / Usable" },
];

export const LISTING_TYPES = [
  { value: "sale", label: "Buy (Sale)" },
  { value: "rent", label: "Rent" },
  { value: "exchange", label: "Exchange" },
  { value: "donation", label: "Free / Donation" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "✨ Newest First" },
  { value: "price_asc", label: "🏷️ Price: Low to High" },
  { value: "price_desc", label: "💎 Price: High to Low" },
  { value: "popular", label: "🔥 Most Viewed / Popular" },
  { value: "oldest", label: "🕒 Oldest First" },
  { value: "title_asc", label: "🔤 Alphabetical (A-Z)" },
];

export const PRICE_PRESETS = [
  { label: "All Prices", min: "", max: "" },
  { label: "Under ₹250", min: "", max: "250" },
  { label: "₹250 - ₹1,000", min: "250", max: "1000" },
  { label: "₹1,000 - ₹3,000", min: "1000", max: "3000" },
  { label: "₹3,000+", min: "3000", max: "" },
  { label: "Free / Donation Only", min: "0", max: "0" },
];
