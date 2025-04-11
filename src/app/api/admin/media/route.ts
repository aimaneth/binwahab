import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

// GET /api/admin/media
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      (prisma as any).Media.findMany({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      (prisma as any).Media.count({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[MEDIA_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST /api/admin/media
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, url, type, size, width, height } = body;

    // Log the session and body for debugging
    console.log("Session user:", session.user);
    console.log("Request body:", body);

    // Check if uploadedBy is available
    if (!session.user.id) {
      console.error("User ID is missing from session");
      return new NextResponse("User ID is missing", { status: 400 });
    }

    try {
      const media = await (prisma as any).Media.create({
        data: {
          name,
          url,
          type,
          size,
          width,
          height,
          uploadedBy: session.user.id,
        },
      });

      return NextResponse.json(media);
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return new NextResponse(`Database error: ${dbError.message || 'Unknown database error'}`, { status: 500 });
    }
  } catch (error: any) {
    console.error("[MEDIA_POST]", error);
    return new NextResponse(`Internal error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
}

// DELETE /api/admin/media/[mediaId]
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