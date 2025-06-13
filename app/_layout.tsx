import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  // Get current device color scheme (e.g. 'light' or 'dark')
  const colorScheme = useColorScheme();

  // Load custom font 
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), 
  });

  // If font is not yet loaded, render nothing (avoid rendering before fonts ready)
  if (!loaded) {
    return null;
  }

  return (
    // Provide theme context to navigation based on color scheme
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Stack navigator controlling app screens */}
      <Stack>
        {/* Main tabs screen - hides header */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Fallback not-found screen */}
        <Stack.Screen name="+not-found" />
        {/* Screen for recipe generation with custom title */}
        <Stack.Screen 
          name="generate-recipe" 
          options={{ title: 'Generate Recipe' }} 
        />
        {/* Screen showing recipe details with custom title */}
        <Stack.Screen 
          name="recipe-details" 
          options={{ title: 'Recipe Details' }} 
        />
      </Stack>
      {/* Controls the status bar style (light/dark/auto) */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
