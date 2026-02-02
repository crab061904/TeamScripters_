import { Platform } from "react-native";

export type FieldType = "text" | "number" | "date" | "checkbox" | "multi_select";

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
};

export type FormSection = {
  id: string;
  title: string;
  fields: FormField[];
};

export type ExtractionMode = "acroform" | "text" | "ocr";

type TextItem = {
  str: string;
  transform?: number[];
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function isLikelyHeading(text: string): boolean {
  const t = normalize(text);
  if (t.length < 4) return false;
  if (t.length > 60) return false;

  // Heuristic: headings often uppercase / title-like and not ending with underscores.
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return false;

  const upper = letters.replace(/[^A-Z]/g, "").length;
  const ratio = upper / letters.length;

  return ratio > 0.75 || /profile|information|members|household|health/i.test(t);
}

function inferTypeFromLabel(label: string): FieldType {
  const t = label.toLowerCase();
  if (/date|birthday|birth\s*date/i.test(label)) return "date";
  if (/age|years|no\.?|number|income|amount|peso|php/i.test(t)) return "number";
  return "text";
}

function inferTypeFromAcro(annotation: any, label: string): FieldType {
  const fieldType = String(annotation?.fieldType ?? "");
  if (fieldType === "Btn") {
    if (annotation?.checkBox || annotation?.radioButton) return "checkbox";
    return "checkbox";
  }
  if (fieldType === "Ch") {
    const options = Array.isArray(annotation?.options) ? annotation.options : [];
    if (annotation?.multiSelect || options.length > 1) return "multi_select";
    return "text";
  }
  if (fieldType === "Tx") return inferTypeFromLabel(label);
  return inferTypeFromLabel(label);
}

function parseLabelCandidate(raw: string): string | null {
  const t = normalize(raw);

  // Remove common checkbox markers.
  const cleaned = t.replace(/[\[\]☐☑]/g, "").trim();

  // Common label patterns.
  if (/:$/.test(cleaned)) return cleaned.replace(/:$/, "").trim();
  if (/_ {2,}|_{3,}/.test(cleaned)) return cleaned.replace(/_{3,}.*/, "").trim();

  // If it ends with a question mark, treat as label.
  if (/\?$/.test(cleaned) && cleaned.length >= 4) return cleaned.replace(/\?$/, "").trim();

  return null;
}

function extractMultiSelectOptions(line: string): string[] {
  // Look for patterns like "[ ] Yes  [ ] No" or "☐ Yes ☐ No".
  const parts = line
    .split(/\[\s*\]|☐|☑/g)
    .map((p) => normalize(p))
    .filter(Boolean);

  // If we got more than 1 meaningful part, treat as options.
  if (parts.length >= 2) {
    return parts
      .flatMap((p) => p.split(/\s{2,}/g))
      .map((p) => normalize(p))
      .filter(Boolean);
  }

  return [];
}

function getX(item: TextItem): number {
  const tr = item.transform;
  if (!tr || tr.length < 6) return 0;
  return tr[4] ?? 0;
}

function getY(item: TextItem): number {
  const tr = item.transform;
  if (!tr || tr.length < 6) return 0;
  return tr[5] ?? 0;
}

function groupItemsIntoLines(items: TextItem[]): string[] {
  // Very rough line grouping based on y coordinate.
  const sorted = [...items].sort((a, b) => {
    const dy = getY(b) - getY(a);
    if (Math.abs(dy) > 0.5) return dy;
    return getX(a) - getX(b);
  });

  const lines: Array<{ y: number; parts: string[] }> = [];
  const yThreshold = 3; // PDF units; heuristic

  for (const it of sorted) {
    const s = normalize(it.str ?? "");
    if (!s) continue;

    const y = getY(it);
    const last = lines[lines.length - 1];

    if (!last || Math.abs(last.y - y) > yThreshold) {
      lines.push({ y, parts: [s] });
    } else {
      last.parts.push(s);
    }
  }

  return lines
    .map((l) => normalize(l.parts.join(" ")))
    .filter((l) => l.length > 0);
}

async function extractAcroFormSections(doc: any): Promise<FormSection[]> {
  const fields: FormField[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const annotations = (await page.getAnnotations?.()) as any[] | undefined;
    if (!annotations?.length) continue;

    for (const a of annotations) {
      if (a?.subtype !== "Widget") continue;

      const rawName = String(a?.fieldName ?? a?.name ?? "");
      const rawAlt = String(a?.alternativeText ?? a?.title ?? "");
      const label = normalize(rawAlt || rawName || `Field ${fields.length + 1}`);
      const id = `acro__${slugify(rawName || label) || `field-${fields.length + 1}`}`;

      const optionsRaw = Array.isArray(a?.options) ? a.options : [];
      const options = optionsRaw
        .map((o: any) => {
          if (Array.isArray(o) && o.length) return normalize(String(o[o.length - 1]));
          return normalize(String(o));
        })
        .filter(Boolean);

      const type = inferTypeFromAcro(a, label);

      if (fields.some((f) => f.id === id)) continue;

      fields.push({
        id,
        label,
        type,
        options: options.length ? options : undefined,
      });
    }
  }

  if (!fields.length) return [];
  return [{ id: "form-fields", title: "Form Fields", fields }];
}

async function extractTextSections(doc: any): Promise<FormSection[]> {
  const sections: FormSection[] = [];
  let currentSection: FormSection | null = null;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const textContent = await page.getTextContent();
    const items = (textContent.items ?? []) as TextItem[];
    const lines = groupItemsIntoLines(items);

    for (const line of lines) {
      const maybeHeading = isLikelyHeading(line) ? normalize(line) : null;
      if (maybeHeading) {
        const title = maybeHeading.replace(/:$/, "").trim();
        const id = slugify(title) || `section-${sections.length + 1}`;
        currentSection = { id, title, fields: [] };
        sections.push(currentSection);
        continue;
      }

      const label = parseLabelCandidate(line);
      if (!label) continue;

      if (!currentSection) {
        currentSection = { id: "document", title: "Document", fields: [] };
        sections.push(currentSection);
      }

      const options = extractMultiSelectOptions(line);
      const type: FieldType =
        options.length >= 2
          ? "multi_select"
          : /\b(☐|☑|\[\s*\])\b/.test(line)
            ? "checkbox"
            : inferTypeFromLabel(label);

      const fieldId = `${currentSection.id}__${slugify(label) || `field-${currentSection.fields.length + 1}`}`;

      if (currentSection.fields.some((f) => f.id === fieldId)) continue;

      currentSection.fields.push({
        id: fieldId,
        label,
        type,
        options: options.length ? options : undefined,
      });
    }
  }

  return sections.filter((s) => s.fields.length > 0);
}

async function extractOcrSectionsFromFirstPage(doc: any): Promise<FormSection[]> {
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  const dataUrl = canvas.toDataURL("image/png");

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(dataUrl);
    const text = normalize(result.data.text ?? "");
    if (!text) return [];

    const lines = text
      .split(/\r?\n/)
      .map((l) => normalize(l))
      .filter(Boolean);

    const sections: FormSection[] = [];
    let currentSection: FormSection | null = null;

    for (const line of lines) {
      const maybeHeading = isLikelyHeading(line) ? normalize(line) : null;
      if (maybeHeading) {
        const title = maybeHeading.replace(/:$/, "").trim();
        const id = slugify(title) || `section-${sections.length + 1}`;
        currentSection = { id, title, fields: [] };
        sections.push(currentSection);
        continue;
      }

      const label = parseLabelCandidate(line);
      if (!label) continue;

      if (!currentSection) {
        currentSection = { id: "document", title: "Document", fields: [] };
        sections.push(currentSection);
      }

      const type = inferTypeFromLabel(label);
      const fieldId = `${currentSection.id}__${slugify(label) || `field-${currentSection.fields.length + 1}`}`;
      if (currentSection.fields.some((f) => f.id === fieldId)) continue;

      currentSection.fields.push({ id: fieldId, label, type });
    }

    return sections.filter((s) => s.fields.length > 0);
  } finally {
    await worker.terminate();
  }
}

export async function extractDocumentStructureFromPdf(
  pdfData: ArrayBuffer
): Promise<FormSection[]> {
  if (Platform.OS !== "web") {
    throw new Error("Dynamic PDF parsing is only enabled on web in this prototype.");
  }

  const pdfjs = await import("pdfjs-dist");
  const pdfjsAny = pdfjs as unknown as any;

  const version =
    typeof pdfjsAny.version === "string" && pdfjsAny.version.length
      ? pdfjsAny.version
      : "4.10.38";
  pdfjsAny.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

  const doc = await pdfjsAny.getDocument({ data: pdfData }).promise;

  const acro = await extractAcroFormSections(doc);
  if (acro.length) return acro;

  const textSections = await extractTextSections(doc);
  if (textSections.length) return textSections;

  const ocrSections = await extractOcrSectionsFromFirstPage(doc);
  return ocrSections;
}

export async function extractDocumentStructureWithModeFromPdf(
  pdfData: ArrayBuffer
): Promise<{ sections: FormSection[]; mode: ExtractionMode } > {
  if (Platform.OS !== "web") {
    throw new Error("Dynamic PDF parsing is only enabled on web in this prototype.");
  }

  const pdfjs = await import("pdfjs-dist");
  const pdfjsAny = pdfjs as unknown as any;

  const version =
    typeof pdfjsAny.version === "string" && pdfjsAny.version.length
      ? pdfjsAny.version
      : "4.10.38";
  pdfjsAny.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

  const doc = await pdfjsAny.getDocument({ data: pdfData }).promise;

  const acro = await extractAcroFormSections(doc);
  if (acro.length) return { sections: acro, mode: "acroform" };

  const textSections = await extractTextSections(doc);
  if (textSections.length) return { sections: textSections, mode: "text" };

  const ocrSections = await extractOcrSectionsFromFirstPage(doc);
  return { sections: ocrSections, mode: "ocr" };
}
