import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the request for debugging
    console.log("[API Proxy] Incoming request body:", JSON.stringify(body));

    // Forward the request to the backend HTTP API
    const backendUrl = "http://34.182.66.241/api/smart-search/simplified";
    console.log("[API Proxy] Forwarding to:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "polyhedg-frontend/1.0",
        // Forward original client IP if available
        ...(request.headers.get("x-forwarded-for") && {
          "X-Forwarded-For": request.headers.get("x-forwarded-for")!,
        }),
      },
      body: JSON.stringify(body),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    console.log("[API Proxy] Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API Proxy] Backend API error:", errorText);
      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[API Proxy] Backend response:", {
      eventCount: data?.data?.events?.length || data?.events?.length || 0,
      stats: data?.data?.stats || data?.stats,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
