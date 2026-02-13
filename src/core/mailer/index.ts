import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendVerificationOtpEmail = async (email: string, otp: string) => {
  return await transporter.sendMail({
    from: `"CodeQuotient" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your verification code`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">Verify Your Email</h2>
        <p>Thank you for registering with <strong>CodeQuotient</strong>.</p>
        <p>Enter the following code to verify your account. This code is valid for 10 minutes:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; border-radius: 5px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 25px; text-align: center;">
          Please do not share this code with anyone.
        </p>
      </div>
    `,
  });
};


export const sendResetOtpEmail = async (email: string, otp: string) => {
  return await transporter.sendMail({
    from: `"CodeQuotient" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your password reset code`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">Reset Your Password</h2>
        <p>We received a request to reset your password.</p>
        <p>Use the code below to continue. This code is valid for 10 minutes:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; border-radius: 5px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 25px; text-align: center;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};
