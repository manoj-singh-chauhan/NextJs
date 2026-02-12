"use server";
import { connectDB } from "@/core/db";
import { cookies } from "next/headers";
import { signupSchema, loginSchema } from "./auth.schema";
import { authService } from "./auth.service";
import {
  SignupInput,
  ActionResult,
  AuthResponseData,
  VerifyOtpInput,
  LoginInput,
} from "./auth.types";

export async function signupAction(
  data: SignupInput,
): Promise<ActionResult<AuthResponseData>> {
  try {
    await connectDB();

    const parsed = signupSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid form data.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    return await authService.signup(parsed.data);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "server error";
    console.error("auth error:", errorMessage);

    return {
      success: false,
      message: "registration failed. Please try again later.",
    };
  }
}

export async function verifyOtpAction(
  data: VerifyOtpInput,
): Promise<ActionResult> {
  try {
    await connectDB();
    if (!data.email || !data.otp || data.otp.length !== 6) {
      return {
        success: false,
        message: "Please enter a valid 6-digit code.",
      };
    }

    return await authService.verifyOtp(data);
  } catch (error: unknown) {
    console.error("OTP Verification Error:", error);
    return {
      success: false,
      message: "An error occurred during verification. Please try again.",
    };
  }
}

export async function resendOtpAction(email: string): Promise<ActionResult> {
  try {
    await connectDB();

    if (!email) {
      return { success: false, message: "Email is required." };
    }

    return await authService.resendOtp(email);
  } catch (error: unknown) {
    console.error("Resend OTP Error:", error);
    return {
      success: false,
      message: "Could not resend code. Please try again.",
    };
  }
}

export async function loginAction(
  data: LoginInput,
): Promise<ActionResult<AuthResponseData>> { 
  try {
    await connectDB();

    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid login data.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const result = await authService.login(parsed.data);

    if (result.success && result.data) {
      const token = (result.data as { token?: string }).token;

      if (token) {
        const cookieStore = await cookies();

        cookieStore.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      const { userId, email } = result.data;
      return {
        success: true,
        message: result.message,
        data: { userId, email },
      };
    }

    return result as ActionResult<AuthResponseData>;
  } catch (error: unknown) {
    console.error("login error : ", error);
    return { success: false, message: "An error occurred during login." };
  }
}