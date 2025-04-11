import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

export async function DELETE(
  req: Request,
  { params }: { params: { mediaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const media = await (prisma as any).Media.delete({
      where: {
        id: params.mediaId,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("[MEDIA_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 