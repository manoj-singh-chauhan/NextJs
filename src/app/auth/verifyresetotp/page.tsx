"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyResetOtpAction, resendResetOtpAction } from "@/modules/auth/auth.actions";

export default function VerifyResetOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [verified, setVerified] = useState(false);

  const canResend = resendTimer === 0;

  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyResetOtpAction(email, otp);

        if (result.success) {
        setVerified(true);

        setTimeout(() => {
          router.push(
            `/auth/newpassword?email=${encodeURIComponent(email)}&code=${otp}`
          );
        }, 900);

        return;
      } 
      else {
        setError(result.message);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong. Please try again.");
    }
    finally{
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    
    const result = await resendResetOtpAction(email);

    if (result.success) {
      setResendTimer(60); 
      setOtp("");
      setSuccessMessage("A new reset code has been sent to your email.");
    } else {
      setError(result.message);
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[380px] border border-gray-200 rounded-md p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-1 text-black tracking-tight">
          Verify reset code
        </h1>
        <p className="text-center text-xs text-gray-500 mb-8 leading-relaxed">
          Enter the 6-digit code sent to <br />
          <span className="font-semibold text-black">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-10 h-12 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-1 focus:ring-black focus:border-black outline-none transition-all"
                value={otp[i] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (!val) return;
                  const newOtp = otp.split("");
                  newOtp[i] = val;
                  setOtp(newOtp.join(""));
                  document.getElementById(`otp-${i + 1}`)?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    const newOtp = otp.split("");
                    newOtp[i] = "";
                    setOtp(newOtp.join(""));
                    document.getElementById(`otp-${i - 1}`)?.focus();
                  }
                }}
              />
            ))}
          </div>

          {error && <p className="text-red-600 text-[11px] text-center font-medium leading-tight">{error}</p>}
          {successMessage && <p className="text-green-600 text-[11px] text-center font-medium leading-tight">{successMessage}</p>}

          {verified && (
              <p className="text-green-600 text-[11px] text-center font-medium">
                Code verified successfully
              </p>
            )}
          <button
            type="submit"
            disabled={isVerifying || otp.length !== 6}
            className={`w-full py-2.5 bg-black text-white font-semibold rounded-lg text-sm transition-all active:scale-[0.98] ${
              isVerifying || otp.length !== 6 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            }`}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                Verifying...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Did not get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={`font-bold transition-colors ${canResend ? "text-black hover:underline" : "text-gray-400 cursor-not-allowed"}`}
          >
            {isResending ? "Sending..." : canResend ? "Resend" : `Resend in ${resendTimer}s`}
          </button>
        </p>

        <div className="text-center mt-5">
           <button
             type="button"
             onClick={() => router.push("/auth/forgotpassword")}
             className="text-[11px] text-gray-400 hover:text-black transition-colors"
           >
            Back to email entry
           </button>
        </div>
      </div>
    </div>
  );
}