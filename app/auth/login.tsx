import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

const API_BASE_URL = 'http://192.168.1.108:5000/auth'; // Direct to auth service

export default function LoginScreen() {  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleLogin = async () => {
    console.log(email);
    console.log(password);
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
    
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth token
      await AsyncStorage.setItem('authToken', data.token);
      
      // Optional: Store user data if needed
      if (data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      }
       await AsyncStorage.setItem('user_id', JSON.stringify(data.user.id));

      console.log('Login successful');
      router.replace("/(tabs)");
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        "Error", 
        error instanceof Error ? error.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !email || !password || isLoading;
  const buttonStyle = isButtonDisabled
    ? styles.buttonDisabled
    : colorScheme === 'dark'
    ? styles.buttonDark
    : styles.buttonLight;

  return (
    <View style={colorScheme === 'dark' ? styles.containerDark : styles.containerLight}>
      <Text style={[styles.title, colorScheme === 'dark' ? styles.textDark : styles.textLight]}>CookUp!</Text>
      
      <TextInput
        style={colorScheme === 'dark' ? styles.inputDark : styles.inputLight}
        placeholder="Email"
        placeholderTextColor={colorScheme === 'dark' ? 'white' : 'black'}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      <TextInput
        style={colorScheme === 'dark' ? styles.inputDark : styles.inputLight}
        placeholder="Password"
        placeholderTextColor={colorScheme === 'dark' ? 'white' : 'black'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity
        style={buttonStyle}
        onPress={handleLogin}
        disabled={isButtonDisabled}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => router.push("./signup")} 
        style={styles.signUpLink}
        disabled={isLoading}
      >
        <Text style={styles.signUpText}>Don't have an account? Sign Up!</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  containerLight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  containerDark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 20,
  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    marginBottom: 20,
  },
  textLight: {
    color: "lightgreen",
  },
  textDark: {
    color: "darkgreen",
  },
  inputLight: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputDark: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#555",
  },
  buttonLight: {
    width: "100%",
    height: 50,
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  buttonDark: {
    width: "100%",
    height: 50,
    backgroundColor: "darkgreen",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  buttonDisabled: {
    width: "100%",
    height: 50,
    backgroundColor: "grey",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signUpLink: {
    marginTop: 15,
  },
  signUpText: {
    color: "#007bff",
    fontSize: 16,
  },
});