import { useState } from "react";
import {
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, Feather, FontAwesome6 } from "@expo/vector-icons";
import "../../global.css";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";

import ProgramBenefits from "@/components/ProgramBenefits/ProgramBenefits";

const SERVICES = [
  { id: 1, label: "Services", icon: "gear" },
  { id: 2, label: "Citizen Guide", icon: "book" },
  { id: 3, label: "E-Services", icon: "globe" },
  { id: 4, label: "Emergency", icon: "triangle-exclamation" },
  { id: 5, label: "Utilities", icon: "lightbulb" },
  { id: 6, label: "Transport", icon: "bus" },
  { id: 7, label: "Business", icon: "briefcase" },
  { id: 8, label: "Students", icon: "graduation-cap" },
  { id: 9, label: "Startup", icon: "rocket" },
  { id: 10, label: "i-Engage", icon: "briefcase" },
  { id: 12, label: "Health", icon: "heart-pulse", soon: true },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [visibleServices, setVisibleServices] = useState(SERVICES.slice(0, 7));

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 font-poppins-reg dark:text-white">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="bg-indigo-100/30 dark:bg-[#2C2932] relative"
        >
          {/* Header Section */}
          <View className="bg-orange-100 dark:bg-indigo-950/60 pt-8 pb-12 px-4 ">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center w-full bg-white/80 dark:bg-[#1E1D23] p-2 rounded-full flex-1 mr-4 flex-row items-center px-4 h-10 shadow-sm">
                <Feather
                  name="search"
                  size={20}
                  className="text-[#101828] dark:text-[#68676D]"
                />
                <TextInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="pl-3 focus:outline-none w-full"
                />
              </View>
              <TouchableOpacity
                className="bg-white/80 dark:bg-[#1E1D23] p-2 rounded-full shadow-sm"
                onPress={() => router.push("/notifications")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  className="text-[#101828] dark:text-white"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-[#3B1C6D] dark:text-white text-2xl font-poppins-bold">
              Marhay na aga
            </Text>
            {!user && (
              <TouchableOpacity
                className="flex-row items-center mt-2"
                onPress={() => router.push("/sign-up")}
              >
                <View className="flex-row items-center bg-white p-2  rounded-full">
                  <Text className="text-[#3B1C6D] font-poppins-reg text-xs">
                    Create your account
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#1E1B4B"
                    className="ml-2"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Content Card */}
          <View className=" rounded-t-3xl -mt-5">
            <View className="px-4  pt-5   rounded-t-3xl bg-white dark:bg-[#1E1D23]">
              <Text className="font-poppins-semibold text-[#101828] dark:text-white  text-xl mb-6">
                What would you like to do?
              </Text>

              {/* Service Grid */}
              <View className="flex-row flex-wrap justify-between ">
                {visibleServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    className="w-[22%] items-center mb-6 "
                  >
                    <View className="bg-indigo-100/30 dark:bg-[#2D2A33]  w-14 h-14 rounded-xl items-center justify-center mb-2 ">
                      {service.soon && (
                        <View className="absolute -top-2 -right-2 px-[6px] py-[2px] bg-[#F87171] rounded-full items-center justify-center">
                          <Text className="text-[10px] font-poppins-reg text-white">
                            SOON
                          </Text>
                        </View>
                      )}
                      <FontAwesome6
                        name={service.icon as any}
                        size={24}
                        color={service.soon ? "#7e7e7eff" : "#F87171"}
                      />
                    </View>
                    <Text
                      className="text-center text-xs font-poppins-reg text-gray-600 dark:text-gray-200"
                      numberOfLines={2}
                    >
                      {service.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {SERVICES.length > 7 && (
                  <TouchableOpacity
                    className="w-[22%] items-center mb-6"
                    onPress={() => {
                      setShowAll((prev) => !prev);
                      setVisibleServices((prev) =>
                        prev.length > 7 ? SERVICES.slice(0, 7) : SERVICES,
                      );
                    }}
                  >
                    <View className="bg-indigo-100/30 dark:bg-[#2D2A33]  w-14 h-14 rounded-2xl items-center justify-center mb-2">
                      <FontAwesome6
                        name={showAll ? "minus" : "plus"}
                        size={18}
                        color="#F87171"
                      />
                    </View>
                    <Text
                      className="text-center text-xs font-poppins-reg text-gray-600 dark:text-gray-200"
                      numberOfLines={2}
                    >
                      {showAll ? "View Less" : "View More"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Featured Banner (Help us improve our city) - Only show when not signed in */}
            {!user && (
              <View className="px-4  mt-3 bg-white  dark:bg-[#1E1D23]">
                <View className="bg-indigo-900 rounded-2xl p-4 mt-6 mb-10">
                  <Text className="text-white font-poppins-semibold text-lg">
                    Help us improve our city
                  </Text>
                  <Text className="text-indigo-100 text-xs font-poppins-reg mb-4 pr-6">
                    Create an account to report local issues directly to the
                    city.
                  </Text>
                  <TouchableOpacity
                    className="bg-white py-2 rounded-full items-center"
                    onPress={() => router.push("/sign-in")}
                  >
                    <Text className="text-indigo-900 font-poppins-reg">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <ProgramBenefits />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
