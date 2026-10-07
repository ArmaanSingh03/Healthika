// LOGIC layer: pure functions, no DOM. Never returns NaN/Infinity (returns null / NaN-guarded).
const ACT = [['Sedentary', 1.2], ['Lightly active', 1.375], ['Moderately active', 1.55], ['Very active', 1.725], ['Extra active', 1.9]];
const ok = (v) => typeof v === 'number' && isFinite(v);

// food.n is per 100 g/ml; grams = amount actually eaten (g or ml).
function calculateNutrition(food, grams) {
  if (!food || !ok(grams) || grams <= 0 || grams > HEALTHIKA_CONFIG.maxGrams) return null;
  const f = grams / 100, out = {};
  NUT.forEach(([k]) => out[k] = (food.n[k] || 0) * f);
  return out;
}
const calculateCalories = (food, g) => (calculateNutrition(food, g) || {}).kcal ?? null;
const calculateMacros = (food, g) => { const n = calculateNutrition(food, g); return n && { protein: n.protein, carbs: n.carbs, fat: n.fat }; };
const calculateMicros = (food, g) => { const n = calculateNutrition(food, g); if (!n) return null; ['kcal', 'protein', 'carbs', 'fat'].forEach(k => delete n[k]); return n; };

// Mifflin-St Jeor. sex: 'm' | 'f'
const calculateBMR = (sex, kg, cm, age) => 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);
const calculateTDEE = (bmr, factor) => bmr * factor;

// ₹/g protein = price / (servings × protein per serving)
function calculateProteinCost(p) {
  const total = p.servings * p.protein, perG = p.price / total;
  return { total, perG: ok(perG) ? perG : NaN, per100: p.price / p.packSize * 100, pct: p.protein / p.servingSize * 100 };
}
function calculateCreatineCost(p) {
  const total = p.servings * p.creatine, perG = p.price / total;
  return { total, perG: ok(perG) ? perG : NaN, perServing: p.price / p.servings, per100: p.price / p.packSize * 100 };
}
