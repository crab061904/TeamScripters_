import { Text, View } from "react-native";
import ProgramBenefitCard from "./ProgramBenefitCard";

const NAGA_BENEFITS_DATA = [
  {
    id: "1",
    title: "Naga Scholars Program ",
    department: "Education Department",
    datePosted: "Jan 26, 2026",
    location: "City Hall Main Lobby", // Added
    schedule: "Mon-Fri, 8AM - 5PM", // Added
    matchPercentage: 100,
    status: "eligible",
    icon: "school",
    iconColor: "#6366f1",
    iconBg: "bg-indigo-100",
    requirements: [
      { label: "Naga City Resident", met: true },
      { label: "Enrolled in Partner School", met: true },
      { label: "GWA of 85% or higher", met: true },
    ],
    ctaText: "Apply Now",
  },
  {
    id: "2",
    title: "Job Placement Initiative",
    department: "Labor & Employment",
    datePosted: "Jan 18, 2026",
    location: "METRO PESO Office",
    schedule: "Tue & Thu, 9AM - 3PM",
    matchPercentage: 75,
    status: "action_required",
    icon: "work",
    iconColor: "#f59e0b",
    iconBg: "bg-amber-100",
    requirements: [
      { label: "Naga City Resident", met: true },
      { label: "Valid Government ID", met: true },
      { label: "Monthly Income Declaration", met: false },
    ],
    ctaText: "Unlock Program",
  },
  {
    id: "4",
    title: "Senior Citizen Cash Gift",
    department: "Social Welfare",
    datePosted: "Jan 10, 2026",
    location: "Barangay Hall (Satellite)",
    schedule: "Monthly (Every 1st Sat)",
    matchPercentage: 20,
    status: "locked",
    icon: "lock",
    iconColor: "#6b7280",
    iconBg: "bg-gray-200",
    requirements: [
      { label: "Naga City Resident", met: true },
      { label: "Age 60 or above", met: false },
    ],
    ctaText: "Ineligible",
  },
] as const;

export default function ProgramBenefits({
  onApplyNow,
}: {
  onApplyNow?: () => void;
}) {
  return (
    <View className="px-4  pt-5  mt-2 bg-white  dark:bg-[#1E1D23]">
      <Text className="font-poppins-semibold text-[#101828] dark:text-white  text-xl mb-6">
        Program Benefits
      </Text>
      <View className="gap-2 rounded-2xl mb-10">
        {NAGA_BENEFITS_DATA.map((benefit) => (
          <ProgramBenefitCard
            key={benefit.id}
            title={benefit.title}
            department={benefit.department}
            matchPercentage={benefit.matchPercentage}
            status={benefit.status} // Ensure this is "eligible" | "action_required" | "locked"
            icon={benefit.icon}
            iconColor={benefit.iconColor}
            iconBg={benefit.iconBg}
            ctaText={benefit.ctaText}
            location={benefit.location}
            schedule={benefit.schedule}
            onPress={
              benefit.ctaText === "Apply Now" ? onApplyNow : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}
