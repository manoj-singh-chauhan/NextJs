export async function verifyGoogleToken(accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Google Token Verification Failed:", errorData);
      return null;
    }

    const data = await response.json();

    return {
      email: data.email,
      name: data.name,
      sub: data.sub,
      picture: data.picture,
      email_verified: data.email_verified,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}