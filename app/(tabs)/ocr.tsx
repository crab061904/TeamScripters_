import {
  extractLabeledAnswers,
  FormFieldTemplate,
  recognizeWordsFromUri,
} from "@/src/services/ocrService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const template: FormFieldTemplate[] = [
  { label: "First Name", direction: "right" },
  { label: "Last Name", direction: "right" },
  { label: "Birth Date", direction: "right" },
  { label: "Gender", direction: "right" },
  { label: "Address", direction: "right" },
  { label: "Barangay", direction: "right" },
  { label: "Years in Naga", direction: "right" },
  { label: "Occupation", direction: "right" },
  { label: "Monthly Income", direction: "right" },
];

function createEmptyAnswers(): Record<string, string> {
  return Object.fromEntries(template.map((f) => [f.label, ""])) as Record<
    string,
    string
  >;
}

export default function OcrScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<Record<string, string>>(
    createEmptyAnswers
  );
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showFinalOutput, setShowFinalOutput] = useState(false);

  const setFieldValue = (label: string, value: string) => {
    setFinalAnswers((prev) => ({ ...prev, [label]: value }));
  };

  const pickImage = async () => {
    setError(null);
    setText("");
    setAnswers(null);
    setFinalAnswers(createEmptyAnswers());
    setShowFinalOutput(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setImageUri(asset.uri);
  };

  const openScanner = async () => {
    setError(null);
    setText("");
    setAnswers(null);
    setFinalAnswers(createEmptyAnswers());
    setShowFinalOutput(false);

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError("Camera permission is required to scan documents.");
        return;
      }
    }

    setIsScanning(true);
  };

  const captureFromScanner = async () => {
    setError(null);

    try {
      const pic = await cameraRef.current?.takePictureAsync({
        quality: 1,
        base64: false,
        exif: false,
        skipProcessing: false,
      });

      if (!pic?.uri) {
        setError("Failed to capture image.");
        return;
      }

      setImageUri(pic.uri);
      setIsScanning(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const runOcr = async () => {
    if (!imageUri) return;

    setIsRunning(true);
    setError(null);
    setAnswers(null);
    setShowFinalOutput(false);

    try {
      const words = await recognizeWordsFromUri(imageUri, "eng");
      const labeled = extractLabeledAnswers(words, template);
      setAnswers(labeled);
      setFinalAnswers((prev) => ({ ...prev, ...labeled }));
      setText("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (Platform.OS !== "web") {
        setError(
          `${msg}\n\nMake sure the OCR server is running and EXPO_PUBLIC_OCR_BACKEND_URL points to your PC (LAN IP), e.g. http://192.168.1.50:8787.`
        );
        return;
      }
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  if (isScanning) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-black">
          <CameraView
            ref={(r) => {
              cameraRef.current = r;
            }}
            style={{ flex: 1 }}
            facing="back"
          />

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: 120,
              bottom: 160,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.75)",
              borderRadius: 16,
            }}
          />

          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 16,
              gap: 10,
            }}
          >
            {error ? (
              <View className="bg-red-200/90 rounded-xl p-3">
                <Text className="text-red-900">{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={captureFromScanner}
              className="bg-white rounded-xl px-4 py-3"
            >
              <Text className="text-black font-poppins-semi text-center">
                Capture
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setIsScanning(false)}
              className="bg-[#2C2932] rounded-xl px-4 py-3"
            >
              <Text className="text-white font-poppins-semi text-center">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 font-poppins-reg dark:text-white">
        <ScrollView className="font-poppins-reg bg-indigo-100/30 dark:bg-[#2C2932] flex-1 px-4 py-6">
          <Text className="text-xl dark:text-white mb-3">OCR Prototype</Text>

          {Platform.OS !== "web" ? (
            <View className="bg-white/70 dark:bg-black/20 rounded-xl p-3 mb-4">
              <Text className="dark:text-white">
                On phone, OCR runs via a local backend server (not on-device).
              </Text>
              <Text className="dark:text-white mt-2">
                Start it from the project: ocr-server → npm install → npm start.
              </Text>
              <Text className="dark:text-white mt-2">
                Set EXPO_PUBLIC_OCR_BACKEND_URL to your PC’s LAN IP (not localhost).
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={pickImage}
            className="bg-indigo-900 dark:bg-indigo-900 rounded-xl px-4 py-3 mb-3"
          >
            <Text className="text-white font-poppins-semi text-center">
              Pick Image
            </Text>
          </Pressable>

          <Pressable
            onPress={openScanner}
            className="bg-indigo-900 dark:bg-indigo-900 rounded-xl px-4 py-3 mb-3"
          >
            <Text className="text-white font-poppins-semi text-center">
              Scan with Camera
            </Text>
          </Pressable>

          <Pressable
            onPress={runOcr}
            disabled={!imageUri || isRunning}
            className={`rounded-xl px-4 py-3 mb-4 ${
              !imageUri || isRunning
                ? "bg-gray-400"
                : "bg-indigo-900 dark:bg-indigo-900"
            }`}
          >
            <Text
              className={`font-poppins-semi text-center ${
                !imageUri || isRunning
                  ? "text-white"
                  : "text-white dark:text-black"
              }`}
            >
              {isRunning ? "Running OCR..." : "Run OCR"}
            </Text>
          </Pressable>

          {imageUri ? (
            <View className="mb-4">
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: 240, borderRadius: 12 }}
                contentFit="contain"
              />
            </View>
          ) : null}

          {error ? (
            <View className="bg-red-200/80 dark:bg-red-900/40 rounded-xl p-3 mb-4">
              <Text className="text-red-900 dark:text-red-100">{error}</Text>
            </View>
          ) : null}

          {answers ? (
            <View className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <Text className="dark:text-white mb-2">Answers (editable)</Text>

              {template.map((f) => (
                <View key={f.label} className="mb-3">
                  <Text className="dark:text-white mb-1">{f.label}</Text>
                  <TextInput
                    value={finalAnswers[f.label] ?? ""}
                    onChangeText={(v) => setFieldValue(f.label, v)}
                    placeholder={`Enter ${f.label}`}
                    placeholderTextColor={
                      Platform.OS === "web" ? "#6B7280" : undefined
                    }
                    className="bg-white dark:bg-black/20 dark:text-white rounded-xl px-3 py-2"
                  />
                </View>
              ))}

              <Pressable
                onPress={() => setShowFinalOutput((v) => !v)}
                className="bg-[#2C2932] dark:bg-white rounded-xl px-4 py-3"
              >
                <Text className="text-white dark:text-black font-poppins-semi text-center">
                  {showFinalOutput ? "Hide Final Output" : "Show Final Output"}
                </Text>
              </Pressable>

              {showFinalOutput ? (
                <View className="mt-3">
                  <Text className="dark:text-white mb-2">Final labeled output</Text>
                  <Text className="dark:text-white">
                    {JSON.stringify(finalAnswers, null, 2)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <Text className="dark:text-white">
                Scan or pick an image, then tap Run OCR to generate the editable fields.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}
