import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DocumentVerificationScreen() {
  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-[#2C2932]">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-indigo-600 items-center justify-center">
              <Ionicons name="scan-outline" size={20} color="#fff" />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-[#101828] dark:text-white text-xl font-poppins-bold">
                Document Verification
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-200 font-poppins-reg text-xs mt-0.5">
                Upload your documents before booking an appointment
              </Text>
            </View>
          </View>

          <View className="mt-4 bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center">
                <Ionicons name="document-text-outline" size={18} color="#4f46e5" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-zinc-500 dark:text-zinc-300 text-xs font-poppins-reg">
                  Step 1 of 2
                </Text>
                <Text className="text-[#101828] dark:text-white font-poppins-semibold">
                  Verify your documents to proceed with booking
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4 mb-8">
          <View className="flex-col gap-4">
            <View className="bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
              <Text className="text-[#101828] dark:text-white font-poppins-semibold text-base">
                Upload Your Documents
              </Text>

              <View className="flex-row justify-between mt-4">
                <Pressable className="w-[48%] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-5 items-center">
                  <View className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center">
                    <Ionicons name="camera-outline" size={24} color="#4f46e5" />
                  </View>
                  <Text className="mt-3 text-[#101828] dark:text-white font-poppins-semibold">
                    Take Photo
                  </Text>
                  <Text className="mt-1 text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg">
                    Use your camera
                  </Text>
                </Pressable>

                <Pressable className="w-[48%] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-5 items-center">
                  <View className="w-14 h-14 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/30 items-center justify-center">
                    <Ionicons name="cloud-upload-outline" size={24} color="#a855f7" />
                  </View>
                  <Text className="mt-3 text-[#101828] dark:text-white font-poppins-semibold">
                    Upload File
                  </Text>
                  <Text className="mt-1 text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg">
                    Choose from device
                  </Text>
                </Pressable>
              </View>

              <View className="mt-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 px-4 py-3">
                <Text className="text-indigo-700 dark:text-indigo-200 font-poppins-semibold text-sm">
                  Accepted Documents:
                </Text>
                <View className="mt-2">
                  {[
                    "Government-issued ID (National ID, Passport, Driver's License)",
                    "Supporting documents related to your application",
                    "File formats: JPG, PNG, PDF (max 5MB per file)",
                  ].map((item) => (
                    <Text
                      key={item}
                      className="text-indigo-700/90 dark:text-indigo-200/90 text-xs font-poppins-reg mt-1"
                    >
                      {`• ${item}`}
                    </Text>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/calendar")}
                className="mt-5 rounded-2xl py-3 items-center bg-indigo-700"
              >
                <Text className="text-white font-poppins-semibold">Continue</Text>
              </Pressable>
            </View>

            <View className="bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
              <Text className="text-[#101828] dark:text-white font-poppins-semibold text-base">
                Quick Tips
              </Text>

              <View className="mt-4">
                {[
                  {
                    title: "Clear Image",
                    desc: "Ensure text is readable and not blurry",
                    icon: "document-text-outline" as const,
                    bg: "bg-indigo-50 dark:bg-indigo-950/40",
                    color: "#4f46e5",
                  },
                  {
                    title: "Good Lighting",
                    desc: "Avoid shadows and glare on documents",
                    icon: "camera-outline" as const,
                    bg: "bg-violet-50 dark:bg-violet-950/30",
                    color: "#7c3aed",
                  },
                  {
                    title: "Full Document",
                    desc: "Capture entire document in frame",
                    icon: "scan-outline" as const,
                    bg: "bg-rose-50 dark:bg-rose-950/30",
                    color: "#f43f5e",
                  },
                ].map((tip) => (
                  <View key={tip.title} className="flex-row items-start mb-4">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${tip.bg}`}>
                      <Ionicons name={tip.icon} size={18} color={tip.color} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-[#101828] dark:text-white font-poppins-semibold">
                        {tip.title}
                      </Text>
                      <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg mt-0.5">
                        {tip.desc}
                      </Text>
                    </View>
                  </View>
                ))}

                <Text className="text-zinc-500 dark:text-zinc-300 text-xs font-poppins-reg">
                  Your documents are encrypted and secure
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
