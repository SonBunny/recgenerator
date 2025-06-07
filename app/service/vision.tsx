import axios from 'axios';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.apiKey; 
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

interface FoodDetectionResult {
  name: string;
  confidence: number;
  isGeneric: boolean;
  
}

export const detectSpecificFood = async (imageUri: string) => {
  console.log('[VISION SERVICE] Starting food detection for image:', imageUri);
  
  try {
    console.log('[VISION SERVICE] Converting image to base64...');
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const base64data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
          console.log('[VISION SERVICE] Image converted to base64 successfully');
          resolve(base64String);
        } else {
          console.error('[VISION SERVICE] Failed to convert image to base64');
          reject(new Error('Failed to convert image'));
        }
      };
      reader.onerror = () => {
        console.error('[VISION SERVICE] Error reading image data');
        reject(new Error('Failed to read image'));
      };
      reader.readAsDataURL(blob);
    });

    console.log('[VISION SERVICE] Preparing API request...');
    const requestData = {
      requests: [{
        image: { content: base64data },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'WEB_DETECTION', maxResults: 5 }
        ],
      }],
    };

    console.log('[VISION SERVICE] Sending request to Cloud Vision API...');
    const apiResponse = await axios.post(VISION_API_URL, requestData);
    console.log('[VISION SERVICE] Received API response:', apiResponse.data);
    
    const results = processVisionResults(apiResponse.data);
    console.log('[VISION SERVICE] Processed results:', results);
    
    return results;
  } catch (error) {
    console.error('[VISION SERVICE] Error in detectSpecificFood:', error);
    if (axios.isAxiosError(error)) {
      console.error('[VISION SERVICE] API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });
    }
    throw error;
  }
};

const processVisionResults = (data: any): FoodDetectionResult[] => {
  const results: FoodDetectionResult[] = [];
  const genericFoodTerms = new Set(['food', 'dish', 'cuisine', 'meal', 'cooking']);

  // Process label annotations
  if (data.responses?.[0]?.labelAnnotations) {
    for (const annotation of data.responses[0].labelAnnotations) {
      if (annotation.score > 0.7) { // Only accept confident results
        const lowerDesc = annotation.description.toLowerCase();
        results.push({
          name: annotation.description,
          confidence: annotation.score,
          isGeneric: genericFoodTerms.has(lowerDesc)
        });
      }
    }
  }

  // Process web detection entities (often more specific)
  if (data.responses?.[0]?.webDetection?.webEntities) {
    for (const entity of data.responses[0].webDetection.webEntities) {
      if (entity.score > 0.7 && entity.description) {
        const lowerDesc = entity.description.toLowerCase();
        if (!genericFoodTerms.has(lowerDesc)) {
          results.push({
            name: entity.description,
            confidence: entity.score,
            isGeneric: false
          });
        }
      }
    }
  }

  // Sort by confidence and filter out generic terms
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .filter(item => !item.isGeneric)
    .slice(0, 5); // Return top 5 specific results
};