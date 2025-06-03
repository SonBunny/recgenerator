import { Recipe } from './Types';

// Define your route parameters
export type RootStackParamList = {
  '(tabs)': undefined;
  '+not-found': undefined;
  'generate-recipe': undefined;
  'recipe-details': {
    recipe: Recipe;
    imageUrl?: string;
    isNew: boolean;
  };
};

// Helper type for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}