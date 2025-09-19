import AsyncStorage from '@react-native-async-storage/async-storage'; // For local storage of auth token and user id
import { useRouter } from "expo-router"; // For navigation and routing
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements'; // UI icons
import { SafeAreaView } from 'react-native-safe-area-context'; // Handles safe area for iOS devices
import { Recipe } from "../model/Types"; // Custom type for Recipe

const API_BASE_URL = 'https://recipesserver-production-fcda.up.railway.app';

export default function HomeScreen() {
  const router = useRouter(); // Router for navigation
  // State variables for managing UI and data
  const [search, setSearch] = useState(''); // Search text input
  const [recipes, setRecipes] = useState<Recipe[]>([]); // All loaded recipes
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]); // Recipes filtered by search
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Selected category filter
  const [isSearching, setIsSearching] = useState(false); // Flag if user is searching
  const [loading, setLoading] = useState(true); // Loading indicator flag
  const [error, setError] = useState<string | null>(null); // Error message, if any
  const [authChecked, setAuthChecked] = useState(false); // Whether auth token is verified

  // Pagination states (currently unused, but defined)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const pageSize = 3; // Number of recipes per page (for pagination)

  // List of categories for filtering recipes
  const categories = [
    'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert',
    'Vegan', 'Vegetarian', 'Gluten-Free', 'Keto',
    'Dairy-Free', 'Nut-Free', 'Paleo', 'Quick & Easy'
  ];

  // Effect hook to run on component mount or when selectedCategory changes
  // Responsible for checking authentication and fetching data accordingly
  useEffect(() => {
    const loadData = async () => {
      try {
        // Retrieve auth token from AsyncStorage
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          // If no token, redirect to login screen
          router.replace('../auth/login');
          return;
        }

        setAuthChecked(true); // Mark auth checked successful
        if (selectedCategory) {
          // Fetch recipes filtered by category
          await fetchRecipesByCategory(selectedCategory); 
        } else {
          // Fetch all recipes if no category filter selected
          await fetchAllRecipes();
        }
      } catch (err) {
        // If error occurs (e.g., token invalid), clear token and redirect to login
        console.error('Initialization error:', err);
        await AsyncStorage.removeItem('authToken');
        router.replace('../auth/login');
      }
    };

    loadData();
  }, [selectedCategory]);

  // Effect hook to handle live search filtering whenever search text or recipes change
  useEffect(() => {
    if (search.trim() === '') {
      // If search input is empty, reset search state and filtered recipes
      setIsSearching(false);
      setFilteredRecipes([]);
      return;
    }

    setIsSearching(true);
    // Filter recipes by matching title or any ingredient to the search text
    const filtered = recipes.filter(recipe =>
      recipe.recipe.title.toLowerCase().includes(search.toLowerCase()) ||
      recipe.recipe.ingredients.some(ingredient =>
        ingredient.toLowerCase().includes(search.toLowerCase())
      )
    );
    setFilteredRecipes(filtered);
  }, [search, recipes]);

  // Function to fetch all recipes from the API
  const fetchAllRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get auth token and user id for authenticated request
      const token = await AsyncStorage.getItem('authToken');
      const user_id = await AsyncStorage.getItem('user_id');
      console.log(user_id);
      // Fetch all recipes
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': `${user_id}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, clear token and redirect to login
          await AsyncStorage.removeItem('authToken');
          router.replace('../auth/login');
          return;
        }
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      // Update state with fetched recipes
      setRecipes(data.recipes || data);
    } catch (err) {
      // Handle fetch errors and set error message
      console.error('Fetch error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to load recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch recipes filtered by a selected category
  const fetchRecipesByCategory = async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('authToken');

      // Fetch recipes filtered by mealType query param
      const response = await fetch(
        `${API_BASE_URL}/recipes?mealType=${category}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('authToken');
          router.replace('../auth/login');
          return;
        }
        throw new Error('Failed to fetch category recipes');
      }

      const data = await response.json();
      console.log(data.recipes);
      setRecipes(data.recipes);
    } catch (err) {
      // Handle fetch errors for category filtering
      console.error('Category fetch error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to filter recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear category filter by resetting selectedCategory
  const clearFilter = () => setSelectedCategory(null);
  // Navigate to recipe generation screen
  const navigateToGenerate = () => router.push("../generate-recipe");
  // Decide which recipes to display based on search or not
  const displayRecipes = isSearching ? filteredRecipes : recipes;

  // Show loading spinner if auth is not checked or data is loading with no recipes yet
  if (!authChecked || (loading && recipes.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28A745" />
        </View>
      </SafeAreaView>
    );
  }

  // Function to share a recipe via native share dialog
  const shareRecipe = async (recipe: Recipe) => {
    try {
      const { title, ingredients, instructions } = recipe.recipe;

      // Format the text to share
      const textToShare = 
        `🍽️ Recipe: ${title}\n\n` +
        `📝 Ingredients:\n${ingredients.join('\n')}\n\n` +
        `👩‍🍳 Instructions:\n${instructions}`;

      // Show the native share dialog
      const result = await Share.share({
        message: textToShare,
        title: title,
      });

      // Optionally handle share result
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with specific activity type
        } else {
          // Shared successfully without activity type
        }
      } else if (result.action === Share.dismissedAction) {
        // Share dismissed by user
      }
    } catch (error) {
      // Show alert if share fails
      console.error('Error sharing recipe:', error);
      Alert.alert('Error', 'Unable to share the recipe at this time.');
    }
  };

  // If an error occurred, display error message with retry button
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#28A745" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={selectedCategory ? 
              () => fetchRecipesByCategory(selectedCategory) : 
              fetchAllRecipes
            } 
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main UI render for the Home screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header bar with account and add buttons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/manage_account')}>
            <Icon name="person" type="material" color="#fff" size={28} />
          </TouchableOpacity>
          <Text style={styles.title}>CookUp</Text>
          <TouchableOpacity onPress={navigateToGenerate} style={styles.iconButton}>
            <Icon name="add-circle-outline" type="material" color="#fff" size={28} />
          </TouchableOpacity>
        </View>

        {/* Search input with clear button */}
        <View style={styles.searchContainer}>
          <Icon name="search" type="material" color="#777" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for recipes..."
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" type="material" color="#777" size={20} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter list (hidden during search) */}
        {!isSearching && (
          <>
            <Text style={[styles.sectionTitle, { marginLeft: 15, marginBottom: 10 }]}>Categories</Text>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.categoriesContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryItem, selectedCategory === item && styles.categoryItemSelected]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text style={styles.categoryText}>{item}</Text>
                </TouchableOpacity>
              )}/>
          </>
        )}

        {/* Section header with title and clear filter option */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isSearching
              ? filteredRecipes.length > 0 ? 'Search Results' : 'No Results Found'
              : selectedCategory ? `${selectedCategory} Recipes` : 'Recommended for You'}
          </Text>
          {selectedCategory && !isSearching && (
            <TouchableOpacity onPress={clearFilter}>
              <Text style={styles.clearFilter}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recipe list or fallback no recipes found message */}
        {displayRecipes.length > 0 ? (
          <View style={styles.recipesListContainer}>
            {displayRecipes.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.recipeCard}
                onPress={() => router.push({
                  pathname: `../recipe-details`,
                  params: { id: item._id }
                })}
              >
                {/* Display recipe image if available, else placeholder */}
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
                ) : (
                  <View style={styles.noImageContainer}>
                    <Text style={styles.noImageText}>No Image</Text>
                  </View>
                )}
                <View style={styles.recipeInfo}>
                  <View style={styles.recipeTitleContainer}>
                    <Text style={styles.recipeTitle}>{item.recipe.title}</Text>
                    {/* Share button for the recipe */}
                    <TouchableOpacity onPress={() => shareRecipe(item)} style={styles.shareButton}>
                      <Icon name="share" type="material" color="#28A745" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.noRecipesFound}>No recipes found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  recipeInfo: {
    padding: 15,
  },
  shareButton: {
    alignItems: 'center',
  },  
  recipeTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconButton: {
    marginLeft: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 10,
    margin: 15,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#d3d3d3',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: 'black',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28A745',
  },
  clearFilter: {
    fontSize: 16,
    color: '#28A745',
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  categoryItem: {
    backgroundColor: '#e0f2e9',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryItemSelected: {
    backgroundColor: '#28A745',
  },
  categoryText: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: 'bold',
  },
  recipeCard: {
    backgroundColor: '#f5f5f5',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  recipeImage: {
    height: 180,
    width: '100%',
  },
  noImageContainer: {
    height: 180,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 18,
    color: '#666',
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  recipesListContainer: {
    marginBottom: 20,
  },
  noRecipesFound: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 50,
    color: '#666',
  }
});
