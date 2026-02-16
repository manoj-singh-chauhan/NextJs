"use server";
import { connectDB } from "@/core/db";
import { cookies } from "next/headers";
import { signupSchema, loginSchema,newPasswordSchema} from "./auth.schema";
import { authService } from "./auth.service";
import {
  SignupInput,
  ActionResult,
  AuthResponseData,
  VerifyOtpInput,
  LoginInput,
  UpdatePasswordInput,
  GoogleUserPayload,
} from "./auth.types";
import { verifyGoogleToken } from "@/lib/google";


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

export async function forgotPasswordAction(
  email: string, 
  captchaToken: string
): Promise<ActionResult> {
  try {
    await connectDB();

    if (!email || !captchaToken) {
      return { success: false, message: "Email and Captcha are required." };
    }

    return await authService.forgotPasswordRequest(email, captchaToken);
  } catch (error) {
    console.error("Forgot Password Action Error:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

export async function verifyResetOtpAction(email: string, otp: string): Promise<ActionResult> {
  try {
    await connectDB();
    
    if (!email || !otp) {
      return { success: false, message: "Email and code are required." };
    }

    return await authService.verifyResetOtp(email, otp);
  } catch (error) {
    console.error("server error : ",error);
    return { success: false, message: "Server error. Please try again." };
  }
}

export async function resendResetOtpAction(email: string): Promise<ActionResult> {
  try {
    await connectDB();

    if (!email) {
      return { success: false, message: "Email is required." };
    }

    return await authService.resendResetOtp(email);
  } catch (error) {
    console.error("Resend Reset OTP Action Error:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

export async function updatePasswordAction(
  data: UpdatePasswordInput
): Promise<ActionResult> {
  try {
    await connectDB();

    const parsed = newPasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    return await authService.updatePassword(parsed.data);
  } catch (error) {
    console.error("Update Password Action Error:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

export async function googleLoginAction(token: string): Promise<ActionResult<AuthResponseData>> {
  try {
    await connectDB();

    if (!token) {
      return { success: false, message: "No Google token provided." };
    }

    const payload = await verifyGoogleToken(token) as GoogleUserPayload | null;
    
    if (!payload || !payload.email) {
      return { success: false, message: "Invalid Google account." };
    }

    const result = await authService.googleLogin(payload);

    if (result.success && result.data) {
      const { token: jwtToken, userId, email } = result.data;

      const cookieStore = await cookies();
      cookieStore.set("auth_token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      
      console.log("cookie sotore check  : ",cookieStore);
      return {
        success: true,
        message: result.message,
        data: { userId, email },
      };
    }

    return result as ActionResult<AuthResponseData>;
  } catch (error: unknown) {
    console.error("Google Login Action Error:", error);
    return { success: false, message: "An error occurred during Google authentication." };
  }
}

export async function facebookLoginAction(
  facebookData: {
    accessToken: string;
    userID: string;
    email: string;
    name: string;
  }
): Promise<ActionResult<AuthResponseData>> {
  try {
    await connectDB();

    if (!facebookData.email || !facebookData.userID) {
      return { success: false, message: "Invalid Facebook account data." };
    }

    const result = await authService.facebookLogin({
      facebookId: facebookData.userID,
      email: facebookData.email,
      name: facebookData.name,
    });

    if (result.success && result.data) {
      const { token: jwtToken, userId, email } = result.data;

      const cookieStore = await cookies();
      cookieStore.set("auth_token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return {
        success: true,
        message: result.message,
        data: { userId, email },
      };
    }

    return result as ActionResult<AuthResponseData>;
  } catch (error: unknown) {
    console.error("Facebook Login Action Error:", error);
    return { success: false, message: "An error occurred during Facebook authentication." };
  }
}