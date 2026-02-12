import {
  SignupInput,
  ActionResult,
  AuthResponseData,
  VerifyOtpInput,
  LoginInput,
} from "./auth.types";
import { authRepository } from "./auth.repository";
import { generateOTP } from "@/lib/utils";
import { sendOtpEmail } from "@/core/mailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authService = {
  async signup(data: SignupInput): Promise<ActionResult<AuthResponseData>> {
    try {
      const { email, password, name } = data;

      const existingUser = await authRepository.findUserByEmail(email);
      if (existingUser && existingUser.isVerified) {
        return {
          success: false,
          message: "This email is already registered. Please login.",
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      let user;
      if (existingUser && !existingUser.isVerified) {
        user = await authRepository.updateUser(email, {
          name,
          password: hashedPassword,
          otp,
          otpExpires,
        });
      } else {
        user = await authRepository.createUser({
          ...data,
          password: hashedPassword,
          otp,
          otpExpires,
        });
      }
      try {
        await sendOtpEmail(email, otp);
      } catch (mailError) {
        console.error("Mail sending failed:", mailError);
      }

      return {
        success: true,
        message: "Account created! Please check your email for the OTP.",
        data: {
          userId: user._id.toString(),
          email: user.email,
        },
      };
    } catch (error) {
      console.error("Auth service error: ", error);
      return {
        success: false,
        message: "Registration failed. Please try again.",
      };
    }
  },

  
  async verifyOtp(data: VerifyOtpInput): Promise<ActionResult> {
    try {
      const { email, otp } = data;
      const user = await authRepository.findUserByEmail(email);

      if (!user) {
        return { success: false, message: "User not found." };
      }

      if (user.isVerified) {
        return {
          success: true,
          message: "Email is already verified. You can now login.",
        };
      }

      if (user.otp !== otp) {
        return {
          success: false,
          message: "The code you entered is incorrect.",
        };
      }

      if (new Date() > user.otpExpires) {
        return {
          success: false,
          message: "This code has expired. Please request a new one.",
        };
      }

      await authRepository.updateUser(email, {
        isVerified: true,
        otp: undefined,
        otpExpires: undefined,
      });

      return {
        success: true,
        message: "Your email has been successfully verified!",
      };
    } catch (error) {
      console.error("Verify OTP Service Error:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  },


  async resendOtp(email: string): Promise<ActionResult> {
    try {
      const user = await authRepository.findUserByEmail(email);

      if (!user) {
        return { success: false, message: "User not found." };
      }

      if (user.isVerified) {
        return {
          success: false,
          message: "Account already verified. Please login.",
        };
      }

      const newOtp = generateOTP();
      const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await authRepository.updateUser(email, {
        otp: newOtp,
        otpExpires: newExpiry,
      });

      try {
        await sendOtpEmail(email, newOtp);
      } catch (mailError) {
        console.error("Resend Mail sending failed:", mailError);
      }

      return {
        success: true,
        message: "A new code has been sent to your email.",
      };
    } catch (error) {
      console.error("Resend OTP Service Error:", error);
      return { success: false, message: "Failed to resend OTP." };
    }
  },


  async login(
    data: LoginInput,
  ): Promise<ActionResult<AuthResponseData & { token: string }>> {
    try {
      const { email, password } = data;

      const user = await authRepository.findUserWithPassword(email);
      if (!user) {
        return { success: false, message: "Invalid email or password." };
      }

      if (!user.isVerified) {
        return {
          success: false,
          message: "Please verify your email before logging in.",
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: "Invalid email or password." };
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      );

      return {
        success: true,
        message: "Login successful!",
        data: {
          userId: user._id.toString(),
          email: user.email,
          token,
        },
      };
    } catch (error) {
      console.error("Login service error:", error);
      return { success: false, message: "Login failed. Please try again." };
    }
  },
};
