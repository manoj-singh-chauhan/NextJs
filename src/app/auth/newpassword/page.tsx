"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { updatePasswordAction } from "@/modules/auth/auth.actions";
import { Eye, EyeOff } from "lucide-react";

export default function NewPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !code) {
      router.push("/auth/forgot-password");
    }
  }, [email, code, router]);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
      setError(null);

      try {
        const result = await updatePasswordAction({
          email,
          code,
          password,
          confirmPassword,
        });

        if (result.success) {
          setSuccess("Password updated successfully");

          setTimeout(() => {
            router.push("/auth/login?reset=success");
          }, 900);

          return;
        }
        else {
          if (result.errors) {
            const firstError =
              result.errors.password?.[0] ||
              result.errors.confirmPassword?.[0] ||
              result.errors.code?.[0] ||
              result.message;

            setError(firstError);
          } else {
            setError(result.message);
          }
        }
      } catch (err) {
        console.error("Reset password error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[425px] border border-gray-200 rounded-md p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-1 text-black tracking-tight">
          Create new password
        </h1>
        <p className="text-center text-[13px] text-gray-500 mb-8">
          Your new password must be different from previous ones.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none transition-all"
            />
          </div>

          {error && (
              <p className="text-red-700 text-[11px] text-center font-medium">{error}</p>
          )}

          {success && (
              <p className="text-green-700 text-[11px] text-center font-medium">
                {success}
              </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 bg-black text-white font-semibold rounded-lg text-sm transition-all active:scale-[0.98] ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            }`}
          >
            {loading ? "Updating..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}