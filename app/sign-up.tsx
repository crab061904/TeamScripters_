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
import { signUp } from "../src/services/authService";
import { useAuth } from "../src/context/AuthContext";
import { router } from "expo-router";

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    sex: "M" as "M" | "F" | "Non-Binary",
    barangay: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  const { user } = useAuth();

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      router.replace("/(tabs)/account");
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Basic info validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Birth date validation
    if (!formData.birthDate.trim()) {
      newErrors.birthDate = "Birth date is required";
    }

    // Barangay validation
    if (!formData.barangay.trim()) {
      newErrors.barangay = "Barangay is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const tier1Data = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim() || undefined,
        birthDate: formData.birthDate.trim(),
        sex: formData.sex,
        barangay: formData.barangay.trim(),
      };

      await signUp(formData.email.trim(), formData.password, tier1Data);

      Alert.alert(
        "Registration Successful!",
        "Your account has been created. Please check your email for verification.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/sign-in"),
          },
        ],
      );
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const InputField = ({
    label,
    field,
    placeholder,
    keyboardType = "default",
    secure = false,
    showToggle = false,
    showState = false,
    onToggle = () => {},
    multiline = false,
  }: {
    label: string;
    field: string;
    placeholder: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
    secure?: boolean;
    showToggle?: boolean;
    showState?: boolean;
    onToggle?: () => void;
    multiline?: boolean;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-poppins-semibold text-[#3B1C6D] dark:text-white mb-2">
        {label}
      </Text>
      <View className={`relative ${errors[field] ? "mb-1" : ""}`}>
        <View
          className={`flex-row items-center bg-white dark:bg-[#2D2A33] rounded-xl border ${
            errors[field]
              ? "border-red-300 dark:border-red-600"
              : "border-gray-200 dark:border-gray-700"
          } px-4`}
        >
          <TextInput
            className={`flex-1 ml-3 py-4 text-[#101828] dark:text-white font-poppins-reg ${
              multiline ? "h-24" : ""
            }`}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={formData[field as keyof typeof formData]}
            onChangeText={(text) => updateFormData(field, text)}
            keyboardType={keyboardType}
            secureTextEntry={secure && !showState}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            multiline={multiline}
          />
          {showToggle && (
            <TouchableOpacity
              onPress={onToggle}
              disabled={isLoading}
              className="p-2"
            >
              <Ionicons
                name={showState ? "eye-off" : "eye"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[field] && (
          <Text className="text-xs font-poppins-reg text-red-600 dark:text-red-400 mt-1">
            {errors[field]}
          </Text>
        )}
      </View>
    </View>
  );

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
                <Ionicons name="person-add" size={40} color="#3B1C6D" />
              </View>
              <Text className="text-2xl font-poppins-bold text-white mb-2">
                Create Account
              </Text>
              <Text className="text-white/90 text-sm font-poppins-reg text-center">
                Join MyNaga City Services today
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

            {/* Personal Information Section */}
            <View className="mb-6">
              <Text className="text-lg font-poppins-bold text-[#3B1C6D] dark:text-white mb-4">
                Personal Information
              </Text>

              <InputField
                label="First Name"
                field="firstName"
                placeholder="Enter your first name"
              />

              <InputField
                label="Last Name"
                field="lastName"
                placeholder="Enter your last name"
              />

              <InputField
                label="Middle Name (Optional)"
                field="middleName"
                placeholder="Enter your middle name"
              />

              <InputField
                label="Email Address"
                field="email"
                placeholder="Enter your email"
                keyboardType="email-address"
              />

              <InputField
                label="Password"
                field="password"
                placeholder="Create a password (min 8 characters)"
                secure={true}
                showToggle={true}
                showState={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />

              <InputField
                label="Confirm Password"
                field="confirmPassword"
                placeholder="Confirm your password"
                secure={true}
                showToggle={true}
                showState={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <InputField
                label="Birth Date"
                field="birthDate"
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />

              {/* Gender Selection */}
              <View className="mb-4">
                <Text className="text-sm font-poppins-semibold text-[#3B1C6D] dark:text-white mb-2">
                  Sex
                </Text>
                <View className="flex-row gap-3">
                  {["M", "F", "Non-Binary"].map((sex) => (
                    <TouchableOpacity
                      key={sex}
                      onPress={() => updateFormData("sex", sex)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                        formData.sex === sex
                          ? "border-[#FF4500] bg-[#FF4500]/10"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2A33]"
                      }`}
                      disabled={isLoading}
                    >
                      <Text
                        className={`text-center font-poppins-medium ${
                          formData.sex === sex
                            ? "text-[#FF4500]"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {sex}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <InputField
                label="Barangay"
                field="barangay"
                placeholder="Enter your barangay"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-gray-600 dark:text-gray-400 font-poppins-reg text-sm">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/sign-in")}
                disabled={isLoading}
              >
                <Text className="text-[#FF4500] dark:text-[#FF6B35] font-poppins-semibold text-sm">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
