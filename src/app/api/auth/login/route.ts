import { NextResponse } from "next/server";

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const pin =
      String(body?.pin ?? "");

    const correctPin =
      process.env.POS_PIN;

    if (!correctPin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Server chưa được cấu hình POS_PIN.",
        },
        {
          status: 500,
        }
      );
    }

    if (pin !== correctPin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Mã PIN không đúng.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      await createSessionToken();

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        60 *
        60 *
        24 *
        30,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Không thể đăng nhập.",
      },
      {
        status: 500,
      }
    );
  }
}