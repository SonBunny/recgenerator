import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { Recipe } from './model/Types';
import { detectSpecificFood } from './service/vision';

const API_BASE_URL = 'http://192.168.1.108:5000/recipes';

export default function GenerateRecipeScreen() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [mealType, setMealType] = useState<string>('Dinner'); // Default meal type
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);

  // Add typed ingredient
  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.toLowerCase()]);
      setNewIngredient('');
    }
  };

  // Scan ingredients using camera
  const scanIngredients = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[CAMERA] Error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  // Analyze the captured image
  const analyzeImage = async (imageUri: string) => {
    setScanLoading(true);
    setImage(imageUri);
    
    try {
      const detectedFoods = await detectSpecificFood(imageUri);
      const newIngredients = detectedFoods
        .filter(food => food.confidence > 0.5)
        .map(food => food.name.toLowerCase());
      
      setIngredients(prev => [...new Set([...prev, ...newIngredients])]); // Remove duplicates
      
      if (newIngredients.length === 0) {
        Alert.alert('No ingredients detected', 'We couldn\'t identify any ingredients in the photo. Please try again or add manually.');
      }
    } catch (error) {
      console.error('[ERROR] Image analysis failed:', error);
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
    } finally {
      setScanLoading(false);
    }
  };

  // Generate recipe with additional parameters
  const generateRecipe = async () => {
    if (ingredients.length === 0) return;
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const user_id = await AsyncStorage.getItem('user_id');
      
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user_id || ''
        },
        body: JSON.stringify({ 
          ingredients,
          mealType,
          dietaryPreferences
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Recipe = await response.json();
      console.log(data.recipe);
      // Navigate with the complete recipe data
      router.push({
        pathname: '/recipe-details',
        params: {
          id: data._id
        }
      });
      
    } catch (error) {
      console.error('Generation failed:', error);
      Alert.alert('Error', 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove an ingredient
  const removeIngredient = (indexToRemove: number) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  // Toggle dietary preference
  const toggleDietaryPreference = (preference: string) => {
    setDietaryPreferences(prev => 
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Create New Recipe</Text>
      
      {/* Meal Type Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Meal Type:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
            <Button
              key={type}
              title={type}
              onPress={() => setMealType(type)}
              color={mealType === type ? '#007AFF' : '#ccc'}
            />
          ))}
        </View>
      </View>

      {/* Dietary Preferences */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Dietary Preferences:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'].map(pref => (
            <Button
              key={pref}
              title={pref}
              onPress={() => toggleDietaryPreference(pref)}
              color={dietaryPreferences.includes(pref) ? '#007AFF' : '#ccc'}
            />
          ))}
        </View>
      </View>

      {/* Ingredients Section */}
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Ingredients:</Text>
      
      {/* Manual input */}
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TextInput
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: '#ccc', 
            borderRadius: 4, 
            padding: 8,
            marginRight: 8
          }}
          placeholder="Type ingredient"
          value={newIngredient}
          onChangeText={setNewIngredient}
          onSubmitEditing={addIngredient}
        />
        <Button title="Add" onPress={addIngredient} />
      </View>
      
      {/* Scan option */}
      <View style={{ marginBottom: 16 }}>
        <Button 
          title="Scan Ingredients" 
          onPress={scanIngredients}
          disabled={scanLoading}
        />
      </View>
      
      {/* Display captured image if available */}
      {image && (
        <View style={{ marginBottom: 16 }}>
          <Image 
            source={{ uri: image }} 
            style={{ width: '100%', height: 200, borderRadius: 8 }} 
          />
        </View>
      )}
      
      {/* Loading indicator for scanning */}
      {scanLoading && (
        <View style={{ marginBottom: 16 }}>
          <ActivityIndicator size="large" />
          <Text style={{ textAlign: 'center' }}>Detecting ingredients...</Text>
        </View>
      )}
      
      {/* Current ingredients */}
      {ingredients.length === 0 ? (
        <Text style={{ color: '#888', marginBottom: 16 }}>No ingredients added yet</Text>
      ) : (
        <View style={{ marginBottom: 16 }}>
          {ingredients.map((item, index) => (
            <View 
              key={index} 
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                marginBottom: 8
              }}
            >
              <Text>{item}</Text>
              <Button 
                title="Remove" 
                onPress={() => removeIngredient(index)}
                color="red"
              />
            </View>
          ))}
        </View>
      )}
      
      {/* Generate button */}
      <Button 
        title={loading ? "Generating Recipe..." : "Generate Recipe"} 
        onPress={generateRecipe}
        disabled={loading || scanLoading || ingredients.length === 0}
      />
    </ScrollView>
  );
}