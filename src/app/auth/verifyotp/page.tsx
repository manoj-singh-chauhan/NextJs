"use client";
import { verifyOtpAction, resendOtpAction } from "@/modules/auth/auth.actions";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(60);

  const canResend = resendTimer === 0;

  useEffect(() => {
    if (!email) {
      router.push("/auth/signup");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyOtpAction({ email, otp });

      if (result.success) {
        router.push("/auth/login?verified=true");
      } else {
        setError(result.message);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("error occured : ", err);
      setError("Something went wrong. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    const result = await resendOtpAction(email);

    if (result.success) {
      setResendTimer(60); 
      setOtp("");
      setSuccessMessage("OTP sent to your email");
    } else {
      setError(result.message);
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] border border-gray-200 rounded-md p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">
          Verify your email
        </h1>
        <p className="text-center text-xs text-gray-600 mb-6">
          Enter the code we sent to{" "}
          <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex justify-between gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoCorrect="off"
                spellCheck={false}
                value={otp[i] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (!val) return;
                  const newOtp = otp.split("");
                  newOtp[i] = val;
                  setOtp(newOtp.join(""));
                  const next = document.getElementById(`otp-${i + 1}`);
                  next?.focus();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasteData = e.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);
                  if (!pasteData) return;
                  setOtp(pasteData);
                  const lastInput = document.getElementById(
                    `otp-${pasteData.length - 1}`,
                  );
                  lastInput?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    e.preventDefault();
                    const newOtp = otp.split("");
                    if (newOtp[i]) {
                      newOtp[i] = "";
                      setOtp(newOtp.join(""));
                      return;
                    }
                    const prev = document.getElementById(`otp-${i - 1}`);
                    prev?.focus();
                  }
                }}
                className="w-10 h-12 border border-gray-300 rounded-md text-center text-lg font-semibold focus:border-black outline-none transition-all"
              />
            ))}
          </div>

          {error && <p className="text-red-600 text-xs text-center">{error}</p>}
          {successMessage && (
            <p className="text-green-600 text-xs text-center">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isVerifying || isResending || otp.length !== 6}
            className={`w-full py-2 bg-black text-white font-semibold rounded-lg text-sm transition-all ${
              isVerifying || otp.length !== 6
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-900"
            }`}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-5">
          Did not get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending || isVerifying}
            className={`font-semibold ${
              canResend && !isResending
                ? "text-black hover:underline"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            {isResending ? "Sending..." : canResend ? "Resend" : `Resend in ${resendTimer}s`}
          </button>
        </p>

        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/auth/signup")}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Back to signup
          </button>
        </div>
      </div>
    </div>
  );
}