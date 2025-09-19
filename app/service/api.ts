import axios from 'axios';
import { Recipe } from '../model/Types';

const API_BASE_URL = 'https://recipesserver-production-fcda.up.railway.app'; // Replace with your actual API URL

export const generateRecipe = async (data: {
  mealType: string;
  ingredients: string[];
  allergies: string[];
  diet: string[];
  nutrition: string[];
  regenerate: boolean;
}): Promise<{
  recipe: Recipe;
  imageUrl?: string;
  source: 'database' | 'openai';
  isNew: boolean;
}> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/recipes/generate`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
