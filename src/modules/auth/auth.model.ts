import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: false,
    },

    authProvider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpires: {
      type: Date,
    },

    resetPasswordOtp: {
      type: String,
      default: undefined,
    },

    resetPasswordOtpExpires: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true },
);

export const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);