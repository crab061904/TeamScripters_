import { saveDraftDocuments } from "@/src/utils/applicationStorage";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UploadedDoc = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  kind: "image" | "pdf" | "unknown";
};

type ExtractedFields = {
  name: string;
  studentId: string;
  school: string;
  program: string;
  dates: string;
};

type DocFormState = {
  doc: UploadedDoc;
  status: "ready" | "processing" | "done";
  didAutofill: boolean;
  fields: ExtractedFields;
};

function bytesToHuman(bytes?: number) {
  if (!bytes || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function guessDocKind(mimeType?: string, name?: string): UploadedDoc["kind"] {
  const lower = (name ?? "").toLowerCase();
  const mt = (mimeType ?? "").toLowerCase();
  if (mt.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (mt.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(lower)) return "image";
  return "unknown";
}

function defaultFields(): ExtractedFields {
  return {
    name: "",
    studentId: "",
    school: "",
    program: "Naga Scholars Program",
    dates: "",
  };
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)] as T;
}

function randomStudentId() {
  const year = randomInt(2021, 2026);
  const seq = randomInt(10000, 99999);
  return `${year}-${seq}`;
}

function randomDateRange() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m1 = pickOne(months);
  const m2 = pickOne(months);
  const d1 = randomInt(1, 28);
  const d2 = randomInt(1, 28);
  const year = randomInt(2024, 2026);
  return `${m1} ${d1}, ${year} - ${m2} ${d2}, ${year}`;
}

function randomPrototypeFields(): ExtractedFields {
  const firstNames = [
    "Andrea",
    "Miguel",
    "Sofia",
    "Katrina",
    "Joshua",
    "Daniel",
    "Alyssa",
    "Mark",
    "Nicole",
    "John",
  ];
  const lastNames = [
    "Santos",
    "Reyes",
    "Cruz",
    "Garcia",
    "Dela Cruz",
    "Mendoza",
    "Flores",
    "Bautista",
    "Ramos",
    "Navarro",
  ];

  const schools = [
    "Ateneo de Naga University",
    "University of Nueva Caceres",
    "Camarines Sur Polytechnic Colleges",
    "Bicol University",
    "Naga College Foundation",
  ];

  const programs = [
    "Naga Scholars Program",
    "STEM Scholarship Track",
    "Education Support Program",
    "Academic Excellence Grant",
  ];

  const name = `${pickOne(firstNames)} ${pickOne(lastNames)}`;

  return {
    name,
    studentId: randomStudentId(),
    school: pickOne(schools),
    program: pickOne(programs),
    dates: randomDateRange(),
  };
}



export default function DocumentVerificationScreen() {
  const [docStates, setDocStates] = useState<DocFormState[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const active = docStates[activeIndex];

  const canProcess = useMemo(
    () => Boolean(active) && !isProcessing && active.status !== "processing",
    [active, isProcessing],
  );

  function deleteActiveDoc() {
    setDocStates((prev) => {
      if (prev.length === 0) return prev;
      const nextArr = prev.filter((_, idx) => idx !== activeIndex);
      const nextIndex = Math.max(0, Math.min(activeIndex, nextArr.length - 1));
      setActiveIndex(nextArr.length === 0 ? 0 : nextIndex);
      return nextArr;
    });
  }

  async function takePhoto() {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: false,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? "image/jpeg";
    const next: UploadedDoc = {
      uri: asset.uri,
      name,
      size: asset.fileSize,
      mimeType,
      kind: "image",
    };
    setDocStates((prev) => {
      const appended: DocFormState = {
        doc: next,
        status: "ready",
        didAutofill: false,
        fields: defaultFields(),
      };
      const nextArr = [...prev, appended];
      setActiveIndex(nextArr.length - 1);
      return nextArr;
    });
  }

  async function uploadFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const name = asset.name ?? `document-${Date.now()}`;
    const kind = guessDocKind(asset.mimeType, name);
    const next: UploadedDoc = {
      uri: asset.uri,
      name,
      size: asset.size,
      mimeType: asset.mimeType,
      kind,
    };
    setDocStates((prev) => {
      const appended: DocFormState = {
        doc: next,
        status: "ready",
        didAutofill: false,
        fields: defaultFields(),
      };
      const nextArr = [...prev, appended];
      setActiveIndex(nextArr.length - 1);
      return nextArr;
    });
  }

  async function runFakeScan() {
    if (!active) return;
    setIsProcessing(true);
    setDocStates((prev) => {
      const nextArr = [...prev];
      const curr = nextArr[activeIndex];
      if (!curr) return prev;
      nextArr[activeIndex] = {
        ...curr,
        status: "processing",
        didAutofill: false,
      };
      return nextArr;
    });

    const delayMs = Platform.OS === "web" ? 1200 : 1500;
    await new Promise<void>((resolve) => setTimeout(() => resolve(), delayMs));

    setDocStates((prev) => {
      const nextArr = [...prev];
      const curr = nextArr[activeIndex];
      if (!curr) return prev;
      nextArr[activeIndex] = {
        ...curr,
        status: "done",
        didAutofill: true,
        fields: randomPrototypeFields(),
      };
      return nextArr;
    });
    setIsProcessing(false);
  }

  function updateField<K extends keyof ExtractedFields>(key: K, value: ExtractedFields[K]) {
    setDocStates((prev) => {
      const nextArr = [...prev];
      const curr = nextArr[activeIndex];
      if (!curr) return prev;
      nextArr[activeIndex] = {
        ...curr,
        fields: { ...curr.fields, [key]: value },
      };
      return nextArr;
    });
  }

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
              <View className="flex-row items-center justify-between">
                <Text className="text-[#101828] dark:text-white font-poppins-semibold text-base">
                  {docStates.length > 0
                    ? `Uploaded Documents (${docStates.length})`
                    : "Upload Your Documents"}
                </Text>
                {docStates.length > 0 && (
                  <Pressable
                    onPress={uploadFile}
                    className="flex-row items-center"
                    disabled={isProcessing}
                  >
                    <Ionicons name="add" size={16} color="#4f46e5" />
                    <Text className="ml-1 text-indigo-600 dark:text-indigo-300 font-poppins-semibold text-xs">
                      Add More
                    </Text>
                  </Pressable>
                )}
              </View>

              {active ? (
                <View className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#1E1D23] p-4 flex-row items-center">
                  <View className="w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden items-center justify-center">
                    {active.doc.kind === "image" ? (
                      <Image source={{ uri: active.doc.uri }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Ionicons name="document" size={24} color="#64748b" />
                    )}
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className="text-[#101828] dark:text-white font-poppins-semibold"
                      numberOfLines={1}
                    >
                      {active.doc.name}
                    </Text>
                    <Text className="text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg mt-1">
                      {bytesToHuman(active.doc.size)}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Ionicons
                        name={
                          active.status === "processing"
                            ? "sync"
                            : active.status === "done"
                              ? "checkmark-circle"
                              : "ellipse"
                        }
                        size={16}
                        color={
                          active.status === "processing"
                            ? "#7c3aed"
                            : active.status === "done"
                              ? "#22c55e"
                              : "#64748b"
                        }
                      />
                      <Text className="ml-2 text-xs font-poppins-reg text-zinc-600 dark:text-zinc-200">
                        {active.status === "processing"
                          ? "Processing..."
                          : active.status === "done"
                            ? "Processed"
                            : "Ready to process"}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={deleteActiveDoc}
                    disabled={isProcessing}
                    className={`ml-3 w-10 h-10 rounded-2xl items-center justify-center border border-zinc-200 dark:border-zinc-700 ${
                      isProcessing ? "opacity-50" : ""
                    }`}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row justify-between mt-4">
                  <Pressable
                    onPress={takePhoto}
                    disabled={isProcessing}
                    className="w-[48%] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-5 items-center"
                  >
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

                  <Pressable
                    onPress={uploadFile}
                    disabled={isProcessing}
                    className="w-[48%] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-5 items-center"
                  >
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
              )}

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

              {active && docStates.length > 1 && (
                <View className="mt-4 flex-row">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                    <View className="flex-row">
                      {docStates.map((d, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                          <Pressable
                            key={`${d.doc.uri}-${idx}`}
                            onPress={() => setActiveIndex(idx)}
                            className={`mr-2 px-4 py-2 rounded-2xl border ${
                              isActive
                                ? "bg-indigo-600 border-indigo-600"
                                : "bg-white dark:bg-[#1E1D23] border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            <Text
                              className={`text-xs font-poppins-semibold ${
                                isActive ? "text-white" : "text-[#101828] dark:text-white"
                              }`}
                            >
                              {`Doc ${idx + 1}`}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {active && (
                <View className="mt-5">
                  <Pressable
                    onPress={runFakeScan}
                    disabled={!canProcess}
                    className={`rounded-2xl py-3 items-center ${
                      canProcess ? "bg-indigo-700" : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  >
                    <View className="flex-row items-center">
                      {isProcessing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Ionicons name="scan-outline" size={18} color="#fff" />
                      )}
                      <Text className="ml-2 text-white font-poppins-semibold">
                        {isProcessing ? "Processing Documents..." : "Process Documents"}
                      </Text>
                    </View>
                  </Pressable>

                  {active?.status === "processing" && (
                    <View className="mt-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1E1D23] p-6 items-center">
                      <ActivityIndicator size="large" color="#4f46e5" />
                      <Text className="mt-4 text-[#101828] dark:text-white font-poppins-semibold">
                        Processing Documents...
                      </Text>
                      <Text className="mt-1 text-zinc-600 dark:text-zinc-200 text-xs font-poppins-reg">
                        Our AI is extracting information from your documents
                      </Text>
                    </View>
                  )}

                  {active?.status === "done" && (
                    <View className="mt-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1E1D23] p-5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[#101828] dark:text-white font-poppins-semibold">
                          Extracted Information
                        </Text>
                        {active.didAutofill && (
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                            <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-200 font-poppins-reg">
                              Auto-filled
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="mt-4">
                        <Text className="text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                          Name
                        </Text>
                        <TextInput
                          value={active.fields.name}
                          onChangeText={(v) => updateField("name", v)}
                          placeholder="Full Name"
                          className="mt-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[#101828] dark:text-white"
                        />

                        <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                          Student ID
                        </Text>
                        <TextInput
                          value={active.fields.studentId}
                          onChangeText={(v) => updateField("studentId", v)}
                          placeholder="Student ID"
                          className="mt-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[#101828] dark:text-white"
                        />

                        <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                          School / University
                        </Text>
                        <TextInput
                          value={active.fields.school}
                          onChangeText={(v) => updateField("school", v)}
                          placeholder="School / University"
                          className="mt-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[#101828] dark:text-white"
                        />

                        <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                          Program
                        </Text>
                        <TextInput
                          value={active.fields.program}
                          onChangeText={(v) => updateField("program", v)}
                          placeholder="Naga Scholars Program"
                          className="mt-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[#101828] dark:text-white"
                        />

                        <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-300 font-poppins-reg">
                          Date(s)
                        </Text>
                        <TextInput
                          value={active.fields.dates}
                          onChangeText={(v) => updateField("dates", v)}
                          placeholder="Date(s) (if any)"
                          className="mt-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[#101828] dark:text-white"
                        />
                      </View>

                      <View className="flex-row gap-3 mt-5">
                        <Pressable
                          onPress={() => {
                            setDocStates([]);
                            setActiveIndex(0);
                          }}
                          className="flex-1 rounded-2xl py-3 px-3 items-center justify-center border border-zinc-200 dark:border-zinc-700"
                        >
                          <Text
                            numberOfLines={1}
                            className="text-zinc-700 dark:text-zinc-200 font-poppins-semibold text-sm"
                          >
                            Change Document
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={async () => {
                            await saveDraftDocuments(
                              docStates.map((d) => ({
                                document: {
                                  name: d.doc.name,
                                  mimeType: d.doc.mimeType,
                                  kind: d.doc.kind,
                                  size: d.doc.size,
                                },
                                fields: d.fields,
                              })),
                            );
                            router.push("/calendar");
                          }}
                          className="flex-1 rounded-2xl py-3 px-3 items-center justify-center bg-indigo-700"
                        >
                          <Text numberOfLines={1} className="text-white font-poppins-semibold">
                            Confirm
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}
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
