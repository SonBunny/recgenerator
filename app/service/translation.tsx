import axios from 'axios';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.apiKey; // Add to your .env file
const TRANSLATE_API_URL = `https://translation.googleapis.com/language/translate/v2`;

interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

interface TranslationError {
  error: string;
  details?: any;
}

export const translateText = async (
  text: string,
  targetLanguage: string = 'es',
  sourceLanguage?: string
): Promise<TranslationResult | TranslationError> => {
  console.log('[TRANSLATION SERVICE] Starting translation:', { text, targetLanguage });

  try {
    const requestData = {
      q: text,
      target: targetLanguage,
      ...(sourceLanguage && { source: sourceLanguage }), // Optional source language
      format: 'text',
    };

    const params = new URLSearchParams();
    params.append('key', API_KEY!);

    console.log('[TRANSLATION SERVICE] Sending request to Google Translate API...');
    const response = await axios.post(`${TRANSLATE_API_URL}?${params.toString()}`, requestData, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[TRANSLATION SERVICE] Received response:', response.data);
    
    return {
      translatedText: response.data.data.translations[0].translatedText,
      detectedSourceLanguage: response.data.data.translations[0].detectedSourceLanguage,
    };
  } catch (error) {
    console.error('[TRANSLATION SERVICE] Translation error:', error);
    
    if (axios.isAxiosError(error)) {
      return {
        error: 'API Error',
        details: {
          status: error.response?.status,
          message: error.response?.data?.error?.message || 'Unknown error',
        },
      };
    }
    
    return { error: 'Unknown translation error' };
  }
};

// Helper function to get supported languages (optional)
export const getSupportedLanguages = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${TRANSLATE_API_URL}/languages?key=${API_KEY}`);
    return response.data.data.languages.map((lang: any) => lang.language);
  } catch (error) {
    console.error('[TRANSLATION SERVICE] Failed to fetch languages:', error);
    return [];
  }
};