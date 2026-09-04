const { generateAudioFingerprint } = require("./fingerprintService");

const generateVideoFingerprint = (localVideoFilePath) => {
  try {
    return generateAudioFingerprint(localVideoFilePath);
  } catch (error) {
    return {
      ok: false,
      error: error && error.message
        ? error.message
        : "Audio fingerprint generation failed.",
    };
  }
};

module.exports = {
  generateVideoFingerprint,
};