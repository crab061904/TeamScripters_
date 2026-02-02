import { Platform } from "react-native";

export type OcrWordBox = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence?: number;
};

export type FormFieldTemplate = {
  label: string;
  direction: "right" | "below";
  maxDistance?: number;
  maxSecondaryDistance?: number;
};

type BackendOcrWordsResponse = {
  text: string;
  words: OcrWordBox[];
};

function getOcrBackendUrl(): string {
  const fromEnv = (process.env as any)?.EXPO_PUBLIC_OCR_BACKEND_URL;
  return typeof fromEnv === "string" && fromEnv.length
    ? fromEnv
    : "http://localhost:8787";
}

async function recognizeWordsViaBackend(
  uri: string,
  lang: string
): Promise<BackendOcrWordsResponse> {
  const baseUrl = getOcrBackendUrl().replace(/\/$/, "");
  const url = `${baseUrl}/ocr/words?lang=${encodeURIComponent(lang)}`;

  const form = new FormData();

  // React Native supports multipart file upload via { uri, name, type }.
  form.append(
    "image",
    {
      uri,
      name: "image.jpg",
      type: "image/jpeg",
    } as any
  );

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`OCR backend error: ${res.status} ${res.statusText} ${msg}`);
  }

  const json = (await res.json()) as BackendOcrWordsResponse;
  return {
    text: typeof json.text === "string" ? json.text : "",
    words: Array.isArray(json.words) ? json.words : [],
  };
}

export async function recognizeImageFromUri(
  uri: string,
  lang: string = "eng"
): Promise<string> {
  if (Platform.OS !== "web") {
    const out = await recognizeWordsViaBackend(uri, lang);
    return out.text;
  }

  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker(lang);

  try {
    // Prefer passing URLs directly to tesseract on web when possible.
    // Some Expo URIs (blob:, data:) are already browser-friendly.
    const isDirect =
      uri.startsWith("blob:") ||
      uri.startsWith("data:") ||
      uri.startsWith("http://") ||
      uri.startsWith("https://");

    if (isDirect) {
      const result = await worker.recognize(uri);
      return result.data.text ?? "";
    }

    // Fallback: fetch the resource and feed tesseract an object URL.
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      try {
        const result = await worker.recognize(objectUrl);
        return result.data.text ?? "";
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      // Last resort: let tesseract try to resolve it.
      const result = await worker.recognize(uri);
      return result.data.text ?? "";
    }
  } finally {
    await worker.terminate();
  }
}

export async function recognizeWordsFromUri(
  uri: string,
  lang: string = "eng"
): Promise<OcrWordBox[]> {
  if (Platform.OS !== "web") {
    const out = await recognizeWordsViaBackend(uri, lang);
    return out.words;
  }

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(lang);

  try {
    const isDirect =
      uri.startsWith("blob:") ||
      uri.startsWith("data:") ||
      uri.startsWith("http://") ||
      uri.startsWith("https://");

    const recognizeAndExtract = async (input: string) => {
      const result = await worker.recognize(input);
      const data = (result.data as unknown) as { words?: unknown };
      const words = (Array.isArray(data.words) ? data.words : []) as Array<{
        text: string;
        bbox: { x0: number; y0: number; x1: number; y1: number };
        confidence?: number;
      }>;

      return words
        .map((w) => ({
          text: (w.text ?? "").trim(),
          bbox: w.bbox,
          confidence: w.confidence,
        }))
        .filter((w) => w.text.length > 0);
    };

    if (isDirect) {
      return await recognizeAndExtract(uri);
    }

    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      try {
        return await recognizeAndExtract(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return await recognizeAndExtract(uri);
    }
  } finally {
    await worker.terminate();
  }
}

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\.:]+/g, "")
    .trim();
}

function tokens(s: string): string[] {
  return normalizeLabel(s)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function centerY(w: OcrWordBox): number {
  return (w.bbox.y0 + w.bbox.y1) / 2;
}

function centerX(w: OcrWordBox): number {
  return (w.bbox.x0 + w.bbox.x1) / 2;
}

function tryFindLabelAnchor(words: OcrWordBox[], label: string): OcrWordBox | null {
  const labelTokens = tokens(label);
  if (labelTokens.length === 0) return null;

  const normalizedWords = words.map((w) => ({
    w,
    t: normalizeLabel(w.text),
  }));

  for (let i = 0; i < normalizedWords.length; i++) {
    let j = 0;
    let k = i;
    while (j < labelTokens.length && k < normalizedWords.length) {
      if (normalizedWords[k].t === labelTokens[j]) {
        j++;
        k++;
        continue;
      }
      break;
    }

    if (j === labelTokens.length) {
      const matched = normalizedWords.slice(i, k).map((x) => x.w);
      return matched.reduce((acc, cur) => (cur.bbox.x1 > acc.bbox.x1 ? cur : acc));
    }
  }

  return null;
}

export function extractLabeledAnswers(
  words: OcrWordBox[],
  template: FormFieldTemplate[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const field of template) {
    const anchor = tryFindLabelAnchor(words, field.label);
    if (!anchor) {
      result[field.label] = "";
      continue;
    }

    const maxDistance = field.maxDistance ?? 500;
    const maxSecondary = field.maxSecondaryDistance ?? 30;

    let candidates: OcrWordBox[] = [];

    if (field.direction === "right") {
      const y0 = anchor.bbox.y0 - maxSecondary;
      const y1 = anchor.bbox.y1 + maxSecondary;

      candidates = words
        .filter((w) => {
          const sameLine = centerY(w) >= y0 && centerY(w) <= y1;
          const toRight = w.bbox.x0 >= anchor.bbox.x1;
          const within = w.bbox.x0 - anchor.bbox.x1 <= maxDistance;
          return sameLine && toRight && within;
        })
        .sort((a, b) => centerX(a) - centerX(b));
    } else {
      const x0 = anchor.bbox.x0 - maxSecondary;
      const x1 = anchor.bbox.x1 + maxSecondary;

      candidates = words
        .filter((w) => {
          const below = w.bbox.y0 >= anchor.bbox.y1;
          const within = w.bbox.y0 - anchor.bbox.y1 <= maxDistance;
          const sameColumn = centerX(w) >= x0 && centerX(w) <= x1;
          return below && within && sameColumn;
        })
        .sort((a, b) => centerY(a) - centerY(b));
    }

    const answer = candidates.map((w) => w.text).join(" ").trim();
    result[field.label] = answer;
  }

  return result;
}
