import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#28A745',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          height: 60 + insets.bottom,      // dynamically add bottom safe area height
          paddingBottom: insets.bottom,   // avoid overlap with home gesture bar
          paddingTop: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'index') {
            iconName = 'home';
          } else if (route.name === 'settings') {
            iconName = 'settings';
          } else {
            iconName = 'ellipse'; // fallback icon
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
