import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import DynamicVideoPlayer from './components/DynamicVideoPlayer';
import { normalizeTermsToVideos } from './model/normalizeTermsToVideos';
import { Recipe } from './model/Types';
import { getSupportedLanguages, translateText } from './service/translation';

const API_BASE_URL = 'https://recipesserver-production.up.railway.app';

export default function RecipeDetails() {
  const router = useRouter(); 
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null); // Store original recipe
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

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
        setRecipe(data.recipe);
        setOriginalRecipe(data.recipe); // Store original recipe
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    const loadLanguages = async () => {
      const supportedLanguages = await getSupportedLanguages();
      setLanguages(supportedLanguages);
    };

    if (id) {
      fetchRecipe();
      loadLanguages();
    }
  }, [id]);

  const translateRecipe = async (targetLanguage: string) => {
    if (!recipe) return;
    
    setIsTranslating(true);
    setCurrentLanguage(targetLanguage);

    try {
      // Translate title
      const titleResult = await translateText(recipe.recipe.title, targetLanguage);
      if ('error' in titleResult) throw new Error(titleResult.error);

      // Translate ingredients
      const ingredientsPromises = recipe.recipe.ingredients.map(
        item => translateText(item, targetLanguage)
      );
      const ingredientsResults = await Promise.all(ingredientsPromises);
      if (ingredientsResults.some(result => 'error' in result)) {
        throw new Error('Failed to translate some ingredients');
      }

      // Translate instructions
      const instructionsPromises = recipe.recipe.instructions.map(
        item => translateText(item, targetLanguage)
      );
      const instructionsResults = await Promise.all(instructionsPromises);
      if (instructionsResults.some(result => 'error' in result)) {
        throw new Error('Failed to translate some instructions');
      }

      // Update recipe with translations
      setRecipe({
        ...recipe,
        recipe: {
          ...recipe.recipe,
          title: 'translatedText' in titleResult ? titleResult.translatedText : recipe.recipe.title,
          ingredients: ingredientsResults.map(result => 
            'translatedText' in result ? result.translatedText : ''
          ),
          instructions: instructionsResults.map(result => 
            'translatedText' in result ? result.translatedText : ''
          )
        }
      });

    } catch (error) {
      console.error("Translation error:", error);
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsTranslating(false);
      setShowLanguageModal(false);
    }
  };

  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setCurrentLanguage('en');
    }
  };

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

// const generateRecipeVideo = async () => {
//   if (!recipe) return;
  
//   setGeneratingVideo(true);
//   setError(null);

//   try {
//     // Prepare form data for your POST request
//     const formData = new FormData();
//     formData.append('title', recipe.recipe.title);
//     formData.append('ingredients', recipe.recipe.ingredients.join(','));
//     formData.append('instructions', recipe.recipe.instructions.join(','));

//     const response = await fetch(`${API_BASE_URL}/generate-video`, {
//       method: 'POST',
//       body: formData,
//     });

//     if (!response.ok) {
//       const errText = await response.text();
//       throw new Error(`Video generation failed: ${errText}`);
//     }

//     const json = await response.json();

//     if (json.video_url) {
//       // Build full video URL (your backend returns relative path like /videos/spaghetti.mp4)
//       setVideoUrl(`${API_BASE_URL}${json.video_url}`);
//     } else {
//       throw new Error('No video URL returned from server');
//     }
//   } catch (err) {
//     if (err instanceof Error) {
//       setError(err.message);
//     } else {
//       setError('Failed to generate video');
//     }
//   } finally {
//     setGeneratingVideo(false);
//   }
// };


const generateRecipeVideo = async () => {
  setGeneratingVideo(true);
  setError(null);
  
  console.log("recipe");
  console.log(recipe.recipe);

  try {
    // Get instructions from recipe (no longer need ingredients)
    const rawInstructions = recipe.recipe.instructions || [];

    // Normalize instructions for video matching
    const normalizedInstructions = normalizeTermsToVideos(rawInstructions);

    // Prepare payload (now only needs title and instructions)
    const payload = {
      title: recipe.recipe.title,
      instructions: normalizedInstructions,
    };
    console.log(normalizedInstructions);
    const token = await AsyncStorage.getItem('authToken');
    const user_id = await AsyncStorage.getItem('user_id');
const baseUrl = "https://videogenerator-production.up.railway.app";
    const response = await fetch(`${baseUrl}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-user-id': user_id || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Try to get error details from response
      throw new Error(errorData.detail || 'Failed to generate video');
    }

    const data = await response.json();
    
    const videoPath = `${baseUrl}${data.video_url}`;
    console.log("Generated video URL:", videoPath);
    setVideoUrl(videoPath);

  } catch (err) {
    console.error("Video generation error:", err);
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unknown error occurred while generating video.');
    }
  } finally {
    setGeneratingVideo(false);
  }
};



  return (
    <SafeAreaView style={styles.container}>
          <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setShowLanguageModal(true)}
            style={styles.largeTranslateButton}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="translate" type="material" size={36} color="#28A745" />
              <Text style={styles.translateText}>Translate</Text>
            </View>
          </TouchableOpacity>
        {currentLanguage !== 'en' && (
          <TouchableOpacity onPress={resetToOriginal} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Original</Text>
          </TouchableOpacity>
        )}
      </View>
<Modal
  visible={showLanguageModal}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowLanguageModal(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* Wrapped in Text component */}
      <Text style={styles.modalTitle}>Select Language</Text>
      
      <ScrollView 
        style={styles.languageList}
        contentContainerStyle={styles.languageListContent}
      >
        {languages.map((lang) => (
          <Pressable
            key={lang}
            style={styles.languageButton}
            onPress={() => translateRecipe(lang)}
          >
            {/* Wrapped in Text component */}
            <Text style={styles.languageText}>
              {getLanguageName(lang)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      
      <Pressable
        style={styles.closeButton}
        onPress={() => setShowLanguageModal(false)}
      >
        {/* Wrapped in Text component */}
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>
    </View>
  </View>
</Modal>
       {isTranslating && (
        <View style={styles.translatingOverlay}>
          <ActivityIndicator size="large" color="#28A745" />
          <Text style={styles.translatingText}>Translating...</Text>
        </View>
      )}

      <ScrollView>

      {videoUrl ? (
        <DynamicVideoPlayer videoUrl={videoUrl} />
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

const getLanguageName = (code: string): string => {
  const languageNames: Record<string, string> = {
    ab: "Abkhaz",
    ace: "Acehnese",
    ach: "Acoli",
    af: "Afrikaans",
    ak: "Akan",
    alz: "Alur", // (Note: Rare, not in ISO 639-1/2/3)
    am: "Amharic",
    ar: "Arabic",
    as: "Assamese",
    awa: "Awadhi",
    ay: "Aymara",
    az: "Azerbaijani",
    ba: "Bashkir",
    ban: "Balinese",
    bbc: "Batak Toba",
    be: "Belarusian",
    bem: "Bemba",
    bew: "Betawi", // (Note: Rare, not in ISO 639-1/2/3)
    bg: "Bulgarian",
    bho: "Bhojpuri",
    bik: "Bikol",
    bm: "Bambara",
    bn: "Bengali",
    br: "Breton",
    bs: "Bosnian",
    bts: "Batak Simalungun",
    btx: "Batak Karo",
    bua: "Buriat",
    ca: "Catalan",
    ceb: "Cebuano",
    cgg: "Chiga",
    chm: "Mari",
    ckb: "Central Kurdish",
    cnh: "Hakha Chin",
    co: "Corsican",
    crh: "Crimean Tatar",
    crs: "Seychellois Creole",
    cs: "Czech",
    cv: "Chuvash",
    cy: "Welsh",
    da: "Danish",
    de: "German",
    din: "Dinka",
    doi: "Dogri",
    dov: "Dombe", // (Note: Rare, not in ISO 639-1/2/3)
    dv: "Dhivehi",
    dz: "Dzongkha",
    ee: "Ewe",
    el: "Greek",
    en: "English",
    eo: "Esperanto",
    es: "Spanish",
    et: "Estonian",
    eu: "Basque",
    fa: "Persian",
    ff: "Fulah",
    fi: "Finnish",
    fj: "Fijian",
    fr: "French",
    fy: "Western Frisian",
    ga: "Irish",
    gaa: "Ga",
    gd: "Scottish Gaelic",
    gl: "Galician",
    gn: "Guarani",
    gom: "Goan Konkani",
    gu: "Gujarati",
    ha: "Hausa",
    haw: "Hawaiian",
    he: "Hebrew",
    hi: "Hindi",
    hil: "Hiligaynon",
    hmn: "Hmong",
    hr: "Croatian",
    hrx: "Hunsrik",
    ht: "Haitian Creole",
    hu: "Hungarian",
    hy: "Armenian",
    id: "Indonesian",
    ig: "Igbo",
    ilo: "Iloko",
    is: "Icelandic",
    it: "Italian",
    iw: "Hebrew (older code, now 'he')",
    ja: "Japanese",
    jv: "Javanese",
    jw: "Javanese (older code, now 'jv')",
    ka: "Georgian",
    kk: "Kazakh",
    km: "Khmer",
    kn: "Kannada",
    ko: "Korean",
    kri: "Krio",
    ktu: "Kituba", // (Note: Rare, not in ISO 639-1/2/3)
    ku: "Kurdish",
    ky: "Kyrgyz",
    la: "Latin",
    lb: "Luxembourgish",
    lg: "Ganda",
    li: "Limburgish",
    lij: "Ligurian",
    lmo: "Lombard",
    ln: "Lingala",
    lo: "Lao",
    lt: "Lithuanian",
    ltg: "Latgalian",
    luo: "Luo",
    lus: "Mizo",
    lv: "Latvian",
    mai: "Maithili",
    mak: "Makasar",
    mg: "Malagasy",
    mi: "Maori",
    min: "Minangkabau",
    mk: "Macedonian",
    ml: "Malayalam",
    mn: "Mongolian",
    "mni-Mtei": "Meitei (Manipuri)", // Hyphen requires quotes
    mr: "Marathi",
    ms: "Malay",
    "ms-Arab": "Malay (Arabic script)", // Hyphen requires quotes
    mt: "Maltese",
    my: "Burmese",
    ne: "Nepali",
    new: "Newari",
    nl: "Dutch",
    no: "Norwegian",
    nr: "Southern Ndebele",
    nso: "Northern Sotho",
    nus: "Nuer",
    ny: "Chichewa",
    oc: "Occitan",
    om: "Oromo",
    or: "Odia",
    pa: "Punjabi",
    "pa-Arab": "Punjabi (Arabic script)", // Hyphen requires quotes
    pag: "Pangasinan",
    pam: "Pampanga",
    pap: "Papiamento",
    pl: "Polish",
    ps: "Pashto",
    pt: "Portuguese",
    qu: "Quechua",
    rn: "Rundi",
    ro: "Romanian",
    rom: "Romany",
    ru: "Russian",
    rw: "Kinyarwanda",
    sa: "Sanskrit",
    scn: "Sicilian",
    sd: "Sindhi",
    sg: "Sango",
    shn: "Shan",
    si: "Sinhala",
    sk: "Slovak",
    sl: "Slovenian",
    sm: "Samoan",
    sn: "Shona",
    so: "Somali",
    sq: "Albanian",
    sr: "Serbian",
    ss: "Swati",
    st: "Southern Sotho",
    su: "Sundanese",
    sv: "Swedish",
    sw: "Swahili",
    szl: "Silesian",
    ta: "Tamil",
    te: "Telugu",
    tet: "Tetum",
    tg: "Tajik",
    th: "Thai",
    ti: "Tigrinya",
    tk: "Turkmen",
    tl: "Filipino",
    tn: "Tswana",
    tr: "Turkish",
    ts: "Tsonga",
    tt: "Tatar",
    ug: "Uyghur",
    uk: "Ukrainian",
    ur: "Urdu",
    uz: "Uzbek",
    vi: "Vietnamese",
    xh: "Xhosa",
    yi: "Yiddish",
    yo: "Yoruba",
    yua: "Yucatec Maya",
    yue: "Cantonese",
    zh: "Chinese",
    "zh-CN": "Chinese (Simplified)", // Hyphen requires quotes
    "zh-TW": "Chinese (Traditional)", // Hyphen requires quotes
    zu: "Zulu"
  };
  return languageNames[code] || code;
};

const styles = StyleSheet.create({
videoContainer: {
  width: '100%',
  aspectRatio: 16 / 9,  // Ensures a 16:9 video player
  backgroundColor: '#000',  // Black background while loading
  alignItems: 'center',
  justifyContent: 'center',
},
video: {
  width: '100%',
  height: '100%',
  borderRadius: 10,
},
  videoCaption: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 8,
  },

  largeTranslateButton: {
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
},
translateText: {
  marginLeft: 8,
  fontSize: 16,
  color: '#28A745',
  fontWeight: '500',
},
   languageList: {
    maxHeight: '70%',
  },
  languageListContent: {
    paddingBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 15,
    paddingTop: 5,
  },
  resetButton: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  resetButtonText: {
    color: '#333',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#28A745',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  translatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  translatingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
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
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
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