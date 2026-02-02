import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type DocumentFields = {
  name: string;
  studentId: string;
  school: string;
  program: string;
  dates: string;
};

export type DocumentOutput = {
  document: {
    name: string;
    mimeType?: string;
    kind?: string;
    size?: number;
  };
  fields: DocumentFields;
};

export type AppointmentInfo = {
  monthLabel: string;
  selectedDay: number;
  selectedTime: string;
  selectedDateLabel: string;
};

export type ApplicationDraft = {
  documents: DocumentOutput[];
  updatedAt: string;
};

export type ApplicationRecord = {
  id: string;
  createdAt: string;
  documents: DocumentOutput[];
  appointment: AppointmentInfo;
  qrPayload: string;
};

const ROOT_DIR =
  ((FileSystem as unknown as { documentDirectory?: string }).documentDirectory ??
    (FileSystem as unknown as { cacheDirectory?: string }).cacheDirectory ??
    "");

const BASE_DIR = `${ROOT_DIR}application-data/`;
const DRAFT_PATH = `${BASE_DIR}draft.json`;
const RECORDS_DIR = `${BASE_DIR}records/`;

const WEB_DRAFT_KEY = "application-data:draft";
const WEB_RECORD_PREFIX = "application-data:record:";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export async function saveDraftDocuments(documents: DocumentOutput[]) {
  const draft: ApplicationDraft = {
    documents,
    updatedAt: new Date().toISOString(),
  };

  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(WEB_DRAFT_KEY, JSON.stringify(draft));
    }
    return draft;
  }

  await ensureDir(BASE_DIR);
  await FileSystem.writeAsStringAsync(DRAFT_PATH, JSON.stringify(draft));
  return draft;
}

async function ensureDir(path: string) {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && info.isDirectory) return;
  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

function makeId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

export async function saveDraft(documentFields: DocumentFields) {
  const draft: ApplicationDraft = {
    documents: [
      {
        document: {
          name: "Document 1",
        },
        fields: documentFields,
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(WEB_DRAFT_KEY, JSON.stringify(draft));
    }
    return draft;
  }

  await ensureDir(BASE_DIR);
  await FileSystem.writeAsStringAsync(DRAFT_PATH, JSON.stringify(draft));
  return draft;
}

export async function loadDraft(): Promise<ApplicationDraft | null> {
  try {
    if (Platform.OS === "web") {
      if (!canUseLocalStorage()) return null;
      const text = window.localStorage.getItem(WEB_DRAFT_KEY);
      if (!text) return null;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.documents)) return parsed as ApplicationDraft;
      if (parsed?.documentFields) {
        const legacy = parsed as { documentFields: DocumentFields; updatedAt: string };
        return {
          documents: [
            {
              document: { name: "Document 1" },
              fields: legacy.documentFields,
            },
          ],
          updatedAt: legacy.updatedAt,
        };
      }
      return null;
    }

    const info = await FileSystem.getInfoAsync(DRAFT_PATH);
    if (!info.exists) return null;
    const text = await FileSystem.readAsStringAsync(DRAFT_PATH);
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.documents)) return parsed as ApplicationDraft;
    if (parsed?.documentFields) {
      const legacy = parsed as { documentFields: DocumentFields; updatedAt: string };
      return {
        documents: [
          {
            document: { name: "Document 1" },
            fields: legacy.documentFields,
          },
        ],
        updatedAt: legacy.updatedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveFinalRecord(params: {
  documents: DocumentOutput[];
  appointment: AppointmentInfo;
}) {
  const id = makeId();
  const createdAt = new Date().toISOString();
  const payloadObj = {
    id,
    createdAt,
    documents: params.documents,
    appointment: params.appointment,
  };
  const qrPayload = JSON.stringify(payloadObj);

  const record: ApplicationRecord = {
    id,
    createdAt,
    documents: params.documents,
    appointment: params.appointment,
    qrPayload,
  };

  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(`${WEB_RECORD_PREFIX}${id}`, JSON.stringify(record));
    }
    return record;
  }

  await ensureDir(RECORDS_DIR);
  await FileSystem.writeAsStringAsync(`${RECORDS_DIR}${id}.json`, JSON.stringify(record));
  return record;
}
