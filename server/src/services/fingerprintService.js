const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const https = require("https");
const { spawnSync } = require("child_process");
const CopyrightReference = require("../models/copyrightReference.model");

const FFMPEG_BIN = "ffmpeg";

const verifyFfmpegAvailability = () => {
  const result = spawnSync(FFMPEG_BIN, ["-version"], {
    stdio: "pipe",
    encoding: "utf8",
  });

  return !result.error && result.status === 0;
};

const cleanupDirectory = (dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return;
  }

  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (error) {
    // fail silently for temp cleanup
  }
};

const downloadMediaSource = (mediaUrl, destinationPath, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(mediaUrl);
    } catch (error) {
      reject(new Error("A valid media URL is required."));
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      reject(new Error("Only HTTP and HTTPS media URLs are supported."));
      return;
    }

    const request = (parsedUrl.protocol === "https:" ? https : http).get(
      parsedUrl,
      (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          response.resume();

          if (redirectCount >= 5 || !response.headers.location) {
            reject(new Error("Too many media URL redirects."));
            return;
          }

          downloadMediaSource(
            new URL(response.headers.location, parsedUrl).toString(),
            destinationPath,
            redirectCount + 1
          ).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Unable to download media source (${response.statusCode}).`));
          return;
        }

        const output = fs.createWriteStream(destinationPath);
        response.pipe(output);

        output.on("finish", () => {
          output.close(resolve);
        });
        output.on("error", (error) => {
          output.destroy();
          reject(error);
        });
      }
    );

    request.on("error", reject);
  });
};

const buildFeatureSignature = (audioBuffer) => {
  const safeBuffer = Buffer.isBuffer(audioBuffer) ? audioBuffer : Buffer.from(audioBuffer);
  const samplePayload = safeBuffer.subarray(0, Math.min(safeBuffer.length, 200000));

  if (!samplePayload.length) {
    return {
      bytesRead: 0,
      sampleRate: 8000,
      channels: 1,
      bins: Array(16).fill(0),
    };
  }

  const bins = Array.from({ length: 16 }, (_, index) => {
    const start = Math.floor((samplePayload.length / 16) * index);
    const end = Math.floor((samplePayload.length / 16) * (index + 1));
    const chunk = samplePayload.subarray(start, end);

    let total = 0;
    for (let i = 0; i < chunk.length; i += 2) {
      if (i + 1 >= chunk.length) break;
      const sample = chunk.readInt16LE(i);
      total += Math.abs(sample);
    }

    return Number((total / Math.max(1, Math.ceil(chunk.length / 2))).toFixed(4));
  });

  return {
    bytesRead: samplePayload.length,
    sampleRate: 8000,
    channels: 1,
    bins,
  };
};

const generateAudioFingerprint = (mediaFilePath) => {
  if (!mediaFilePath || typeof mediaFilePath !== "string") {
    return {
      ok: false,
      error: "A valid local media file path is required.",
    };
  }

  if (!fs.existsSync(mediaFilePath)) {
    return {
      ok: false,
      error: "Media file not found.",
    };
  }

  if (!verifyFfmpegAvailability()) {
    return {
      ok: false,
      error: "FFmpeg is not available on PATH.",
    };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bharattube-fp-"));
  const normalizedAudioPath = path.join(tempDir, "audio-normalized.wav");

  try {
    const ffmpegResult = spawnSync(
      FFMPEG_BIN,
      [
        "-y",
        "-i",
        mediaFilePath,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "8000",
        "-acodec",
        "pcm_s16le",
        normalizedAudioPath,
      ],
      {
        stdio: "pipe",
        encoding: "utf8",
      }
    );

    if (ffmpegResult.error || ffmpegResult.status !== 0) {
      return {
        ok: false,
        error: "Unable to extract audio from the provided media file.",
      };
    }

    if (!fs.existsSync(normalizedAudioPath)) {
      return {
        ok: false,
        error: "Audio extraction did not produce a valid output.",
      };
    }

    const audioBuffer = fs.readFileSync(normalizedAudioPath);
    const featureSignature = buildFeatureSignature(audioBuffer);
    const hashSummary = crypto
      .createHash("sha256")
      .update(audioBuffer.subarray(0, Math.min(audioBuffer.length, 200000)))
      .digest("hex");

    return {
      ok: true,
      mediaType: "audio",
      fingerprintVersion: "v1",
      hashSummary,
      featureSignature,
    };
  } catch (error) {
    return {
      ok: false,
      error: error && error.message ? error.message : "Audio fingerprint generation failed.",
    };
  } finally {
    cleanupDirectory(tempDir);
  }
};

const generateReferenceAudioFingerprint = (referenceId, mediaFilePath) => {
  if (!referenceId || typeof referenceId !== "string") {
    return {
      ok: false,
      error: "A valid CopyrightReference id is required.",
    };
  }

  if (!CopyrightReference || !CopyrightReference.modelName) {
    return {
      ok: false,
      error: "CopyrightReference model is unavailable.",
    };
  }

  if (!/^[a-fA-F0-9]{24}$/.test(referenceId)) {
    return {
      ok: false,
      error: "CopyrightReference id is not a valid Mongo ObjectId.",
    };
  }

  const audioFingerprint = generateAudioFingerprint(mediaFilePath);

  if (!audioFingerprint.ok) {
    return audioFingerprint;
  }

  return {
    ok: true,
    reference: referenceId,
    mediaType: "audio",
    fingerprintVersion: audioFingerprint.fingerprintVersion,
    hashSummary: audioFingerprint.hashSummary,
    featureSignature: audioFingerprint.featureSignature,
  };
};

const generateReferenceAudioFingerprintFromUrl = async (referenceId, mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== "string") {
    return {
      ok: false,
      error: "A valid media URL is required.",
    };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bharattube-reference-fp-"));
  const mediaFilePath = path.join(tempDir, "source-video");

  try {
    await downloadMediaSource(mediaUrl, mediaFilePath);
    return generateReferenceAudioFingerprint(referenceId, mediaFilePath);
  } catch (error) {
    return {
      ok: false,
      error: error && error.message ? error.message : "Reference fingerprint generation failed.",
    };
  } finally {
    cleanupDirectory(tempDir);
  }
};

const compareAudioFingerprints = (videoFingerprint, referenceFingerprint) => {
  if (!videoFingerprint || !referenceFingerprint) {
    return {
      matchType: "audio",
      matched: false,
      score: 0,
      confidence: 0,
      metadata: {
        reason: "Missing fingerprints",
      },
    };
  }

  if (videoFingerprint.mediaType !== "audio" || referenceFingerprint.mediaType !== "audio") {
    return {
      matchType: "audio",
      matched: false,
      score: 0,
      confidence: 0,
      metadata: {
        reason: "Fingerprint media type mismatch",
      },
    };
  }

  const videoHash = typeof videoFingerprint.hashSummary === "string" ? videoFingerprint.hashSummary : "";
  const refHash = typeof referenceFingerprint.hashSummary === "string" ? referenceFingerprint.hashSummary : "";

  if (!videoHash || !refHash) {
    return {
      matchType: "audio",
      matched: false,
      score: 0,
      confidence: 0,
      metadata: {
        reason: "Missing hash summary",
      },
    };
  }

  const videoBins = Array.isArray(videoFingerprint.featureSignature?.bins) ? videoFingerprint.featureSignature.bins : [];
  const refBins = Array.isArray(referenceFingerprint.featureSignature?.bins) ? referenceFingerprint.featureSignature.bins : [];

  if (!videoBins.length || !refBins.length || videoBins.length !== refBins.length) {
    return {
      matchType: "audio",
      matched: false,
      score: 0,
      confidence: 0,
      metadata: {
        reason: "Invalid feature signature length",
      },
    };
  }

  const sameHash = videoHash === refHash;
  let totalSimilarity = 0;

  for (let i = 0; i < videoBins.length; i += 1) {
    const diff = Math.abs(Number(videoBins[i]) - Number(refBins[i]));
    totalSimilarity += diff;
  }

  const avgDiff = totalSimilarity / videoBins.length;
  const similarityScore = Math.max(0, 100 - avgDiff * 10);
  const confidence = sameHash ? 100 : Math.max(0, Math.min(100, Math.round(similarityScore)));

  const matched = sameHash || confidence >= 85;

  return {
    matchType: "audio",
    matched,
    score: Math.round(confidence),
    confidence: Math.round(confidence),
    metadata: {
      hashMatch: sameHash,
      binLength: videoBins.length,
      avgDifference: Number(avgDiff.toFixed(4)),
      threshold: 85,
    },
  };
};

const compareReferenceAudioMatch = ({ sourceVideo, reference, sourceFingerprint, referenceFingerprint }) => {
  const comparison = compareAudioFingerprints(sourceFingerprint, referenceFingerprint);
  const score = Number.isFinite(comparison?.score) ? Math.max(0, Math.min(100, comparison.score)) : 0;
  const status = comparison && comparison.matched ? "potential_match" : "no_match";

  return {
    sourceVideo: sourceVideo || null,
    reference: reference || null,
    matchType: "audio",
    score,
    status,
    comparison: {
      matched: Boolean(comparison && comparison.matched),
      confidence: Number.isFinite(comparison?.confidence) ? comparison.confidence : 0,
      metadata: comparison && comparison.metadata ? comparison.metadata : {},
    },
  };
};

module.exports = {
  verifyFfmpegAvailability,
  generateAudioFingerprint,
  generateReferenceAudioFingerprint,
  generateReferenceAudioFingerprintFromUrl,
  compareAudioFingerprints,
  compareReferenceAudioMatch,
};
