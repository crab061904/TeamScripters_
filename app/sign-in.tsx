import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { signIn } from "../src/services/authService";
import { useAuth } from "../src/context/AuthContext";
import { router } from "expo-router";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { user } = useAuth();

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      router.replace("/(tabs)/account");
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signIn(email.trim(), password);
      // Navigation will be handled by the useEffect that watches user state
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field: "email" | "password") => {
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-100/30 dark:bg-[#1E1D23]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow"
        >
          {/* Header */}
          <View className="bg-[#FF4500] dark:bg-[#C23500] pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
            <View className="items-center">
              <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg">
                <Ionicons name="person" size={40} color="#3B1C6D" />
              </View>
              <Text className="text-2xl font-poppins-bold text-white mb-2">
                Welcome Back
              </Text>
              <Text className="text-white/90 text-sm font-poppins-reg text-center">
                Sign in to access your Naga City Services
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="px-6 pt-8 pb-6">
            {/* General Error */}
            {errors.general && (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text className="ml-3 text-sm font-poppins-medium text-red-700 dark:text-red-400 flex-1">
                    {errors.general}
                  </Text>
                </View>
              </View>
            )}

            {/* Email Input */}
            <View className="mb-6">
              <Text className="text-sm font-poppins-semibold text-[#3B1C6D] dark:text-white mb-2">
                Email Address
              </Text>
              <View className={`relative ${errors.email ? "mb-1" : "mb-4"}`}>
                <View
                  className={`flex-row items-center bg-white dark:bg-[#2D2A33] rounded-xl border ${
                    errors.email
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-200 dark:border-gray-700"
                  } px-4`}
                >
                  <Ionicons
                    name="mail"
                    size={20}
                    color={errors.email ? "#EF4444" : "#9CA3AF"}
                  />
                  <TextInput
                    className="flex-1 ml-3 py-4 text-[#101828] dark:text-white font-poppins-reg"
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearError("email");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email && (
                  <Text className="text-xs font-poppins-reg text-red-600 dark:text-red-400 mt-1">
                    {errors.email}
                  </Text>
                )}
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-sm font-poppins-semibold text-[#3B1C6D] dark:text-white mb-2">
                Password
              </Text>
              <View className={`relative ${errors.password ? "mb-1" : "mb-4"}`}>
                <View
                  className={`flex-row items-center bg-white dark:bg-[#2D2A33] rounded-xl border ${
                    errors.password
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-200 dark:border-gray-700"
                  } px-4`}
                >
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={errors.password ? "#EF4444" : "#9CA3AF"}
                  />
                  <TextInput
                    className="flex-1 ml-3 py-4 text-[#101828] dark:text-white font-poppins-reg"
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearError("password");
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="p-2"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text className="text-xs font-poppins-reg text-red-600 dark:text-red-400 mt-1">
                    {errors.password}
                  </Text>
                )}
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
              className={`bg-[#FF4500] dark:bg-[#C23500] rounded-xl py-4 items-center shadow-lg ${
                isLoading ? "opacity-70" : ""
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-poppins-bold text-base">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <View className="items-center mt-6">
              <TouchableOpacity
                onPress={() => {
                  // TODO: Implement forgot password
                  Alert.alert(
                    "Coming Soon",
                    "Forgot password functionality will be available soon.",
                  );
                }}
                disabled={isLoading}
              >
                <Text className="text-[#FF4500] dark:text-[#FF6B35] font-poppins-medium text-sm">
                  Forgot your password?
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View className="flex-1 justify-end px-6 pb-8">
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-600 dark:text-gray-400 font-poppins-reg text-sm">
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // TODO: Navigate to sign-up when implemented
                  Alert.alert(
                    "Coming Soon",
                    "Sign up functionality will be available soon.",
                  );
                }}
                disabled={isLoading}
              >
                <Text className="text-[#FF4500] dark:text-[#FF6B35] font-poppins-semibold text-sm">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
