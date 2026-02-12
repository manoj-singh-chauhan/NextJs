export type SignupInput = {
  name: string;
  email: string;
  password: string;
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

export type LoginInput = Pick<SignupInput, "email" | "password">;