import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
const maxImageBytes = 5 * 1024 * 1024;
const maxVideoBytes = 20 * 1024 * 1024;

function ensureUploadDir() {
  return fs.mkdir(path.join(process.cwd(), "public", "uploads", "products"), {
    recursive: true
  });
}

function isReadOnlyFileSystemError(error) {
  const code = String(error?.code || "").toUpperCase();
  return code === "EROFS" || code === "EPERM" || code === "EACCES";
}

function getExtension(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  return "bin";
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid upload payload.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

export function validateMediaSelection(files) {
  const imageCount = files.filter((file) => imageTypes.includes(file.type)).length;
  const videoCount = files.filter((file) => videoTypes.includes(file.type)).length;

  if (imageCount > 4) {
    throw new Error("Maximum 4 pictures per product.");
  }

  if (videoCount > 1) {
    throw new Error("Maximum 1 video per product.");
  }
}

export async function saveProductMediaUpload({ dataUrl, kind }) {
  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const isImage = kind === "image";

  if (isImage && !imageTypes.includes(mimeType)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed.");
  }

  if (!isImage && !videoTypes.includes(mimeType)) {
    throw new Error("Only MP4, WEBM, and MOV videos are allowed.");
  }

  if (isImage && buffer.length > maxImageBytes) {
    throw new Error("Each image must be 5MB or smaller.");
  }

  if (!isImage && buffer.length > maxVideoBytes) {
    throw new Error("Video must be 20MB or smaller.");
  }

  await ensureUploadDir();

  const extension = getExtension(mimeType);
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const relativePath = `/uploads/products/${filename}`;
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await fs.writeFile(absolutePath, buffer);
  } catch (error) {
    if (!isReadOnlyFileSystemError(error)) {
      throw error;
    }

    return {
      url: dataUrl,
      mimeType,
      storage: "inline"
    };
  }

  return {
    url: relativePath,
    mimeType,
    storage: "filesystem"
  };
}

export const mediaRules = {
  imageTypes,
  videoTypes,
  maxImageBytes,
  maxVideoBytes
};
