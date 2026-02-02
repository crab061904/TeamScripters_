import {
    extractDocumentStructureWithModeFromPdf,
    ExtractionMode,
    FieldType,
    FormField,
    FormSection,
} from "@/src/services/pdfFormSchema";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

type FieldValue = string | number | boolean | string[];

type ValuesById = Record<string, FieldValue | undefined>;

function emptyValueForType(type: FieldType): FieldValue {
  switch (type) {
    case "checkbox":
      return false;
    case "multi_select":
      return [];
    case "number":
      return "";
    case "date":
      return "";
    case "text":
    default:
      return "";
  }
}

function getDisplayValue(value: FieldValue | undefined): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.join(", ");
  return "";
}

function inferKeyboard(type: FieldType): "default" | "numeric" {
  return type === "number" ? "numeric" : "default";
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  if (field.type === "checkbox") {
    const checked = Boolean(value);
    return (
      <Pressable
        onPress={() => onChange(!checked)}
        className={`rounded-xl px-3 py-3 ${checked ? "bg-[#F33C25]" : "bg-white"}`}
      >
        <Text className={checked ? "text-white" : "text-black"}>
          {checked ? "Checked" : "Unchecked"}
        </Text>
      </Pressable>
    );
  }

  if (field.type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    const options = field.options ?? [];

    if (!options.length) {
      return (
        <TextInput
          value={getDisplayValue(value)}
          onChangeText={(t) => onChange(t)}
          placeholder="Enter value"
          placeholderTextColor={Platform.OS === "web" ? "#6B7280" : undefined}
          className="bg-white dark:bg-black/20 dark:text-white rounded-xl px-3 py-2"
        />
      );
    }

    return (
      <View className="gap-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              onPress={() => {
                if (isOn) {
                  onChange(selected.filter((x) => x !== opt));
                } else {
                  onChange([...selected, opt]);
                }
              }}
              className={`rounded-xl px-3 py-3 ${isOn ? "bg-[#F33C25]" : "bg-white"}`}
            >
              <Text className={isOn ? "text-white" : "text-black"}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <TextInput
      value={getDisplayValue(value)}
      onChangeText={(t) => onChange(t)}
      placeholder={
        field.type === "date"
          ? "YYYY-MM-DD"
          : field.type === "number"
            ? "Enter a number"
            : "Enter text"
      }
      keyboardType={inferKeyboard(field.type)}
      placeholderTextColor={Platform.OS === "web" ? "#6B7280" : undefined}
      className="bg-white dark:bg-black/20 dark:text-white rounded-xl px-3 py-2"
    />
  );
}

export default function DynamicFormScreen() {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [values, setValues] = useState<ValuesById>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ExtractionMode | null>(null);

  const activeSection = useMemo(() => {
    if (!activeSectionId) return null;
    return sections.find((s) => s.id === activeSectionId) ?? null;
  }, [activeSectionId, sections]);

  const pickPdf = async () => {
    setError(null);

    if (Platform.OS !== "web") {
      setError("PDF parsing is enabled on Web only in this prototype.");
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      setError("No PDF selected.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(asset.uri);
      if (!res.ok) {
        throw new Error(`Failed to load PDF: ${res.status} ${res.statusText}`);
      }
      const buf = await res.arrayBuffer();

      const parsed = await extractDocumentStructureWithModeFromPdf(buf);
      setMode(parsed.mode);
      setSections(parsed.sections);
      setActiveSectionId(parsed.sections[0]?.id ?? null);

      const nextValues: ValuesById = {};
      for (const s of parsed.sections) {
        for (const f of s.fields) {
          nextValues[f.id] = emptyValueForType(f.type);
        }
      }
      setValues(nextValues);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSections([]);
      setActiveSectionId(null);
      setValues({});
      setMode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setField = (field: FormField, v: FieldValue) => {
    setValues((prev) => ({ ...prev, [field.id]: v }));
  };

  return (
    <SafeAreaProvider>
      <View className="flex-1 font-poppins-reg dark:text-white">
        <ScrollView className="font-poppins-reg bg-indigo-100/30 dark:bg-[#2C2932] flex-1 px-4 py-6">
          <Text className="text-xl dark:text-white mb-3">
            Dynamic PDF Form Builder
          </Text>

          <Pressable
            onPress={pickPdf}
            className="bg-[#F33C25] dark:bg-[#FB634B] rounded-xl px-4 py-3 mb-3"
          >
            <Text className="text-white font-poppins-semi text-center">
              {isLoading ? "Parsing PDF..." : "Select PDF"}
            </Text>
          </Pressable>

          {error ? (
            <View className="bg-red-200/80 dark:bg-red-900/40 rounded-xl p-3 mb-4">
              <Text className="text-red-900 dark:text-red-100">{error}</Text>
            </View>
          ) : null}

          {mode ? (
            <View className="bg-white/70 dark:bg-black/20 rounded-xl p-3 mb-4">
              <Text className="dark:text-white">Extraction mode: {mode}</Text>
            </View>
          ) : null}

          {sections.length ? (
            <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {sections.map((s) => {
                  const active = s.id === activeSectionId;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setActiveSectionId(s.id)}
                      className={`rounded-xl px-4 py-2 ${active ? "bg-[#2C2932] dark:bg-white" : "bg-white dark:bg-black/20"}`}
                    >
                      <Text
                        className={`${active ? "text-white dark:text-black" : "text-black dark:text-white"}`}
                      >
                        {s.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <Text className="dark:text-white">
                Select a PDF to generate tabs and input fields.
              </Text>
            </View>
          )}

          {activeSection ? (
            <View className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
              <Text className="text-lg dark:text-white mb-2">
                {activeSection.title}
              </Text>

              {activeSection.fields.map((field) => (
                <View key={field.id} className="mb-4">
                  <Text className="dark:text-white mb-1">{field.label}</Text>
                  <FieldInput
                    field={field}
                    value={values[field.id]}
                    onChange={(v) => setField(field, v)}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}
