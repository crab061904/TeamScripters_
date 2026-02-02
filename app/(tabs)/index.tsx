import { useAuth } from "@/src/context/AuthContext";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

import ProgramBenefits from "@/components/ProgramBenefits/ProgramBenefits";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";

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
  const [showApplyNowModal, setShowApplyNowModal] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

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

          <ProgramBenefits onApplyNow={() => setShowApplyNowModal(true)} />
        </ScrollView>

        {showApplyNowModal && (
          <View
            className="absolute top-0 left-0 right-0"
            style={{ bottom: tabBarHeight }}
          >
            <Pressable
              onPress={() => setShowApplyNowModal(false)}
              style={StyleSheet.absoluteFillObject}
            >
              <BlurView
                intensity={20}
                tint="default"
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={StyleSheet.absoluteFillObject}
                className="bg-black/20"
              />
            </Pressable>

            <View className="flex-1 items-center justify-center px-4">
              <View className="w-full max-w-[520px] bg-white dark:bg-[#1E1D23] rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <View className="px-5 pt-5 pb-4 bg-rose-50/60 dark:bg-zinc-900">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/30 items-center justify-center">
                        <Ionicons name="heart" size={22} color="#ef4444" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[#101828] dark:text-white text-lg font-poppins-bold">
                          Naga Scholars Program
                        </Text>
                        <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg mt-1">
                          Educational support for qualified students
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setShowApplyNowModal(false)}
                      className="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-800 items-center justify-center"
                    >
                      <Ionicons name="close" size={18} color="#64748b" />
                    </Pressable>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <View className="px-3 py-1 rounded-full bg-green-500">
                      <Text className="text-white text-xs font-poppins-semibold">
                        Available
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <Ionicons name="people-outline" size={14} color="#64748b" />
                      <Text className="ml-1 text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                        1,234 served
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <Text className="ml-1 text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                        3-5 days
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView className="max-h-[520px]" showsVerticalScrollIndicator={true}>
                  <View className="px-5 py-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center">
                        <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                      </View>
                      <Text className="ml-3 text-[#101828] dark:text-white font-poppins-semibold">
                        When to Apply
                      </Text>
                    </View>

                    <View className="mt-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 px-4 py-3">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="#2563eb" />
                        <View className="ml-3">
                          <Text className="text-[#101828] dark:text-white font-poppins-semibold text-sm">
                            Monday to Friday
                          </Text>
                          <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg mt-0.5">
                            8:00 AM - 5:00 PM
                          </Text>
                        </View>
                      </View>
                      <View className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900 flex-row items-center">
                        <Ionicons name="alert-circle-outline" size={16} color="#f97316" />
                        <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                          Closed on weekends and public holidays
                        </Text>
                      </View>
                    </View>

                    <View className="mt-6 flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 items-center justify-center">
                        <Ionicons name="location-outline" size={18} color="#db2777" />
                      </View>
                      <Text className="ml-3 text-[#101828] dark:text-white font-poppins-semibold">
                        Where to Apply
                      </Text>
                    </View>

                    <View className="mt-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 px-4 py-3">
                      <Text className="text-[#101828] dark:text-white font-poppins-semibold text-sm">
                        City Hall Main Lobby
                      </Text>
                      <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg mt-1">
                        Naga City Hall, J. Miranda Ave, Naga City
                      </Text>
                      <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg mt-1">
                        2nd Floor, Scholarship Office
                      </Text>
                      <View className="mt-3 pt-3 border-t border-rose-100 dark:border-rose-900 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="call-outline" size={14} color="#64748b" />
                          <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                            (054) 473-1234
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="mail-outline" size={14} color="#64748b" />
                          <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                            Email
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="mt-6 flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 items-center justify-center">
                        <Ionicons name="document-text-outline" size={18} color="#f59e0b" />
                      </View>
                      <Text className="ml-3 text-[#101828] dark:text-white font-poppins-semibold">
                        What You Need
                      </Text>
                    </View>

                    <View className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-4 py-3">
                      <Text className="text-[#101828] dark:text-white font-poppins-semibold text-sm">
                        Requirements (placeholder)
                      </Text>
                      <View className="mt-2">
                        {[
                          "Proof of enrollment",
                          "Valid ID",
                          "Academic records",
                          "Application form",
                        ].map((item) => (
                          <View key={item} className="flex-row items-center mt-2">
                            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                            <Text className="ml-2 text-xs text-zinc-700 dark:text-zinc-200 font-poppins-reg">
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1E1D23]">
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setShowApplyNowModal(false)}
                      className="flex-1 rounded-2xl py-3 items-center border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-zinc-700 dark:text-zinc-200 font-poppins-semibold">
                        Close
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setShowApplyNowModal(false);
                        router.push("/document-verification");
                      }}
                      className="flex-1 rounded-2xl py-3 items-center bg-indigo-700"
                    >
                      <Text className="text-white font-poppins-semibold">Apply Now</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
