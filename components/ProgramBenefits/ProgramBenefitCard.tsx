import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, TouchableOpacity, View } from "react-native";

interface BenefitProps {
  title: string;
  department: string;
  matchPercentage: number;
  status: "eligible" | "action_required" | "locked";
  icon: any;
  iconColor: string;
  iconBg: string;
  ctaText: string;
  location: string;
  schedule: string;
  onPress?: () => void;
}

export default function ProgramBenefitCard({
  title,
  department,
  matchPercentage,
  status,
  icon,
  iconColor,
  iconBg,
  ctaText,
  location,
  schedule,
  onPress,
}: BenefitProps) {
  // Dynamic color for the progress bar based on match
  const barColor =
    matchPercentage === 100
      ? "bg-green-500"
      : matchPercentage > 50
        ? "bg-amber-500"
        : "bg-gray-400";
  const isLocked = status === "locked";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={isLocked ? undefined : onPress}
      disabled={isLocked || !onPress}
      className={`flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 mb-4 shadow-sm ${isLocked ? "opacity-60" : ""}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 gap-3">
          {/* Dynamic Icon Container */}
          <View
            className={`${iconBg} w-12 h-12 rounded-xl items-center justify-center`}
          >
            <MaterialIcons name={icon} size={24} color={iconColor} />
          </View>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-zinc-900 dark:text-white font-poppins-bold text-lg"
            >
              {title}
            </Text>
            <Text className="text-zinc-600 dark:text-zinc-200 text-xs uppercase tracking-wider font-poppins-medium">
              {department}
            </Text>
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
      </View>

      <View className="flex-col gap-1 text-gray-300">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name="location-outline"
            size={18}
            className="text-zinc-600 dark:text-zinc-200 "
          />
          <Text className="text-zinc-600 dark:text-zinc-200 ">{location}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons
            name="time-outline"
            size={18}
            className="text-zinc-600 dark:text-zinc-200 "
          />
          <Text className="text-zinc-600 dark:text-zinc-200 ">{schedule}</Text>
        </View>
      </View>

      {/* Match Percentage UI */}
      <View className="mt-1">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-zinc-600 dark:text-zinc-200 dark:text-zinc-200  dark:text-zinc-400 text-sm  font-poppins-semibold">
            {isLocked ? "Ineligible" : `Eligibility Match: ${matchPercentage}%`}
          </Text>
        </View>

        {/* Progress Bar Track */}
        <View className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <View
            className={`h-full ${barColor}`}
            style={{ width: `${matchPercentage}%` }}
          />
        </View>
      </View>

      {/* Action Footer */}
      <View className="flex-row items-center justify-between pt-2 border-t border-zinc-50 dark:border-zinc-800">
        <View className="flex-row items-center">
          <MaterialIcons
            name={
              status === "eligible"
                ? "check-circle"
                : status === "locked"
                  ? "block"
                  : "error-outline"
            }
            size={16}
            color={
              matchPercentage === 100
                ? "#22c55e"
                : isLocked
                  ? "#6b7280"
                  : "#f59e0b"
            }
          />
          <Text className="ml-1 text-xs text-zinc-600 dark:text-zinc-200">
            {status.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        <Text
          className={`font-poppins-bold text-sm ${matchPercentage === 100 ? "text-indigo-600" : "text-zinc-400"}`}
        >
          {ctaText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
