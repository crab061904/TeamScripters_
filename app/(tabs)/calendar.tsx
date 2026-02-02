import { loadDraft, saveFinalRecord } from "@/src/utils/applicationStorage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const monthLabel = "February 2026";
  const [selectedDay, setSelectedDay] = useState<number>(5);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const days = useMemo(() => {
    const totalCells = 42;
    const startOffset = 0;
    const monthDays = 28;
    return Array.from({ length: totalCells }, (_, i) => {
      const day = i - startOffset + 1;
      if (day < 1 || day > monthDays) return null;
      return day;
    });
  }, []);

  const availableDays = useMemo(
    () =>
      new Set([2, 3, 4, 6, 9, 10, 11, 13, 16, 17, 18, 20, 23, 24, 25, 27]),
    [],
  );

  const timeSlots = useMemo(
    () => [
      { time: "09:00 AM", slots: 0 },
      { time: "10:00 AM", slots: 2 },
      { time: "11:00 AM", slots: 3 },
      { time: "01:00 PM", slots: 4 },
      { time: "02:00 PM", slots: 2 },
      { time: "03:00 PM", slots: 0 },
      { time: "04:00 PM", slots: 1 },
    ],
    [],
  );

  const selectedDateLabel = `Thu, ${selectedDay} February 2026`;

  async function confirmAppointment() {
    if (!selectedTime) return;

    const draft = await loadDraft();
    const documents =
      draft?.documents ??
      ([
        {
          document: { name: "Document 1" },
          fields: {
            name: "",
            studentId: "",
            school: "",
            program: "Naga Scholars Program",
            dates: "",
          },
        },
      ] as const);

    const appointment = {
      monthLabel,
      selectedDay,
      selectedTime,
      selectedDateLabel,
    };

    const record = await saveFinalRecord({ documents, appointment });
    setQrPayload(record.qrPayload);
    setShowQr(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-[#2C2932]">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-indigo-600 items-center justify-center">
              <Ionicons name="school" size={18} color="#fff" />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-[#101828] dark:text-white text-xl font-poppins-bold">
                Naga Scholars Program
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-200 font-poppins-reg text-xs mt-0.5">
                Book an appointment for your application
              </Text>
            </View>
          </View>

          <View className="mt-4 bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#4f46e5"
                />
              </View>
              <Text className="ml-3 text-zinc-700 dark:text-zinc-200 font-poppins-medium">
                Office Hours: 09:00 AM - 05:00 PM
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4">
          <View className="flex-col gap-4">
            <View className="bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <View className="px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 items-center justify-center">
                    <Ionicons name="chevron-back" size={18} color="#4f46e5" />
                  </View>

                  <Text className="text-[#101828] dark:text-white font-poppins-semibold text-base">
                    {monthLabel}
                  </Text>

                  <View className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 items-center justify-center">
                    <Ionicons name="chevron-forward" size={18} color="#4f46e5" />
                  </View>
                </View>

                <View className="flex-row mt-5 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <Text
                      key={d}
                      className="flex-1 text-center text-xs text-zinc-500 dark:text-zinc-300 font-poppins-medium"
                    >
                      {d}
                    </Text>
                  ))}
                </View>

                <View className="flex-row flex-wrap">
                  {days.map((day, idx) => {
                    const isEmpty = day == null;
                    const isSelected = day === selectedDay;
                    const isAvailable = day != null && availableDays.has(day);
                    const isUnavailable = day != null && !isAvailable && day !== selectedDay;

                    return (
                      <Pressable
                        key={`${idx}-${day ?? "x"}`}
                        onPress={
                          day
                            ? () => {
                                setSelectedDay(day);
                                setSelectedTime(null);
                              }
                            : undefined
                        }
                        className="w-[14.2857%] aspect-square items-center justify-center"
                        disabled={isEmpty}
                      >
                        <View
                          className={`w-11 h-11 rounded-2xl items-center justify-center ${
                            isSelected
                              ? "bg-indigo-600"
                              : isUnavailable
                                ? "bg-zinc-50 dark:bg-zinc-900"
                                : "bg-transparent"
                          }`}
                        >
                          <Text
                            className={`${
                              isSelected
                                ? "text-white"
                                : isUnavailable
                                  ? "text-zinc-300 dark:text-zinc-600"
                                  : "text-[#101828] dark:text-white"
                            } font-poppins-semibold`}
                          >
                            {day ?? ""}
                          </Text>
                        </View>

                        {day != null && isAvailable && !isSelected && (
                          <View className="w-1 h-1 rounded-full bg-indigo-500 mt-1" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <View className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-3 flex-row items-center">
                  <View className="flex-row items-center mr-5">
                    <View className="w-3 h-3 rounded bg-indigo-600" />
                    <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                      Selected
                    </Text>
                  </View>
                  <View className="flex-row items-center mr-5">
                    <View className="w-3 h-3 rounded border border-indigo-400" />
                    <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                      Available
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800" />
                    <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                      Unavailable
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <View className="px-4 py-4">
                <Text className="text-[#101828] dark:text-white font-poppins-semibold text-base">
                  Appointment Details
                </Text>

                <View className="mt-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3">
                  <View className="flex-row items-center">
                    <MaterialIcons name="event" size={18} color="#4f46e5" />
                    <View className="ml-3">
                      <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg">
                        Date
                      </Text>
                      <Text className="text-[#101828] dark:text-white font-poppins-semibold">
                        {selectedDateLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 px-4 py-3">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={18} color="#7c3aed" />
                    <View className="ml-3">
                      <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg">
                        Time
                      </Text>
                      <Text className="text-[#101828] dark:text-white font-poppins-semibold">
                        {selectedTime ?? "Not selected"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-4 py-3">
                  <Text className="text-amber-800 dark:text-amber-200 font-poppins-medium text-sm">
                    Please bring:
                  </Text>
                  <View className="mt-2">
                    {[
                      "Proof of enrollment",
                      "Valid ID",
                      "Academic records",
                      "Application form",
                    ].map((item) => (
                      <Text
                        key={item}
                        className="text-amber-800/90 dark:text-amber-200/90 text-xs font-poppins-reg mt-1"
                      >
                        {`• ${item}`}
                      </Text>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={confirmAppointment}
                  className={`mt-4 rounded-2xl py-3 items-center ${
                    selectedTime ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="event-available"
                      size={18}
                      color={selectedTime ? "#fff" : "#94a3b8"}
                    />
                    <Text
                      className={`ml-2 font-poppins-semibold ${
                        selectedTime ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      Confirm Appointment
                    </Text>
                  </View>
                </Pressable>

                {!selectedTime && (
                  <Text className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                    Select a time slot to continue
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4 mb-8">
          <View className="bg-white dark:bg-[#1E1D23] rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center">
                <Ionicons name="time-outline" size={20} color="#4f46e5" />
              </View>
              <Text className="ml-3 text-[#101828] dark:text-white font-poppins-semibold text-base">
                Available Time Slots
              </Text>
            </View>

            <Text className="mt-2 text-zinc-600 dark:text-zinc-200 font-poppins-reg text-xs">
              {selectedDateLabel}
            </Text>

            <View className="mt-4 flex-row flex-wrap justify-between">
              {timeSlots.map((slot) => {
                const disabled = slot.slots === 0;
                const isSelected = selectedTime === slot.time;

                return (
                  <Pressable
                    key={slot.time}
                    onPress={() => {
                      if (disabled) return;
                      setSelectedTime(slot.time);
                    }}
                    className={`w-[48%] rounded-2xl border px-4 py-3 mb-3 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#1E1D23]"
                    } ${disabled ? "opacity-50" : ""}`}
                  >
                    <Text
                      className={`text-center font-poppins-semibold ${
                        isSelected
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-[#101828] dark:text-white"
                      }`}
                    >
                      {slot.time}
                    </Text>
                    <Text className="text-center text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg mt-1">
                      {slot.slots === 0 ? "" : `${slot.slots} slots`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showQr} transparent animationType="fade" onRequestClose={() => setShowQr(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full bg-white dark:bg-[#1E1D23] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <Text className="text-[#101828] dark:text-white font-poppins-semibold text-base text-center">
              Appointment Confirmed
            </Text>
            <Text className="mt-2 text-zinc-600 dark:text-zinc-200 font-poppins-reg text-xs text-center">
              Show this QR code at the office
            </Text>

            <View className="mt-5 items-center justify-center">
              {qrPayload && (
                <View className="bg-white p-4 rounded-2xl border border-zinc-200">
                  <QRCode value={qrPayload} size={220} />
                </View>
              )}
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setShowQr(false)}
                className="flex-1 rounded-2xl py-3 items-center border border-zinc-200 dark:border-zinc-700"
              >
                <Text className="text-zinc-700 dark:text-zinc-200 font-poppins-semibold">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
