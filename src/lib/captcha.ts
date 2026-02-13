export async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  
  if (!secret) {
    console.error("HCAPTCHA_SECRET_KEY is missing in .env");
    return false;
  }

  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `response=${token}&secret=${secret}`,
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Captcha verification error:", error);
    return false;
  }
}