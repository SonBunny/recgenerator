export type Nutrition = {
  calories: string;
  carbohydrates: string;
  protein: string;
  fat: string;
  fiber: string;
};

export type Recipe = {
  _id: string;
  mealType: string;
  allergies: string[];
  diet: string[];
  recipe: {
    title: string;
    ingredients: string[];
    instructions: string[];
    nutrition: Nutrition;
  };
  imageUrl?: string;
  createdAt: string;
};

export type FoodDetectionResult = {
  name: string;
  confidence: number;
  isGeneric: boolean;
};

export type GenerateRecipeScreenParams = {
  generatedRecipe?: Recipe;
  imageUrl?: string;
  isNew?: boolean;
};