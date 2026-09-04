const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");

const uploadToCloudinary = async (
  filePath,
  folder,
  resourceType = "auto"
) => {
  if (!filePath) {
    throw new Error("File path is required");
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
    });

    await fs.unlink(filePath).catch(() => {});

    return result;
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});

    console.error("Cloudinary Upload Error:", error.message);

    throw error;
  }
};

module.exports = uploadToCloudinary;