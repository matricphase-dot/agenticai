import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return new NextResponse("Missing token", { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({ where: { token } });
      return new NextResponse("Token expired", { status: 400 });
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: true },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("VERIFY_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
