import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function SignUpScreen(){
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [allergies, setAllergies] = useState("");

  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch('https://recipesserver-production.up.railway.app/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          dietaryPreference,
          allergies: allergies.split(',').map(a => a.trim()), // Convert comma-separated string to array
          status: 'active' // Default status
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      Alert.alert("Success", "Account created successfully!");
      router.push("./login");
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert("Registration Error", error.message);
    }
  };

  const containerStyle = colorScheme === "dark" ? styles.containerDark : styles.containerLight;
  const textStyle = colorScheme === "dark" ? styles.textDark : styles.textLight;
  const inputStyle = colorScheme === "dark" ? styles.inputDark : styles.inputLight;
  const buttonStyle = colorScheme === "dark" ? styles.buttonDark : styles.buttonLight;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={containerStyle}>
        <Text style={[styles.title, textStyle]}>Sign Up!</Text>

        <TextInput
          style={inputStyle}
          placeholder="Full Name"
          placeholderTextColor={colorScheme === "dark" ? "white" : "black"}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={inputStyle}
          placeholder="Email"
          placeholderTextColor={colorScheme === "dark" ? "white" : "black"}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={inputStyle}
          placeholder="Password"
          placeholderTextColor={colorScheme === "dark" ? "white" : "black"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={inputStyle}
          placeholder="Confirm Password"
          placeholderTextColor={colorScheme === "dark" ? "white" : "black"}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TextInput
          style={inputStyle}
          placeholder="Dietary Preference (e.g., Vegetarian)"
          placeholderTextColor={colorScheme === "dark" ? "white" : "black"}
          value={dietaryPreference}
          onChangeText={setDietaryPreference}
        />

        <TextInput
          style={inputStyle}
          placeholder="Allergies (comma separated, e.g., peanuts, shellfish)"
          placeholderTextColor={colorScheme === "dark" ? "white" : "black"}
          value={allergies}
          onChangeText={setAllergies}
        />

        <TouchableOpacity style={buttonStyle} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("./login")} 
          style={styles.signUpLink}
        >
          <Text style={styles.signUpText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Keep your existing styles
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

