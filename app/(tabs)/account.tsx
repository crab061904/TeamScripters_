import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontAwesome6, Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useColorScheme } from "nativewind";

export default function AccountScreen() {
  const { userProfile, user, isEmailVerified } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();

  const sections = [
    ...(userProfile
      ? [
          {
            title: "Account",
            items: [
              {
                icon: "person-outline",
                lib: Ionicons,
                label: "Edit Profile",
                href: "#",
              },
              {
                icon: "mail-outline",
                lib: Ionicons,
                label: isEmailVerified ? "Email Verified" : "Verify Email",
                href: "#",
              },
              {
                icon: "shield-checkmark-outline",
                lib: Ionicons,
                label: "Privacy & Security",
                href: "#",
              },
            ],
          },
        ]
      : []),
    {
      title: "Preferences",
      items: [
        {
          icon: "color-palette-outline",
          lib: Ionicons,
          label: "Appearance",
          href: "#",
        },
        {
          icon: "notifications-outline",
          lib: Ionicons,
          label: "Notifications",
          href: "#",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "facebook",
          lib: FontAwesome6,
          label: "Facebook",
          href: "#",
        },
        {
          icon: "youtube",
          lib: FontAwesome6,
          label: "YouTube",
          href: "#",
        },
        {
          icon: "x-twitter",
          lib: FontAwesome6,
          label: "X (formerly Twitter)",
          href: "#",
        },
        {
          icon: "globe",
          lib: FontAwesome6,
          label: "Naga Gov Website",
          href: "#",
        },
      ],
    },
    ...(userProfile
      ? [
          {
            title: "Actions",
            items: [
              {
                icon: "log-out-outline",
                lib: Ionicons,
                label: "Sign Out",
                href: "#",
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <SafeAreaProvider>
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="bg-white dark:bg-[#1E1D23]  relative flex-1"
        >
          <View className="relative overflow-hidden bg-[#FF4500] dark:bg-[#C23500] pt-20 pb-6 px-4  shadow-lg rounded-b-2xl">
            <View
              className="absolute -top-10 -left-10 w-[150%] h-[150%] opacity-10"
              style={{ transform: [{ rotate: "-15deg" }] }}
              pointerEvents="none"
            >
              <View className="flex-col gap-8">
                {Array.from({ length: 10 }).map((_, row) => (
                  <View key={row} className="flex-row gap-12">
                    {Array.from({ length: 6 }).map((_, col) => (
                      <Text
                        key={col}
                        className="text-4xl font-poppins-bold text-white tracking-tighter"
                      >
                        NA GA
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <View className="flex-row items-center gap-6 z-10 pb-6">
              {/* Avatar Container */}
              <View className="w-24 h-24 bg-white rounded-[24px] p-1 shadow-2xl items-center justify-center">
                <View className="w-full h-full bg-[#3B1C6D] rounded-[20px] items-center justify-center overflow-hidden">
                  {userProfile ? (
                    <Text className="text-white font-poppins-bold text-2xl">
                      {userProfile.firstName?.charAt(0)}
                      {userProfile.lastName?.charAt(0)}
                    </Text>
                  ) : (
                    <Ionicons
                      name="person"
                      size={40}
                      color="white"
                      style={{ transform: [{ translateY: 5 }] }}
                    />
                  )}
                </View>
              </View>

              <View className="flex-1 space-y-1">
                {userProfile ? (
                  <>
                    <Text className="text-xl font-poppins-bold text-white leading-tight">
                      {userProfile.firstName} {userProfile.lastName}
                    </Text>
                    <Text className="text-white/90 text-xs font-poppins-reg leading-snug">
                      {userProfile.email}
                    </Text>
                    <View className="flex-row items-center gap-2 pt-1">
                      <View
                        className={`px-2 py-1 rounded-full ${
                          isEmailVerified
                            ? "bg-green-500/20 border border-green-400"
                            : "bg-yellow-500/20 border border-yellow-400"
                        }`}
                      >
                        <Text
                          className={`text-xs font-poppins-medium ${
                            isEmailVerified
                              ? "text-green-300"
                              : "text-yellow-300"
                          }`}
                        >
                          {isEmailVerified ? "Verified" : "Email Not Verified"}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          userProfile.registrationStatus === "full"
                            ? "bg-blue-500/20 border border-blue-400"
                            : "bg-orange-500/20 border border-orange-400"
                        }`}
                      >
                        <Text
                          className={`text-xs font-poppins-medium ${
                            userProfile.registrationStatus === "full"
                              ? "text-blue-300"
                              : "text-orange-300"
                          }`}
                        >
                          {userProfile.registrationStatus === "full"
                            ? "Complete"
                            : "Partial Profile"}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="text-xl font-poppins-bold text-white leading-tight">
                      Get the Full Experience
                    </Text>
                    <Text className="text-white/90 text-xs font-poppins-reg leading-snug">
                      Sign in to access full features
                    </Text>
                    <View className="pt-2">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="bg-white px-6 py-2 rounded-full shadow-md self-start"
                        onPress={() => router.push("/sign-in")}
                      >
                        <Text className="text-[#111111] font-poppins-bold text-sm">
                          Sign in
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-[#1E1D23] min-h-screen">
            <View className="px-4 pt-6 pb-20">
              {sections.map((section, index) => (
                <View key={index} className="mb-8">
                  <Text className="text-lg font-poppins-bold text-[#3B1C6D] dark:text-white mb-4">
                    {section.title}
                  </Text>

                  <View className="space-y-1">
                    {section.items.map((item, idx) => {
                      const IconComponent = item.lib;
                      const isAppearanceItem = item.label === "Appearance";

                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={
                            isAppearanceItem ? toggleColorScheme : undefined
                          }
                          className={`flex-row items-center justify-between py-3 ${
                            idx !== section.items.length - 1
                              ? "border-b border-indigo-50 dark:border-zinc-800"
                              : ""
                          }`}
                          disabled={!isAppearanceItem}
                        >
                          <View className="flex-row items-center gap-4">
                            {/* Icon Box - Matches Home Screen Service Icons */}
                            <View className="w-12 h-12 items-center justify-center bg-indigo-100/30 dark:bg-[#2D2A33] rounded-2xl">
                              <IconComponent
                                name={item.icon as any}
                                size={20}
                                className="text-[#3B1C6D] dark:text-gray-200"
                              />
                            </View>
                            <Text className="text-sm font-poppins-medium text-[#101828] dark:text-gray-200">
                              {item.label}
                            </Text>
                          </View>
                          {isAppearanceItem ? (
                            <View className="flex-row items-center gap-3">
                              <Ionicons
                                name={colorScheme === "dark" ? "moon" : "sunny"}
                                size={20}
                                color={
                                  colorScheme === "dark" ? "#F87171" : "#F59E0B"
                                }
                              />
                              <Switch
                                value={colorScheme === "dark"}
                                onValueChange={toggleColorScheme}
                                trackColor={{
                                  false: "#E5E7EB",
                                  true: "#4B5563",
                                }}
                                thumbColor={
                                  colorScheme === "dark" ? "#F87171" : "#F59E0B"
                                }
                              />
                            </View>
                          ) : (
                            <Feather
                              name="chevron-right"
                              size={20}
                              className="text-gray-400 dark:text-gray-600"
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}
