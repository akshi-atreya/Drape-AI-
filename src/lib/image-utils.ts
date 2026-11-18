/**
 * Re-encodes any image (data URL or object URL) into a small, guaranteed-
 * valid JPEG. Keeps photos light enough to store with saved looks
 * and to send with a try-on request.
 */
export function resizeToJpegDataUrl(src: string, maxDimension = 640, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      // JPEG has no alpha — paint white first so transparent PNG cutouts don't turn black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("not a valid image"));
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("couldn't read file"));
    reader.readAsDataURL(file);
  });
}

/** A specific, human-readable explanation of why an image couldn't be used. */
export interface UploadProblem {
  title: string;
  /** e.g. "IMG_4021.HEIC · HEIC · 3.2 MB" */
  fileInfo?: string;
  /** Why it failed. */
  reason: string;
  /** What to do about it. */
  fix?: string;
}

export class UploadProblemError extends Error {
  constructor(public problem: UploadProblem) {
    super(problem.reason);
  }
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const DECODABLE = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "svg"]);

function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${bytes === 0 ? 0 : Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Works out the real format from the MIME type, falling back to the extension. */
function formatOf(file: File): string {
  const fromMime = file.type.includes("/") ? file.type.split("/")[1].toLowerCase().replace("x-", "").replace("+xml", "") : "";
  const ext = extensionOf(file.name);
  return (ext || fromMime || "unknown").replace("jpeg", "jpg");
}

const CONVERT_HINT =
  "Save or export it as a JPG or PNG (on a Mac: open it in Preview → File → Export → JPEG), or take a screenshot of the image and upload that.";

/** Explains exactly why a file can't be used, or returns null if it looks fine to try. */
export function checkImageFile(file: File): UploadProblem | null {
  const fmt = formatOf(file);
  const label = fmt === "unknown" ? "unknown format" : fmt.toUpperCase();
  const fileInfo = `${file.name || "Unnamed file"} · ${label} · ${formatSize(file.size)}`;

  if (file.size === 0) {
    return { title: "That file is empty", fileInfo, reason: "The file is 0 KB, so there's no image data in it. This often happens when a photo is still downloading from iCloud or a cloud drive.", fix: "Wait for it to finish downloading, or choose a different file." };
  }
  if (fmt === "heic" || fmt === "heif") {
    return { title: "HEIC photos aren't supported", fileInfo, reason: "This is a HEIC/HEIF image — the default format on iPhones. Most browsers (including Chrome) can't open that format.", fix: "On iPhone: Settings → Camera → Formats → Most Compatible. Or export the photo as JPEG. On a Mac: open it in Preview → File → Export → JPEG." };
  }
  if (fmt === "pdf") {
    return { title: "That's a PDF, not an image", fileInfo, reason: "PDFs can't be used as a photo.", fix: "Take a screenshot of the item or page, or export it as a JPG or PNG." };
  }
  if (file.type.startsWith("video/") || ["mp4", "mov", "webm", "avi", "mkv"].includes(fmt)) {
    return { title: "That's a video, not an image", fileInfo, reason: "Only still images can be used here.", fix: "Pick a still photo, or screenshot a frame from the video." };
  }
  if (fmt === "tif" || fmt === "tiff") {
    return { title: "TIFF images aren't supported", fileInfo, reason: "Browsers can't display TIFF files.", fix: CONVERT_HINT };
  }
  if (!file.type.startsWith("image/") && !DECODABLE.has(fmt)) {
    return { title: "That file type isn't supported", fileInfo, reason: `Files of type "${label}" aren't images this app can read. Supported: JPG, PNG, WebP, GIF, AVIF, BMP.`, fix: "Choose a photo or screenshot in one of those formats." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { title: "That image is too large", fileInfo, reason: `The file is ${formatSize(file.size)}; the limit is 25 MB.`, fix: "Choose a smaller image, or take a screenshot of it." };
  }
  return null;
}

/**
 * Validates, decodes and re-encodes an uploaded file as a small JPEG, throwing
 * an UploadProblemError with a specific reason if anything goes wrong.
 */
export async function loadImageFile(file: File, maxDimension: number, quality: number): Promise<string> {
  const problem = checkImageFile(file);
  if (problem) throw new UploadProblemError(problem);

  const fmt = formatOf(file);
  const fileInfo = `${file.name || "Unnamed file"} · ${fmt.toUpperCase()} · ${formatSize(file.size)}`;

  let dataUrl: string;
  try {
    dataUrl = await fileToDataUrl(file);
  } catch {
    throw new UploadProblemError({
      title: "Couldn't read that file",
      fileInfo,
      reason: "The browser couldn't open the file. It may have been moved or deleted, or it's in a cloud folder that hasn't finished syncing.",
      fix: "Try choosing it again, or copy it to your desktop first.",
    });
  }

  try {
    return await resizeToJpegDataUrl(dataUrl, maxDimension, quality);
  } catch {
    throw new UploadProblemError({
      title: "This image looks damaged",
      fileInfo,
      reason: `The file is named as a ${fmt.toUpperCase()}, but its contents couldn't be decoded as an image. It may be corrupted, partly downloaded, or actually a different format with the wrong extension.`,
      fix: CONVERT_HINT,
    });
  }
}

/** Explains a getUserMedia (camera) failure. */
export function describeCameraError(err: unknown): UploadProblem {
  const name = err instanceof DOMException ? err.name : "";
  if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
    return { title: "Camera isn't available here", reason: "Browsers only allow camera access on secure (https) pages, and this browser doesn't expose a camera on this page.", fix: "Open the site over https, or upload a photo instead." };
  }
  if (name === "NotAllowedError" || name === "SecurityError") {
    return { title: "Camera access was blocked", reason: "Permission to use the camera was denied for this site.", fix: "Click the camera/lock icon in the address bar, allow the camera, then try again — or upload a photo instead." };
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return { title: "No camera found", reason: "This device doesn't seem to have a camera that the browser can use.", fix: "Upload a photo instead." };
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return { title: "Camera is busy", reason: "Another app (like a video call) may be using the camera, or the browser couldn't start it.", fix: "Close other apps using the camera and try again, or upload a photo instead." };
  }
  return { title: "Couldn't start the camera", reason: "The browser reported an unexpected camera error.", fix: "Try again, or upload a photo instead." };
}
