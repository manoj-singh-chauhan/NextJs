import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendOtpEmail = async (email: string, otp: string) => {
  const mailOptions = {
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
          please do not share with anyone.
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};