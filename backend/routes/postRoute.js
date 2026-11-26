import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  getAllPosts,
  createPost,
  reactPost,
  addComment,
  deletePost,
} from "../controllers/postController.js";

const postRouter = express.Router();

const uploadDir = path.resolve("uploads");
const tempChunkDir = path.resolve("uploads/.chunks");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(tempChunkDir, { recursive: true });

// တစ်ပြိုင်နက်တည်း upload-complete နှစ်ခါ မပေါင်းမိအောင် lock
const assemblingSessions = new Set();

const VIDEO_MIME_MAP = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mkv": "video/x-matroska",
};

const sanitizeId = (val) => String(val || "").replace(/[^a-zA-Z0-9_-]/g, "");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname || "media")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempChunkDir),
  filename: (req, file, cb) => {
    const rawUploadId = req.body?.uploadId || req.query?.uploadId || "unknown";
    const rawIndex = req.body?.chunkIndex ?? req.query?.chunkIndex ?? "0";
    const safeUploadId = sanitizeId(rawUploadId) || "unknown";
    const safeIdx = Math.max(0, Number.parseInt(String(rawIndex), 10) || 0);
    cb(null, `${safeUploadId}.part_${safeIdx}`);
  },
});

const upload = multer({ storage });
const uploadChunk = multer({ storage: chunkStorage });

// 0a) Refresh လုပ်ပြီးနောက် ရောက်ပြီးသား chunk များကို ပြန်စစ်ရန်
postRouter.get("/upload-status/:uploadId", (req, res) => {
  try {
    const safeUploadId = sanitizeId(req.params.uploadId);
    const totalChunks = Math.max(0, Number(req.query.totalChunks || 0));

    if (!safeUploadId || !fs.existsSync(tempChunkDir)) {
      return res.json({
        success: true,
        uploadId: safeUploadId,
        totalChunks,
        uploadedChunks: [],
        uploadedBytes: 0,
      });
    }

    const prefix = `${safeUploadId}.part_`;
    const files = fs.readdirSync(tempChunkDir);

    const uploadedChunks = files
      .filter((f) => f.startsWith(prefix))
      .map((f) => Number(f.slice(prefix.length)))
      .filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => a - b);

    let uploadedBytes = 0;
    for (const idx of uploadedChunks) {
      const partPath = path.join(tempChunkDir, `${prefix}${idx}`);
      if (fs.existsSync(partPath)) {
        uploadedBytes += fs.statSync(partPath).size;
      }
    }

    return res.json({
      success: true,
      uploadId: safeUploadId,
      totalChunks,
      uploadedChunks,
      uploadedBytes,
    });
  } catch (err) {
    console.error("upload-status error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Upload status စစ်၍မရပါ" });
  }
});

// 0b) Incomplete chunk များကို ဖျက်သိမ်းရန်
postRouter.post("/upload-cancel", (req, res) => {
  try {
    const safeUploadId = sanitizeId(req.body?.uploadId);

    if (safeUploadId && fs.existsSync(tempChunkDir)) {
      const prefix = `${safeUploadId}.part_`;
      const files = fs.readdirSync(tempChunkDir);
      for (const f of files) {
        if (f.startsWith(prefix)) {
          fs.unlink(path.join(tempChunkDir, f), () => {});
        }
      }
    }

    return res.json({ success: true, message: "Upload ဖျက်သိမ်းပြီးပါပြီ" });
  } catch (err) {
    console.error("upload-cancel error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Upload ဖျက်သိမ်း၍မရပါ" });
  }
});

// 1) Receive a single video chunk
postRouter.post("/upload-chunk", uploadChunk.single("chunk"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Chunk ဖိုင် မပါဝင်ပါ" });
    }
    const idx = Number.parseInt(
      String(req.body?.chunkIndex ?? req.query?.chunkIndex ?? 0),
      10
    );
    return res.json({
      success: true,
      chunkIndex: Number.isNaN(idx) ? 0 : idx,
    });
  } catch (err) {
    console.error("upload-chunk error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Chunk upload error" });
  }
});

// 2) Assemble chunks into final video file & create post
postRouter.post("/upload-complete", async (req, res) => {
  const {
    uploadId,
    totalChunks,
    fileName = "video.mp4",
    author = "IBRIDGE Member",
    userId = "",
    content = "",
  } = req.body || {};

  const total = Number(totalChunks || 0);
  const safeUploadId = sanitizeId(uploadId);

  if (!safeUploadId || total <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid upload session" });
  }

  if (assemblingSessions.has(safeUploadId)) {
    return res.status(409).json({
      success: false,
      message: "ဗီဒီယို ပေါင်းစပ်နေဆဲ ဖြစ်ပါသည်",
    });
  }

  assemblingSessions.add(safeUploadId);

  const safeBase = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalFilename = `${Date.now()}_${safeBase}`;
  const finalPath = path.join(uploadDir, finalFilename);
  let writeStream = null;

  try {
    writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < total; i++) {
      const partPath = path.join(tempChunkDir, `${safeUploadId}.part_${i}`);
      if (!fs.existsSync(partPath)) {
        writeStream.destroy();
        if (fs.existsSync(finalPath)) {
          fs.unlink(finalPath, () => {});
        }
        return res.status(400).json({
          success: false,
          message: `Chunk ${i} ပျောက်ဆုံးနေပါသည်`,
        });
      }

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(partPath);
        const onError = (err) => {
          readStream.destroy();
          reject(err);
        };
        readStream.on("error", onError);
        writeStream.once("error", onError);
        readStream.on("end", () => {
          writeStream.removeListener("error", onError);
          fs.unlink(partPath, () => {});
          resolve();
        });
        readStream.pipe(writeStream, { end: false });
      });
    }

    await new Promise((resolve, reject) => {
      writeStream.once("finish", resolve);
      writeStream.once("error", reject);
      writeStream.end();
    });

    const ext = path.extname(safeBase).toLowerCase();
    const mimeType = VIDEO_MIME_MAP[ext] || "video/mp4";

    req.file = {
      filename: finalFilename,
      originalname: safeBase,
      mimetype: mimeType,
      path: finalPath,
    };
    req.body = {
      author,
      userId,
      content,
      mediaType: "video",
    };

    return await createPost(req, res);
  } catch (err) {
    console.error("upload-complete error:", err);
    if (writeStream && !writeStream.destroyed) {
      writeStream.destroy();
    }
    if (fs.existsSync(finalPath)) {
      fs.unlink(finalPath, () => {});
    }
    return res.status(500).json({
      success: false,
      message: "ဗီဒီယို ပေါင်းစပ်ရာတွင် အမှားရှိပါသည်",
    });
  } finally {
    assemblingSessions.delete(safeUploadId);
  }
});

// 3) YouTube-style HTTP Range Video Streaming
postRouter.get("/stream/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename || "");
  const filePath = path.join(uploadDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(safeName).toLowerCase();
  const contentType = VIDEO_MIME_MAP[ext] || "video/mp4";

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const chunkSize = 1024 * 1024 * 2; // 2MB per stream chunk
    const end = parts[1]
      ? Math.min(parseInt(parts[1], 10), fileSize - 1)
      : Math.min(start + chunkSize - 1, fileSize - 1);

    if (Number.isNaN(start) || start < 0 || start >= fileSize || start > end) {
      res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
      return;
    }

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": contentType,
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

postRouter.get("/list", getAllPosts);
postRouter.post("/create", upload.single("media"), createPost);
postRouter.post("/react", reactPost);
postRouter.post("/comment", addComment);
postRouter.post("/delete", deletePost);

export default postRouter;