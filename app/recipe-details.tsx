import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Recipe } from './model/Types';

const API_BASE_URL = 'http://192.168.1.108:5000';

export default function RecipeDetails() {
  const router = useRouter(); 
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
      const user_id = await AsyncStorage.getItem('user_id');

      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': `${user_id}`
        }
      });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }

        const data = await response.json();
        console.log(data.recipe.recipe.nutrition);
        setRecipe(data.recipe);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          // Handle cases where the error isn't an Error object
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
     
      fetchRecipe();
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28A745" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
        </View>
      </SafeAreaView>
    );
  }

   const generateRecipeVideo = async () => {
    try {
      if (!recipe) return;
      
      setGeneratingVideo(true);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate video');
      }
    } finally {
      setGeneratingVideo(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView>

                {videoUrl ? (
          <View style={styles.videoContainer}>
            {/* Replace with your preferred video player component */}
            <Image 
              source={{ uri: videoUrl }} 
              style={styles.videoPlaceholder}
              resizeMode="cover"
            />
            <Text style={styles.videoCaption}>Recipe Video</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateRecipeVideo}
            disabled={generatingVideo}
          >
            {generatingVideo ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>
                <Icon name="videocam" type="material" color="#fff" /> 
                Generate Video
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Existing Recipe Content */}
        {recipe.imageUrl && !videoUrl && (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        )}


        <View style={styles.content}>
          <Text style={styles.title}>{recipe.recipe.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Icon name="restaurant" type="material" size={20} color="#666" />
              <Text style={styles.metaText}>{recipe.mealType}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="local-fire-department" type="material" size={20} color="#666" />
              <Text style={styles.metaText}>{recipe.recipe.nutrition.calories} calories</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.recipe.ingredients.map((item, index) => (
              <Text key={index} style={styles.ingredient}>
                • {item}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.recipe.instructions.map((item, index) => (
              <View key={index} style={styles.instructionStep}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.recipe.nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.recipe.nutrition.protein}</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.recipe.nutrition.carbohydrates}</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.recipe.nutrition.fat}</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
               <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.recipe.nutrition.fiber}</Text>
                <Text style={styles.nutritionLabel}>Fiber</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 250,
  },
  noImage: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
    videoContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
  },
  videoCaption: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
  generateButton: {
    backgroundColor: '#28A745',
    padding: 15,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});