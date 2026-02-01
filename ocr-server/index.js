const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createWorker } = require("tesseract.js");

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

async function withWorker(lang, fn) {
  const worker = await createWorker(lang);
  try {
    return await fn(worker);
  } finally {
    await worker.terminate();
  }
}

app.post("/ocr/words", upload.single("image"), async (req, res) => {
  try {
    const lang = typeof req.query.lang === "string" ? req.query.lang : "eng";

    if (!req.file || !req.file.buffer) {
      res.status(400).json({ error: "Missing image file (multipart field: image)" });
      return;
    }

    const out = await withWorker(lang, async (worker) => {
      const result = await worker.recognize(req.file.buffer);

      const words = Array.isArray(result?.data?.words) ? result.data.words : [];

      return {
        text: result?.data?.text ?? "",
        words: words
          .map((w) => ({
            text: (w.text ?? "").trim(),
            bbox: w.bbox,
            confidence: w.confidence,
          }))
          .filter((w) => w.text.length > 0 && w.bbox),
      };
    });

    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`OCR server listening on http://0.0.0.0:${port}`);
});
