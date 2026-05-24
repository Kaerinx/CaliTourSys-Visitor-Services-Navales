import type { ProductCardData } from "./components/ui-kit";

export const products: ProductCardData[] = [
  { id: "pili-candy", name: "Pili Nut Brittle (Glazed)", producer: "Aling Marta's Kitchen", price: "₱ 250.00", category: "Sweets", accent: "#B5451B", accredited: true },
  { id: "abaca-mat", name: "Hand-woven Abaca Place Mat", producer: "Quipayo Weavers Coop", price: "₱ 480.00", category: "Crafts", accent: "#7B341E", accredited: true },
  { id: "bagoong", name: "Calabanga Fermented Bagoong", producer: "San Miguel Bay Fishers", price: "₱ 180.00", category: "Pantry", accent: "#1B4332", accredited: true },
  { id: "coco-jam", name: "Slow-cooked Latik Coco Jam", producer: "Sabang Farm", price: "₱ 220.00", category: "Sweets", accent: "#D4711B", accredited: true },
  { id: "pottery", name: "Belen Terra-cotta Water Pot", producer: "Belen Pottery Studio", price: "₱ 950.00", category: "Crafts", accent: "#7B341E", accredited: true },
  { id: "honey", name: "Wild Forest Honey 500ml", producer: "Mt. Isarog Apiary", price: "₱ 380.00", category: "Pantry", accent: "#D4AC0D", accredited: true },
  { id: "abaca-bag", name: "Woven Abaca Market Bag", producer: "Quipayo Weavers Coop", price: "₱ 620.00", category: "Crafts", accent: "#2D6A4F", accredited: false },
  { id: "tablea", name: "Pure Tablea Chocolate Discs", producer: "Cagsao Cacao", price: "₱ 290.00", category: "Sweets", accent: "#5C3318", accredited: true },
  { id: "calamansi", name: "Cold-Pressed Calamansi Juice", producer: "Sabang Farm", price: "₱ 160.00", category: "Pantry", accent: "#D4AC0D", accredited: true },
];

export const events = [
  { id: "pili-fest", title: "Pili Festival 2026", day: "24", month: "MAY", location: "Calabanga Town Plaza", category: "Festival", accent: "#B5451B", desc: "A week-long celebration of the pili nut harvest with parades, cooking competitions, and live cultural performances along the plaza." },
  { id: "regatta", title: "San Miguel Bay Regatta", day: "08", month: "JUN", location: "Sabang Beach Front", category: "Sports", accent: "#1565C0", desc: "Traditional outrigger boats race across the bay at sunrise — a centuries-old tradition of our fishing barangays." },
  { id: "art-walk", title: "Quipayo Heritage Art Walk", day: "15", month: "JUN", location: "Quipayo Old Stone Church", category: "Culture", accent: "#7B341E", desc: "Walking tour of murals, weaving demos, and the 18th-century Quipayo church bell tower." },
  { id: "harvest", title: "Rice Harvest Thanksgiving", day: "02", month: "JUL", location: "Belen Barangay Rice Fields", category: "Culture", accent: "#1B7A4A", desc: "Join farmers in the planting season ritual followed by a community feast in the rice paddies of Belen." },
];

export const locations = [
  { id: "sabang", name: "Sabang Beach", category: "Beach", color: "#1565C0", distance: "4.2 km", x: 28, y: 38, rating: 4.7 },
  { id: "quipayo", name: "Quipayo Old Church", category: "Cultural", color: "#7B341E", distance: "2.1 km", x: 55, y: 30, rating: 4.9 },
  { id: "belen", name: "Belen Pottery Village", category: "Cultural", color: "#7B341E", distance: "6.8 km", x: 70, y: 60, rating: 4.6 },
  { id: "isarog", name: "Mt. Isarog Foothills", category: "Nature", color: "#1B7A4A", distance: "9.4 km", x: 80, y: 22, rating: 4.8 },
  { id: "market", name: "Calabanga Public Market", category: "Food", color: "#B5451B", distance: "0.6 km", x: 42, y: 70, rating: 4.4 },
  { id: "river", name: "Bicol River Boardwalk", category: "Nature", color: "#1B7A4A", distance: "1.3 km", x: 20, y: 65, rating: 4.5 },
];

export const artifacts = [
  { id: "burnay", name: "Burnay Earthen Jar", era: "Pre-colonial · 14th c.", accent: "#7B341E", desc: "Coil-built clay vessel used for storing fermented fish paste across coastal barangays." },
  { id: "bell", name: "Quipayo Church Bell", era: "Spanish era · 1792", accent: "#5C3318", desc: "Bronze bell cast in Manila and gifted to the Quipayo parish; bears the seal of the Franciscan order." },
  { id: "abaca", name: "Ceremonial Abaca Cloth", era: "Pre-colonial", accent: "#D4711B", desc: "Hand-woven sinamay textile used in pre-Hispanic burial and rite-of-passage ceremonies." },
  { id: "fishing", name: "Outrigger Bow Carving", era: "Late 1800s", accent: "#1B4332", desc: "Carved hardwood prow from a San Miguel Bay banca, decorated with protective sea spirits." },
  { id: "coin", name: "Bicol Trade Currency", era: "16th–17th c.", accent: "#D4AC0D", desc: "Silver tael fragments recovered from a galleon trade route shipwreck off Sabang Point." },
  { id: "mask", name: "Harvest Festival Mask", era: "Early 1900s", accent: "#B5451B", desc: "Carved wooden mask used by farmers in the annual rice harvest thanksgiving ritual." },
];
