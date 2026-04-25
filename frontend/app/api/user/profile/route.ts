import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, bio, avatar } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        bio,
        avatar,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("USER_PROFILE_PATCH_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
