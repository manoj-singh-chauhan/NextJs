export type SignupInput = {
  name: string;
  email: string;
  password?: string;
  authProvider?: "credentials" | "google";
  googleId?: string;
  isVerified?: boolean;
  otp?:string;
  otpExpires?:Date;
};

export type GoogleUserPayload = {
  email: string;
  name: string;
  sub: string;
  isVerified?: boolean;
  picture?: string;
  email_verified: boolean;
};

export type VerifyOtpInput = {
  email: string;
  otp: string;
};

export type AuthResponseData = {
  userId: string;
  email: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type UpdatePasswordInput = {
  email: string;
  code: string;
  password: string;
  confirmPassword : string;
};


export type LoginInput = {
  email: string;
  password: string;
};

export type UserSignupForm = {
  name: string;
  email: string;
  password: string;
};