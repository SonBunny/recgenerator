import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { detectSpecificFood } from './service/vision';

export default function TabOneScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [foodResults, setFoodResults] = useState<FoodDetectionResult[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    console.log('[UI] Pick image button pressed');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      console.log('[IMAGE PICKER] Image selected from library:', result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    } else {
      console.log('[IMAGE PICKER] User canceled image selection');
    }
  };

const takePhoto = async () => {
  console.log('[UI] Take photo button pressed');
  
  // Request camera permissions
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission required',
      'Sorry, we need camera permissions to make this work!'
    );
    return;
  }

  try {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      console.log('[CAMERA] Photo taken:', result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    } else {
      console.log('[CAMERA] User canceled photo capture');
    }
  } catch (error) {
    console.error('[CAMERA] Error:', error);
    Alert.alert('Error', 'Failed to open camera');
  }
};

  const analyzeImage = async (imageUri: string) => {
    console.log('[ANALYSIS] Starting image analysis for:', imageUri);
    setLoading(true);
    setImage(imageUri);
    setFoodResults([]);
    
    try {
      console.log('[API] Calling detectSpecificFood...');
      const detectedFoods = await detectSpecificFood(imageUri);
      console.log('[API] Received response:', detectedFoods);
      
      setFoodResults(detectedFoods);
      console.log('[STATE] Updated foodResults:', detectedFoods);
      
      if (detectedFoods.length === 0) {
        console.warn('[ANALYSIS] No specific foods detected in the image');
      } else {
        console.log('[ANALYSIS] Detected foods:', 
          detectedFoods.map(f => `${f.name} (${(f.confidence * 100).toFixed(1)}%)`).join(', '));
      }
    } catch (error) {
      console.error('[ERROR] Image analysis failed:', error);
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
    } finally {
      console.log('[ANALYSIS] Analysis completed');
      setLoading(false);
    }
  };

  // Render method remains the same
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Recognition</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Pick Image" onPress={pickImage} />
        <View style={{ width: 10 }} />
        <Button title="Take Photo" onPress={takePhoto} />
      </View>
      
      {image && <Image source={{ uri: image }} style={styles.image} />}
      
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.subtitle}>Detected Foods:</Text>
        
        {foodResults.length > 0 ? (
          foodResults.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.confidence}>
                Confidence: {(food.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noResults}>
            {image && !loading ? 'No specific foods detected' : 'Select or take a photo to begin'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  foodItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  noResults: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

interface FoodDetectionResult {
  name: string;
  confidence: number;
  isGeneric: boolean;
}