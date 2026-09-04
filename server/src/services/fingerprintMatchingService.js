const MediaFingerprint = require("../models/mediaFingerprint.model");
const CopyrightReference = require("../models/copyrightReference.model");
const MatchResult = require("../models/matchResult.model");
const { compareReferenceAudioMatch } = require("./fingerprintService");

const getLatestAudioFingerprintForVideo = async (sourceVideoId) => {
  if (!sourceVideoId) {
    return null;
  }

  try {
    return await MediaFingerprint.findOne({
      video: sourceVideoId,
      mediaType: "audio",
    })
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    return null;
  }
};

const getLatestActiveReferenceAudioFingerprints = async ({ referenceIds } = {}) => {
  const referenceQuery = { status: "active" };

  if (Array.isArray(referenceIds) && referenceIds.length) {
    referenceQuery._id = { $in: referenceIds };
  }

  try {
    const activeReferences = await CopyrightReference.find(referenceQuery)
      .select("_id video")
      .lean();

    if (!activeReferences.length) {
      return [];
    }

    const referenceIdList = activeReferences.map((reference) => reference._id);
    const fingerprintRecords = await MediaFingerprint.find({
      mediaType: "audio",
      reference: { $in: referenceIdList },
    })
      .sort({ reference: 1, createdAt: -1 })
      .lean();

    const newestByReference = new Map();
    for (const fingerprint of fingerprintRecords) {
      const key = String(fingerprint.reference);
      if (!newestByReference.has(key)) {
        newestByReference.set(key, fingerprint);
      }
    }

    return activeReferences
      .map((reference) => newestByReference.get(String(reference._id)))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

const buildMatchResultPayload = ({ sourceVideo, reference, matchType, score, status, targetVideo = null }) => {
  const payload = {
    sourceVideo,
    reference,
    matchType,
    score,
    status,
  };

  if (targetVideo) {
    payload.targetVideo = targetVideo;
  }

  return payload;
};

const matchSourceVideoAgainstActiveReferences = async ({ sourceVideoId, referenceIds } = {}) => {
  if (!sourceVideoId) {
    return [];
  }

  const sourceFingerprint = await getLatestAudioFingerprintForVideo(sourceVideoId);
  if (!sourceFingerprint) {
    return [];
  }

  const referenceFingerprints = await getLatestActiveReferenceAudioFingerprints({ referenceIds });
  if (!referenceFingerprints.length) {
    return [];
  }

  const results = [];

  for (const referenceFingerprint of referenceFingerprints) {
    const referenceId = referenceFingerprint.reference;
    if (!referenceId) {
      continue;
    }

    const comparison = compareReferenceAudioMatch({
      sourceVideo: sourceVideoId,
      reference: referenceId,
      sourceFingerprint,
      referenceFingerprint,
    });

    const matchType = "audio";
    const score = Number.isFinite(comparison?.score) ? Math.max(0, Math.min(100, comparison.score)) : 0;
    const status = comparison && comparison.status === "potential_match" ? "potential_match" : "no_match";

    const existingResultDoc = await MatchResult.findOne({
      sourceVideo: sourceVideoId,
      reference: referenceId,
      matchType,
    });

    const existingResult =
      existingResultDoc && typeof existingResultDoc.toObject === "function"
        ? existingResultDoc.toObject()
        : existingResultDoc;

    if (existingResult) {
      results.push(existingResult);
      continue;
    }

    const targetVideo = referenceFingerprint.video || null;
    const payload = buildMatchResultPayload({
      sourceVideo: sourceVideoId,
      reference: referenceId,
      matchType,
      score,
      status,
      targetVideo,
    });

    const createdResult = await MatchResult.create(payload);
    results.push(createdResult && createdResult.toObject ? createdResult.toObject() : createdResult);
  }

  return results;
};

module.exports = {
  getLatestAudioFingerprintForVideo,
  getLatestActiveReferenceAudioFingerprints,
  buildMatchResultPayload,
  matchSourceVideoAgainstActiveReferences,
};
