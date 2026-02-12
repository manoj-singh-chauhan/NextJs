"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/modules/auth/auth.schema";
import { loginAction } from "@/modules/auth/auth.actions";
import { LoginInput } from "@/modules/auth/auth.types";
import { Github, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginAction(data);

      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error: ", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[425px] border border-gray-200 rounded-md p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-black tracking-tight">
          Welcome back
        </h1>

        <div className="flex gap-2.5 mb-5">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-900"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.9 2.54 30.37 0 24 0 14.64 0 6.6 5.48 2.56 13.44l8.04 6.24C12.34 13.36 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24c0-1.64-.15-3.22-.42-4.73H24v9.02h12.7c-.55 2.96-2.22 5.47-4.73 7.16l7.32 5.68C43.98 36.98 46.5 30.98 46.5 24z" />
              <path fill="#FBBC05" d="M10.6 28.68A14.5 14.5 0 0 1 9.5 24c0-1.63.28-3.2.78-4.68l-8.04-6.24A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.56 10.56l8.04-5.88z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.78l-7.32-5.68c-2.03 1.36-4.64 2.16-8.57 2.16-6.3 0-11.66-3.86-13.4-9.18l-8.04 5.88C6.6 42.52 14.64 48 24 48z" />
            </svg>
            Google
          </button>

          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-900"
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <span className="px-2 bg-white">Or login with email</span>
          </div>
        </div>

        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              autoComplete="new-email"
              autoFocus
              placeholder="name@example.com"
              className={`w-full px-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg placeholder-gray-400 text-gray-900 text-sm focus:ring-1 focus:ring-black outline-none transition-all`}
            />
            {errors.email && (
              <p className="text-red-500 text-[10px] mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-900">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[11px] font-bold text-black hover:underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2 pr-10 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-lg placeholder-gray-400 text-gray-900 text-sm focus:ring-1 focus:ring-black outline-none transition-all`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-[10px] mt-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-[11px] text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 bg-black text-white font-semibold rounded-lg transition-all text-sm mt-4 active:scale-[0.98] ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-[11px] mt-6">
          Do not have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-bold text-black hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}