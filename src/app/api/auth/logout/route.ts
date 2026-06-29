import { NextResponse } from "next/server";
import { getCurrentUser, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          action: "logout",
        },
      });
    }

    const response = NextResponse.json({ success: true });
    const cookieHeader = clearAuthCookie();
    response.headers.set("Set-Cookie", cookieHeader["Set-Cookie"]);
    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
