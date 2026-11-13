import { NextResponse } from "next/server";
import { COOKIE_NAME, getSessionUser } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      data: null,
      message: "Sesión cerrada correctamente",
      error: null,
    },
    { status: 200 }
  );

  response.cookies.delete(COOKIE_NAME);
  return response;
}

