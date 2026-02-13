import {
  SignupInput,
  ActionResult,
  AuthResponseData,
  VerifyOtpInput,
  LoginInput,
  UpdatePasswordInput ,
  GoogleUserPayload,
} from "./auth.types";
import { authRepository } from "./auth.repository";
import { generateOTP } from "@/lib/utils";
import { sendVerificationOtpEmail,sendResetOtpEmail} from "@/core/mailer";
import { verifyCaptcha } from "@/lib/captcha";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const authService = {
  async signup(data: SignupInput): Promise<ActionResult<AuthResponseData>> {
    try {
      const { email, password, name } = data;

      const existingUser = await authRepository.findUserByEmail(email);

      if (existingUser && existingUser.googleId && !existingUser.password) {
        return { success: false, message: "This account is linked to Google. Please login with Google." };
      }

      if (!password) {
        return { success: false, message: "Password is required to create an account." };
      }

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
        await sendVerificationOtpEmail(email, otp);
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

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;

      await user.save();

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
        await sendVerificationOtpEmail(email, newOtp);
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
          message: "user not found or email not exist please login.",
        };
      }

      if (user.googleId && !user.password) {
        return {
          success: false,
          message: "This account uses Google Login. please login using google",
        };
      }

      if (!password) {
        return { success: false, message: "New password is required." };
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

  async forgotPasswordRequest(
    email: string,
    captchaToken: string,
  ): Promise<ActionResult> {
    try {
      const isHuman = await verifyCaptcha(captchaToken);
      if (!isHuman) {
        return {
          success: false,
          message: "Captcha verification failed. Please try again.",
        };
      }

      const user = await authRepository.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: "No account found with this email address.",
        };
      }

      const resetOtp = generateOTP();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      user.resetPasswordOtp = resetOtp;
      user.resetPasswordOtpExpires = expiry;
      await user.save();

      try {
        await sendResetOtpEmail(email, resetOtp);
      } catch (mailError) {
        console.error("Forgot Password Email Error:", mailError);
      }

      return {
        success: true,
        message: "A password reset code has been sent to your email.",
      };
    } catch (error) {
      console.error("Forgot Password Service Error:", error);
      return {
        success: false,
        message: "An error occurred. Please try again later.",
      };
    }
  },

  async verifyResetOtp(email: string, otp: string): Promise<ActionResult> {
    try {
      const user = await authRepository.findUserByEmail(email);

      if (!user) {
        return { success: false, message: "User not found." };
      }

      if (!user.resetPasswordOtpExpires) {
        return {
          success: false,
          message: "No reset request found. Please request a new code.",
        };
      }

      if (user.resetPasswordOtp !== otp) {
        return { success: false, message: "Invalid reset code." };
      }

      if (new Date() > user.resetPasswordOtpExpires) {
        return {
          success: false,
          message: "This code has expired. Please request a new one.",
        };
      }

      return {
        success: true,
        message: "Code verified. Please set your new password.",
      };
    } catch (error) {
      console.error("Verify Reset OTP Error:", error);
      return {
        success: false,
        message: "An error occurred during verification.",
      };
    }
  },

  async resendResetOtp(email: string): Promise<ActionResult> {
    try {
      const user = await authRepository.findUserByEmail(email);

      if (!user) {
        return { success: false, message: "User not found." };
      }

      const newOtp = generateOTP();
      const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.resetPasswordOtp = newOtp;
      user.resetPasswordOtpExpires = newExpiry;
      await user.save();

      console.log(`RESENT Reset OTP for ${email}: ${newOtp}`);

      try {
        await sendResetOtpEmail(email, newOtp);
      } catch (mailError) {
        console.error("Resend Reset Mail failed:", mailError);
      }

      return {
        success: true,
        message: "A new reset code has been sent to your email.",
      };
    } catch (error) {
      console.error("Resend Reset OTP Service Error:", error);
      return { success: false, message: "Failed to resend code." };
    }
  },


async updatePassword(data: UpdatePasswordInput): Promise<ActionResult> {
    try {
      const { email, code, password } = data;

      const user = await authRepository.findUserByEmail(email);
      if (!user) {
        return { success: false, message: "User not found." };
      }

      if (!user.resetPasswordOtp || user.resetPasswordOtp !== code) {
        return { success: false, message: "Invalid or used code. Please start again." };
      }

      if (!user.resetPasswordOtpExpires || new Date() > user.resetPasswordOtpExpires) {
        return { success: false, message: "This code has expired. Please request a new one." };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      user.isVerified = true;
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      
      await user.save();

      return { 
        success: true, 
        message: "Your password has been reset successfully." 
      };
    } catch (error) {
      console.error("Update Password Service Error:", error);
      return { success: false, message: "Failed to update password. Try again." };
    }
  },

async googleLogin(payload: GoogleUserPayload): Promise<ActionResult<AuthResponseData & { token: string }>> {
    try {
      const { email, name, sub } = payload;

      let user = await authRepository.findUserByEmail(email);

      if (!user) {
        user = await authRepository.createUser({
          email,
          name,
          isVerified: true,     
          authProvider: "google",
          googleId: sub,
        });
      } else {
        if (!user.isVerified) {
          user.isVerified = true;
        }

        if (!user.googleId) {
          user.googleId = sub;
        }
        
        await user.save();
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      return {
        success: true,
        message: "Google login successful!",
        data: {
          userId: user._id.toString(),
          email: user.email,
          token,
        },
      };
    } catch (error: unknown) {
      console.error("Google Login Service Error:", error);
      return { success: false, message: "Failed to process Google login." };
    }
  },
};
