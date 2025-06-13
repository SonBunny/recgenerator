import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const pageSize = 3; // Recipes per page

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

  // Share Function
  
  const shareRecipe = async (recipe: Recipe) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing is not available on your platform');
        return;
      }
  
      const { title, ingredients, instructions } = recipe.recipe;
      const imageUrl = recipe.imageUrl;
  
      let fileUri: string | undefined;

      if (imageUrl) {
        const downloadResumable = FileSystem.createDownloadResumable(
          imageUrl,
          FileSystem.documentDirectory + 'recipe.jpg'
        );

        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult || !downloadResult.uri) {
          throw new Error('Failed to download image for sharing.');
        }

        fileUri = downloadResult.uri;
      }

      if (!fileUri) {
        throw new Error('Image file URI is undefined');
      }

      // Now safe to share:
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share this recipe',
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
      Alert.alert('Error', 'Failed to share recipe');
    }
  };

  // Error state
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

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push('/manage_account')}>
          <Icon name="person" type="material" color="#fff" size={28} />
        </TouchableOpacity>
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
                  <TouchableOpacity onPress={() => shareRecipe(item)} style={styles.shareButton}>
                    <Icon name="share" type="material" color="#28A745" size={20} />
                  </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  shareButton: {
    marginTop: 5,
    alignSelf: 'flex-start',
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