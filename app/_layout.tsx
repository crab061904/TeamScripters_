// app/_layout.tsx
import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity, Text } from "react-native";
import "react-native-reanimated";
import "./../global.css";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useColorScheme } from "nativewind";
import { AuthProvider } from "../src/context/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load fonts and track status
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="sign-in"
            options={{
              title: "Sign In",
              headerStyle: {
                backgroundColor: colorScheme === "dark" ? "#1E1D23" : "#FFFFFF",
              },
              headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#3B1C6D",
              headerTitleStyle: {
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
              },
              headerBackTitleStyle: {
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
              },
            }}
          />
          <Stack.Screen
            name="sign-up"
            options={{
              title: "Sign Up",
              headerStyle: {
                backgroundColor: colorScheme === "dark" ? "#1E1D23" : "#FFFFFF",
              },
              headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#3B1C6D",
              headerTitleStyle: {
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
              },
              headerBackTitleStyle: {
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
              },
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              title: "Notifications",
              headerStyle: {
                backgroundColor: colorScheme === "dark" ? "#1E1D23" : "#FFFFFF",
              },
              headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#3B1C6D",
              headerTitleStyle: {
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
              },
              headerBackTitleStyle: {
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
              },
              headerRight: () => (
                <TouchableOpacity onPress={() => {}}>
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 14,
                      color: colorScheme === "dark" ? "#818CF8" : "#6366F1",
                    }}
                  >
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        {/* Set status bar icons to dark for visibility on light backgrounds */}
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </AuthProvider>
  );
}
