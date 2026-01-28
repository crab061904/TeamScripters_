import React from "react";
import { Tabs, Text } from "expo-router";
import { View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "nativewind";
import { FontAwesome6 } from "@expo/vector-icons";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme ?? "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme == "dark" ? "#FB634B" : "#F33C25",
        tabBarInactiveTintColor: theme == "dark" ? "#A8A8A9" : "#5C596C",
        headerShown: false,
        tabBarButton: HapticTab, //
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center rounded-2xl px-4 py-1 ">
              <FontAwesome6
                size={20}
                name="house"
                solid={focused}
                className={` ${focused ? "text-[#F33C25] dark:text-[#FB634B]" : "text-[#5C596C] dark:text-[#A8A8A9]"}`}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gears" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="newspaper" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="emergency"
        options={{
          title: "Emergency",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="triangle-exclamation"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="circle-user" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center rounded-2xl px-4 py-1 ">
      <FontAwesome6
        name={name}
        size={20}
        solid={focused}
        className={` ${focused ? "text-[#F33C25] dark:text-[#FB634B]" : "text-[#5C596C] dark:text-[#A8A8A9]"}`}
      />
    </View>
  );
}
