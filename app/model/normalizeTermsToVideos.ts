type Recipe = {
  title: string;
  ingredients: string[];
  instructions: string[];
  nutrition: Record<string, string>;
};

const stockVideos = [
  "Baked (potato)",
  "Baking Powder",
  "Beatings eggs and sugar",
  "Bell pepper sticks",
  "Boiled Egg",
  "Butter",
  "Carrot (sticks",
  "Cherry Tomatoes",
  "Chicken Wings",
  "Chili Powder",
  "Chopped (mushroom)",
  "chopping (vegetables)",
  "Cooking (Rice)",
  "Cooking Oil",
  "Cubed (Avocado)",
  "Cubed (Cheese)",
  "Cubed (Potatoes)",
  "Cubed (Salmon)",
  "Deep Fry (Fries)",
  "Diced (Bell Pepper)",
  "Diced (Carrot)",
  "Diced (Tomato)",
  "Dustin (Flower)",
  "Eggs",
  "Fillet (Salmon)",
  "Flaked (Salmon)",
  "Flipping (Pancakes)",
  "Flour",
  "Folding Mixture",
  "Frying (Onions and Mushrooms)",
  "Garlic",
  "Grated (Cheese)",
  "Ground (Beef)",
  "Ground (Chicken)",
  "Julienne (Carrots)",
  "Mashed (Avocado)",
  "Mashed (Potatoes)",
  "Mince",
  "Minced (Onion)",
  "Mincing Herbs",
  "Onion",
  "Roasted (onion and garlic)",
  "Salt",
  "Sauteed Spinach",
  "Separating Egg Yolk",
  "Shaved (Bell Pepper)",
  "Shaved (Carrot)",
  "Sliced (Cheese)",
  "Sliced (Lemon)",
  "Sliced (Potatoes)",
  "Sliced (Tomato)",
  "Slicing (Avocado)",
  "Spinach",
  "Steaks (Salmon)",
  "Stew Meat (Beef)",
  "Stir Fry (Vegetables)",
  "Thin Slices (Beef)",
  "Whisking",
  "Zested Lemon",
  "Whisking Vegetables",
  "Blending",
  "Frying Onion and Garlic",
  "Kneading Dough",
  "Marinating",
  "Measuring",
  "Peeling vegetables green",
  "Peeling vegetables red",
  "Simmering",
  "Whisking Dry Ingredients Baking",
  "Grilling vegetables",
  "Grilling meat",
  "Boiling water"
];

// A thorough mapping from freeform terms to normalized stock video names
const normalizationMap: Record<string, string> = {
  // 🥬 Leafy Greens
  "lettuce": "Spinach",
  "kale": "Spinach",
  "mesclun": "Spinach",
  "arugula": "Spinach",
  "bok choy": "Spinach",
  "cabbage": "Spinach",
  "leafy greens": "Spinach",
  "green salad": "Spinach",

  // 🧅 Alliums and Aromatics
  "onion": "Onion",
  "red onion": "Onion",
  "white onion": "Onion",
  "minced onion": "Minced (Onion)",
  "garlic": "Garlic",
  "roasted garlic": "Roasted (onion and garlic)",
  "fried onions": "Frying (Onions and Mushrooms)",
  "frying garlic": "Frying Onion and Garlic",
  "shallots": "Onion",

  // 🍅 Tomatoes
  "tomatoes": "Cherry Tomatoes",
  "cherry tomato": "Cherry Tomatoes",
  "diced tomato": "Diced (Tomato)",
  "sliced tomato": "Sliced (Tomato)",

  // 🥕 Root Vegetables
  "carrot sticks": "Carrot (sticks)",
  "julienned carrot": "Julienne (Carrots)",
  "shaved carrot": "Shaved (Carrot)",
  "diced carrot": "Diced (Carrot)",
  "potato": "Cubed (Potatoes)",
  "boiled potato": "Cubed (Potatoes)",
  "sliced potato": "Sliced (Potatoes)",
  "mashed potato": "Mashed (Potatoes)",
  "sweet potato": "Cubed (Potatoes)",

  // 🧀 Cheese
  "cheese": "Cubed (Cheese)",
  "sliced cheese": "Sliced (Cheese)",
  "grated cheese": "Grated (Cheese)",

  // 🥑 Avocados
  "avocado": "Cubed (Avocado)",
  "sliced avocado": "Slicing (Avocado)",
  "mashed avocado": "Mashed (Avocado)",

  // 🥭 Fruits
  "mango": "Diced (Tomato)",
  "apple": "Diced (Tomato)",
  "grapes": "Cherry Tomatoes",

  // 🥩 Proteins
  "chicken breast": "Grilling meat",
  "grilled chicken": "Grilling meat",
  "grilled beef": "Grilling meat",
  "grilled pork": "Grilling meat",
  "beef steak": "Grilling meat",
  "thin beef": "Thin Slices (Beef)",
  "beef stew": "Stew Meat (Beef)",
  "chicken wings": "Chicken Wings",
  "ground beef": "Ground (Beef)",
  "ground chicken": "Ground (Chicken)",

  // 🐟 Salmon
  "salmon fillet": "Fillet (Salmon)",
  "flaked salmon": "Flaked (Salmon)",
  "cubed salmon": "Cubed (Salmon)",
  "salmon steak": "Steaks (Salmon)",

  // 🍳 Eggs
  "egg": "Eggs",
  "boiled egg": "Boiled Egg",
  "egg yolk": "Separating Egg Yolk",
  "scrambled egg": "Whisking",
  "whisked egg": "Beatings eggs and sugar",

  // 🍚 Cooking Methods
  "boil": "Boiling water",
  "boiling water": "Boiling water",
  "frying": "Frying Onion and Garlic",
  "deep frying": "Deep Fry (Fries)",
  "grilling meat": "Grilling meat",
  "grilling vegetables": "Grilling vegetables",
  "stir fry": "Stir Fry (Vegetables)",
  "sautéed spinach": "Sauteed Spinach",
  "cooking rice": "Cooking (Rice)",
  "simmering": "Simmering",

  // 🥣 Mixing/Prep
  "whisking": "Whisking",
  "whisk dry ingredients": "Whisking Dry Ingredients Baking",
  "whisk vegetables": "Whisking Vegetables",
  "mixing": "Whisking Dry Ingredients Baking", // Changed from Folding Mixture
  "kneading dough": "Kneading Dough",
  "flipping pancakes": "Flipping (Pancakes)",

  // 🌾 Baking/Dry Ingredients
  
  "dry ingredients": "Whisking Dry Ingredients Baking",
  "combine flour": "Whisking Dry Ingredients Baking",
  "combine dry ingredients": "Whisking Dry Ingredients Baking",
  "mix flour": "Whisking Dry Ingredients Baking",
  "mix flour and sugar": "Whisking Dry Ingredients Baking",
  "whisk flour": "Whisking Dry Ingredients Baking",
  "whisk flour and baking powder": "Whisking Dry Ingredients Baking",
  "combine flour and sugar": "Whisking Dry Ingredients Baking",
  "mix dry ingredients": "Whisking Dry Ingredients Baking",

  // 🥄 Wet Mix
  "whisk egg and milk": "Beatings eggs and sugar",
  "whisk together egg and milk": "Beatings eggs and sugar",
  "whisk wet ingredients": "Beatings eggs and sugar",
  "mix wet ingredients": "Beatings eggs and sugar",

  // 🍳 Batter Cooking
  "pour batter": "Flipping (Pancakes)",
  "cook pancakes": "Flipping (Pancakes)",
  "flip pancakes": "Flipping (Pancakes)",
  "heat skillet": "Flipping (Pancakes)",
  "grease skillet": "Butter",

  // 🧂 Spices/Herbs
  "salt": "Salt",
  "pepper": "Chili Powder",
  "zest lemon": "Zested Lemon",
  "zest lime": "Zested Lemon",
  "sliced lemon": "Sliced (Lemon)",
  "flour": "Flour",
  "dust with flour": "Dustin (Flower)",
  "measuring ingredients": "Measuring",
  "marinating": "Marinating",
  "blending": "Blending",
  "mincing herbs": "Mincing Herbs",
  "chopping vegetables": "chopping (vegetables)",

  // 🧈 Fats/Oils
  "butter": "Butter",
  "grease with butter": "Butter",
  "lightly grease": "Butter",
  "cooking oil": "Cooking Oil",

  // 🥦 Vegetables
  "bell pepper": "Bell pepper sticks",
  "diced bell pepper": "Diced (Bell Pepper)",
  "shaved bell pepper": "Shaved (Bell Pepper)",
  "mushroom": "Chopped (mushroom)",
  "peeling vegetables": "Peeling vegetables green"
};


// The normalization function
// Accepts any array of terms (ingredients or instructions)
export function normalizeTermsToVideos(terms: string[]): string[] {
  const text = terms.join(" ").toLowerCase();
  const allMatches = new Set<string>();

  // First pass - collect all matches
  for (const [key, stockTerm] of Object.entries(normalizationMap)) {
    if (text.includes(key) && stockVideos.includes(stockTerm)) {
      allMatches.add(stockTerm);
    }
  }

  // Define preparation/cooking techniques that should go last
  const techniqueVideos = [
    "Whisking", "Whisking Dry Ingredients Baking", "Kneading Dough",
    "Frying Onion and Garlic", "Grilling meat", "Grilling vegetables",
    "Boiling water", "Simmering", "Stir Fry (Vegetables)", "Deep Fry (Fries)",
    "Marinating", "Measuring", "Peeling vegetables green", "Peeling vegetables red",
    "Blending", "Mincing Herbs", "chopping (vegetables)", "Flipping (Pancakes)",
    "Whisking Vegetables", "Beatings eggs and sugar", "Folding Mixture",
    "Separating Egg Yolk", "Sauteed Spinach", "Cooking (Rice)", "Roasted (onion and garlic)"
  ];

  // Split into ingredients and techniques
  const ingredients = Array.from(allMatches).filter(
    term => !techniqueVideos.includes(term)
  );
  const techniques = Array.from(allMatches).filter(
    term => techniqueVideos.includes(term)
  );

  // Return ingredients first, then techniques
  return [...ingredients, ...techniques];
}
