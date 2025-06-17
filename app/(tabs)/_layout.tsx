import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // Show labels under icons in the tab bar
        tabBarShowLabel: true,

        // Color of the tab icon and label when the tab is active
        tabBarActiveTintColor: '#28A745', // green color

        // Color of the tab icon and label when the tab is inactive
        tabBarInactiveTintColor: 'gray',

        // Style the tab bar container
        tabBarStyle: {
          backgroundColor: '#fff', 
          borderTopWidth: 1,      
          borderTopColor: '#ddd',  
          height: 60 + insets.bottom,  
          paddingBottom: insets.bottom, // add padding at the bottom for safe area
          paddingTop: 5,          
        },

        // Function to render icon for each tab
        tabBarIcon: ({ color, size }) => {
    
          let iconName: keyof typeof Ionicons.glyphMap;

          // Set icon based on the route name
          if (route.name === 'index') {
            iconName = 'home'; // Home icon for the "index" tab
          } else if (route.name === 'settings') {
            iconName = 'settings'; // Settings icon for the "settings" tab
          } else {
            iconName = 'ellipse'; // Default fallback icon
          }

          // Render the Ionicon with the chosen name, size, and color
          return <Ionicons name={iconName} size={size} color={color} />;
        },

        // Hide the header on the top of each tab screen
        headerShown: false,
      })}
    >
      {/* Define the tab screens with names and titles */}
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
