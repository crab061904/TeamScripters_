import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

interface Notification {
  id: string;
  type: "match" | "group" | "action";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const NotificationsScreen = () => {
  const { colorScheme } = useColorScheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "match",
      title: "Great News!",
      message: "You are a 100% match for the Naga Scholars Program.",
      timestamp: "2 hours ago",
      isRead: false,
      icon: "checkmark-circle",
      iconColor: "#10B981",
    },
    {
      id: "2",
      type: "group",
      title: "Senior Citizen IDs",
      message: "are now available for application.",
      timestamp: "5 hours ago",
      isRead: false,
      icon: "card",
      iconColor: "#3B82F6",
    },
    {
      id: "3",
      type: "action",
      title: "Action Required",
      message: "Unlock Housing Support by updating your monthly income.",
      timestamp: "1 day ago",
      isRead: true,
      icon: "warning",
      iconColor: "#F59E0B",
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      className="bg-white dark:bg-[#1E1D23] rounded-xl shadow-sm mb-3 p-4 mx-4"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <View className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-[#2C2932]">
          <Ionicons name={item.icon} size={20} color={item.iconColor} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-2">
              {!item.isRead && (
                <View className="w-2 h-2 bg-red-500 rounded-full" />
              )}
              <Text className="text-sm font-poppins-semibold text-gray-900 dark:text-white">
                {item.title}
              </Text>
            </View>
            <Text className="text-xs font-poppins-reg text-gray-500 dark:text-gray-400">
              {item.timestamp}
            </Text>
          </View>
          <Text className="text-sm font-poppins-reg text-gray-600 dark:text-gray-300 leading-relaxed">
            {item.message}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-indigo-100/30 dark:bg-[#2C2932]">
      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="py-4"
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-off" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-center font-poppins-reg text-gray-500 dark:text-gray-400">
              No notifications yet
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
