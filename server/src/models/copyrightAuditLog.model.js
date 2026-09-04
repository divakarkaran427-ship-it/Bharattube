const mongoose = require("mongoose");

const copyrightAuditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["video", "reference", "claim", "dispute", "takedown", "strike"],
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    actorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorRole: {
      type: String,
      enum: ["user", "creator", "admin", "system"],
      default: "system",
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    oldStatus: {
      type: String,
      default: null,
    },

    newStatus: {
      type: String,
      default: null,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

copyrightAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
copyrightAuditLogSchema.index({ actorUser: 1, createdAt: -1 });
copyrightAuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("CopyrightAuditLog", copyrightAuditLogSchema);
