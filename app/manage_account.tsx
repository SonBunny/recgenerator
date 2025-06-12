import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


const API_BASE_URL = 'https://recipesserver-production.up.railway.app'; // Replace with your API base URL

export default function ManageAccountScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    dietaryPreference: '',
    allergies: '',
    skillLevel: '',
    status: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();


  // Fetch user profile
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
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data  = await response.json();

      console.log(data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  interface ProfileData {
  dietaryPreference?: string;
  allergies?: string;
  skillLevel?: string;
  // Add other optional fields that can be updated
}

  // Update user profile
  const updateUserProfile = async (profileData:ProfileData ) => {
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
      
      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };
type AccountAction = 'activate' | 'deactivate' | 'delete';
  // Account actions
  const performAccountAction = async (action: AccountAction) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      let endpoint = '';
      let method = 'POST';

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

      if (!response.ok) {
        throw new Error(`Failed to ${action} account`);
      }

      if (action === 'delete') {
        // Clear auth token and redirect to login
        await AsyncStorage.removeItem('authToken');
        router.replace('../auth/login');
      } else {
        // Refresh profile after activation/deactivation
        const updatedProfile = await getUserProfile();
        setProfile(updatedProfile);
        Alert.alert("Success", `Account ${action}d successfully`);
      }
    } catch (error) {
      if(error instanceof Error){
          Alert.alert("Error", error.message);
      } else{
        Alert.alert("Error is unknown");
      }
      
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await getUserProfile();

        setProfile(profileData);
      } catch (error) {
        Alert.alert("Error", "Failed to load profile.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Profile</Text>

      <Text style={styles.label}>Name</Text>
      <Text style={styles.value}>{profile.name}</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{profile.email}</Text>

      <Text style={styles.label}>Dietary Preference</Text>
      <TextInput 
        value={profile.dietaryPreference} 
        onChangeText={(text) => setProfile({...profile, dietaryPreference: text})} 
        style={styles.input} 
        editable={!isUpdating}
      />

      <Text style={styles.label}>Allergies</Text>
      <TextInput 
        value={profile.allergies} 
        onChangeText={(text) => setProfile({...profile, allergies: text})} 
        style={styles.input} 
        editable={!isUpdating}
      />



      <Text style={styles.label}>Account Status</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{profile.status}</Text>
        <TouchableOpacity 
          style={[
            styles.statusButton, 
            profile.status === 'active' ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={handleStatusChange}
          disabled={isUpdating || isLoading}
        >
          <Text style={styles.statusButtonText}>
            {profile.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, (isUpdating || isLoading) && styles.buttonDisabled]} 
        onPress={handleUpdate}
        disabled={isUpdating || isLoading}
      >
        {isUpdating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Profile</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.deleteButton, (isUpdating || isLoading) && styles.buttonDisabled]}
        onPress={handleDeleteAccount}
        disabled={isUpdating || isLoading}
      >
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push("/(tabs)")}
        disabled={isUpdating || isLoading}
      >
        <Text style={styles.link}>Return to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#fff', 
    flex: 1 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#28a745', 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    marginTop: 10, 
    color: '#555' 
  },
  value: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: '600', 
    marginBottom: 5 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginLeft: 10,
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dc3545',
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
    marginTop: 20, 
    color: '#007BFF', 
    textAlign: 'center' 
  },
});