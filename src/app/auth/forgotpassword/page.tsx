"use client";

import { useState, useRef,useEffect} from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { forgotPasswordAction } from "@/modules/auth/auth.actions";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Please complete the captcha.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await forgotPasswordAction(email, captchaToken);

     if (result.success) {
        setSuccess("Reset code sent to your email");

        setTimeout(() => {
          router.push(`/auth/verifyresetotp?email=${encodeURIComponent(email)}`);
        }, 900);

        return;
      }
      else {
        setError(result.message);
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
      }
    } catch (err) {
      console.error("error occured : ", err);
      setError("An unexpected error occurred.");
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm border border-gray-200 rounded-md p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-1 text-black tracking-tight">
          Reset password
        </h1>
        <p className="text-center text-[13px] text-gray-500 mb-6">
          Enter your email to receive a 6-digit reset code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
            />
          </div>

          <div className="w-full flex justify-center mt-3 opacity-95">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""}
              onVerify={(token) => setCaptchaToken(token)}
              ref={captchaRef}
              theme="light"
            />
          </div>

          {error && (
              <p className="text-red-700 text-[11px] text-center font-medium">
                {error}
              </p>
          )}

          {success && (
              <p className="text-green-700 text-[11px] text-center font-medium">
                {success}
              </p>
          )}
          <button
            type="submit"
            disabled={loading || !captchaToken}
            className={`w-full py-2.5 bg-black text-white font-semibold rounded-lg transition-all text-sm mt-2 active:scale-[0.98] ${
              loading || !captchaToken
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-800"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                Processing...
              </span>
            ) : (
              "Send reset code"
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-[11px] mt-6">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-black hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}