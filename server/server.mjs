import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

dotenv.config({
  path: path.join(currentDirectory, ".env"),
  override: true,
});

const app = express();
const port = process.env.PORT || 5000;
const rawPinataJwt =
  process.env.PINATA_JWT?.trim() || "";

const jwtMatch = rawPinataJwt.match(
  /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/
);

const pinataJwt = jwtMatch?.[0];

if (!pinataJwt) {
  console.error("PINATA_JWT is missing from server/.env");
  process.exit(1);
}

console.log("Pinata JWT loaded:", {
  validFormat:
    pinataJwt.startsWith("eyJ") &&
    pinataJwt.split(".").length === 3,
  length: pinataJwt.length,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BlockVault backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BlockVault backend is running",
  });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Encrypted file is required.",
      });
    }

    const file = new File(
      [req.file.buffer],
      req.file.originalname,
      {
        type:
          req.file.mimetype ||
          "application/octet-stream",
      }
    );

    const formData = new FormData();
    formData.append("network", "public");
    formData.append("file", file);
    formData.append("name", req.file.originalname);

    const pinataResponse = await fetch(
      "https://uploads.pinata.cloud/v3/files",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: formData,
      }
    );

    const responseText = await pinataResponse.text();

    let payload;
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }

    if (!pinataResponse.ok) {
      const message =
        payload?.error?.message ||
        payload?.error?.reason ||
        payload?.message ||
        `Pinata error ${pinataResponse.status}`;

      throw new Error(message);
    }

    const result = payload.data || payload;

    return res.status(201).json({
      success: true,
      message: "Encrypted file uploaded to IPFS.",
      cid: result.cid,
      name: result.name,
      size: result.size,
    });
  } catch (error) {
    console.error("IPFS upload failed:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "IPFS upload failed.",
    });
  }
});

app.listen(port, () => {
  console.log(
    `BlockVault backend running at http://localhost:${port}`
  );
});