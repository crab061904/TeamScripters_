import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ApplyNowScreen() {
  useEffect(() => {
    router.replace("/document-verification");
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-[#2C2932]">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-[#101828] dark:text-white font-poppins-semibold">
          Redirecting to calendar...
        </Text>
      </View>
    </SafeAreaView>
  );
}
