import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE_URL = 'https://recipesserver-production-fcda.up.railway.app';

// Hide the header on this screen
export const options = {
  headerShown: false,
};

export default function ManageAccount() {
  // Profile state for holding user info
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    dietaryPreference: '',
    allergies: '',
    skillLevel: '',
    status: ''
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const router = useRouter();

  // Fetch user profile from backend
  const getUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  // Interface for profile updates
  interface ProfileData {
    dietaryPreference?: string;
    allergies?: string;
    skillLevel?: string;
  }

  // Update profile on backend
  const updateUserProfile = async (profileData: ProfileData) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error('Failed to update user profile');
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Account action types
  type AccountAction = 'activate' | 'deactivate' | 'delete';

  // Perform account status update or delete
  const performAccountAction = async (action: AccountAction) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      let endpoint = '';
      let method = 'POST';

      // Set API endpoint and method based on action
      switch (action) {
        case 'activate':
          endpoint = '/auth/activate';
          break;
        case 'deactivate':
          endpoint = '/auth/deactivate';
          break;
        case 'delete':
          endpoint = '/auth';
          method = 'DELETE';
          break;
        default:
          throw new Error('Invalid account action');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error(`Failed to ${action} account`);

      if (action === 'delete') {
        // Remove auth token and navigate to login screen
        await AsyncStorage.removeItem('authToken');
        router.replace('../auth/login');
      } else {
        // Refresh profile after action
        const updatedProfile = await getUserProfile();
        setProfile(updatedProfile);
        Alert.alert("Success", `Account ${action}d successfully`);
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch {
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Submit updated profile to backend
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateUserProfile({
        dietaryPreference: profile.dietaryPreference,
        allergies: profile.allergies,
        skillLevel: profile.skillLevel,
      });
      Alert.alert("Updated", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.push("/(tabs)") },
      ]);
    } catch {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle activation status of account
  const handleStatusChange = () => {
    const action = profile.status === 'active' ? 'deactivate' : 'activate';
    Alert.alert(
      "Confirm",
      `Are you sure you want to ${action} your account?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => performAccountAction(action) }
      ]
    );
  };

  // Confirm before deleting the account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => performAccountAction('delete') }
      ]
    );
  };

  // Show loading spinner while fetching profile
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }
  
  // Main UI rendering
  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Account</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Display non-editable name and email */}
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile.name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile.email}</Text>
        </View>

        {/* Editable dietary preference and allergies */}
        <View style={styles.card}>
          <Text style={styles.label}>Dietary Preference</Text>
          <TextInput
            value={profile.dietaryPreference}
            onChangeText={(text) => setProfile({ ...profile, dietaryPreference: text })}
            style={styles.input}
            editable={!isUpdating}
          />

          <Text style={styles.label}>Allergies</Text>
          <TextInput
            value={profile.allergies}
            onChangeText={(text) => setProfile({ ...profile, allergies: text })}
            style={styles.input}
            editable={!isUpdating}
          />
        </View>

        {/* Show current account status and toggle button */}
        <View style={styles.statusContainer}>
          <Text style={styles.label}>Account Status: </Text>
          <Text style={styles.statusText}>{profile.status}</Text>
          <TouchableOpacity
            style={[styles.statusButton, profile.status === 'active' ? styles.deactivateButton : styles.activateButton]}
            onPress={handleStatusChange}
            disabled={isUpdating || isLoading}
          >
            <Text style={styles.statusButtonText}>
              {profile.status === 'active' ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Update button */}
        <TouchableOpacity
          style={[styles.button, (isUpdating || isLoading) && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={isUpdating || isLoading}
        >
          {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Profile</Text>}
        </TouchableOpacity>

        {/* Delete account button */}
        <TouchableOpacity
          style={[styles.deleteButton, (isUpdating || isLoading) && styles.buttonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isUpdating || isLoading}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        {/* Navigate back to home */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          disabled={isUpdating || isLoading}
        >
          <Text style={styles.link}>Return to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  statusContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  statusText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
    flex: 1
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
  header: {
    height: 64,
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
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#dc3545',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderColor: '#dc3545',
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButtonText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 25,
    color: '#007BFF',
    textAlign: 'center',
    fontSize: 16,
  }
});
