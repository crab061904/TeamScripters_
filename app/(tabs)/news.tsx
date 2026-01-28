import { View, Text, ScrollView } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

export default function News() {
  return (
    <SafeAreaProvider>
      <View className="flex-1  font-poppins-reg dark:text-white">
        <ScrollView className=" font-poppins-reg bg-indigo-100/30 dark:bg-[#2C2932] flex-1 justify-center items-center ">
          <Text className=" text-xl dark:text-white">News</Text>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}
