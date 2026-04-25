import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Missing email", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal account existence for security
      return NextResponse.json({ message: "If account exists, email sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Reuse VerificationToken table or create a new ResetToken table
    // For simplicity, let's use a new table or reuse VerificationToken with a prefix
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires,
      },
    });

    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({ message: "Reset email sent." });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
