import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Recipe } from "../model/Types";

const API_BASE_URL = 'https://recipesserver-production.up.railway.app';

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const categories = [
    'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert',
    'Vegan', 'Vegetarian', 'Gluten-Free', 'Keto',
    'Dairy-Free', 'Nut-Free', 'Paleo', 'Quick & Easy'
  ];

  // Authentication and initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.replace('../auth/login');
          return;
        }

        setAuthChecked(true);
        if (selectedCategory) {
          await fetchRecipesByCategory(selectedCategory);
        } else {
          await fetchAllRecipes();
        }
      } catch (err) {
        console.error('Initialization error:', err);
        await AsyncStorage.removeItem('authToken');
        router.replace('../auth/login');
      }
    };

    loadData();
  }, [selectedCategory]);

  // Search functionality
  useEffect(() => {
    if (search.trim() === '') {
      setIsSearching(false);
      setFilteredRecipes([]);
      return;
    }

    setIsSearching(true);
    const filtered = recipes.filter(recipe =>
      recipe.recipe.title.toLowerCase().includes(search.toLowerCase()) ||
      recipe.recipe.ingredients.some(ingredient =>
        ingredient.toLowerCase().includes(search.toLowerCase())
      )
    );
    setFilteredRecipes(filtered);
  }, [search, recipes]);

  const fetchAllRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      const user_id = await AsyncStorage.getItem('user_id');
      console.log(user_id);
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': `${user_id}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('authToken');
          router.replace('../auth/login');
          return;
        }
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      setRecipes(data.recipes || data);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to load recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipesByCategory = async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(
        `${API_BASE_URL}/recipes?mealType=${category.toLowerCase()}`, 
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
      setRecipes(data);
    } catch (err) {
      console.error('Category fetch error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to filter recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => setSelectedCategory(null);
  const navigateToGenerate = () => router.push("../generate-recipe");
  const displayRecipes = isSearching ? filteredRecipes : recipes;

  // Loading state
  if (!authChecked || (loading && recipes.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28A745" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
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

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>CookUp</Text>
          <TouchableOpacity onPress={navigateToGenerate} style={styles.iconButton}>
            <Icon name="add-circle-outline" type="material" color="#fff" size={28} />
          </TouchableOpacity>
        </View>

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

        {!isSearching && (
          <>
            <Text style={styles.sectionTitle}>Categories</Text>
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
              )}
            />
          </>
        )}

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
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
                ) : (
                  <View style={styles.noImageContainer}>
                    <Text style={styles.noImageText}>No Image</Text>
                  </View>
                )}
                <View style={styles.recipeInfoContainer}>
                  <Text style={styles.recipeTitle}>{item.recipe.title}</Text>
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

// Keep your existing StyleSheet

// ... (keep your existing StyleSheet)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
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
  },
  actionButton: {
    marginLeft: 10,
  },
  clearFilter: {
    color: '#28A745',
    fontWeight: '600',
    fontSize: 14,
  },
  recipesListContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: 'gray',
  },
  recipeInfoContainer: {
    padding: 15,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  noRecipesFound: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  categoryItem: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  categoryItemSelected: {
    backgroundColor: '#1e7e34',
  },
  categoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});