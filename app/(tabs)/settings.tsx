import { Ionicons } from '@expo/vector-icons'; // Chevron icon
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'https://recipesserver-production.up.railway.app';

export default function SettingsScreen() {
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await AsyncStorage.multiRemove(['authToken', 'userData', 'user_id']);
              router.replace('/auth/login');

              if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear cached data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('cachedRecipes');
              Alert.alert('Success', 'Cache cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const RowItem = ({
    title,
    onPress,
    rightElement,
  }: {
    title: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={styles.rowItem}
    >
      <Text style={styles.rowTitle}>{title}</Text>
      {rightElement || (onPress ? <Ionicons name="chevron-forward" size={20} color="#999" /> : null)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} /> {/* Spacer to balance layout */}
      </View>


      <View style={styles.section}>
        <SectionHeader title="Preferences" />
        <View style={styles.rowItem}>
          <Text style={styles.rowTitle}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#ccc', true: '#4cd964' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.rowTitle}>Dark Theme</Text>
          <Switch
            value={isDarkTheme}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: '#4cd964' }}
            thumbColor={isDarkTheme ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <RowItem title="Profile" onPress={() => router.push('/manage_account')} />
        <RowItem title="Clear Cache" onPress={clearCache} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="About" />
        <RowItem
          title="Version"
          rightElement={<Text style={styles.versionText}>1.0.0</Text>}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efeff4',
  },
  header: {
    height: 65,
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },  
  section: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6d6d72',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f7f7f8',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rowTitle: {
    fontSize: 17,
    color: '#1c1c1e',
  },
  versionText: {
    color: '#8e8e93',
    fontSize: 17,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    margin: 20,
    marginTop: 40,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ff3b30',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});
