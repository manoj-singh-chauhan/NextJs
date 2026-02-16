// Create this file: app/auth/facebook/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { facebookLoginAction } from "@/modules/auth/auth.actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle user denial
    if (error) {
      const errorMessage = errorDescription || error;
      return NextResponse.redirect(
        new URL(
          `/auth/signup?error=${encodeURIComponent(errorMessage)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/auth/signup?error=No authorization code received",
          request.url
        )
      );
    }

    // Exchange code for access token
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/auth/facebook/callback`;

    if (!appId || !appSecret) {
      console.error("Facebook credentials not configured");
      return NextResponse.redirect(
        new URL(
          "/auth/signup?error=Facebook configuration error",
          request.url
        )
      );
    }

    // Get access token from Facebook
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
      { method: "GET" }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL(
          `/auth/signup?error=${encodeURIComponent("Failed to get access token")}`,
          request.url
        )
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL(
          "/auth/signup?error=No access token received",
          request.url
        )
      );
    }

    // Get user info from Facebook
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      { method: "GET" }
    );

    if (!userResponse.ok) {
      console.error("User info fetch failed");
      return NextResponse.redirect(
        new URL(
          "/auth/signup?error=Failed to get user info",
          request.url
        )
      );
    }

    const userData = await userResponse.json();

    if (!userData.email) {
      return NextResponse.redirect(
        new URL(
          `/auth/signup?error=${encodeURIComponent("Email permission required. Please enable email in Facebook app settings.")}`,
          request.url
        )
      );
    }

    // Call server action to handle login/signup
    const result = await facebookLoginAction({
      accessToken,
      userID: userData.id,
      email: userData.email,
      name: userData.name,
    });

    if (result.success) {
      // Create response and set cookie
      const response = NextResponse.redirect(new URL("/", request.url));
      
      // The cookie is already set in the server action,
      // but we're redirecting here
      return response;
    } else {
      return NextResponse.redirect(
        new URL(
          `/auth/signup?error=${encodeURIComponent(result.message)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error("Facebook callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/auth/signup?error=An unexpected error occurred",
        request.url
      )
    );
  }
}