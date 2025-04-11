import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ShippingZoneType } from "@prisma/client";

// Schema for creating/updating a shipping zone
const shippingZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(ShippingZoneType),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const zones = await prisma.shippingZone.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error("[SHIPPING_ZONES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = shippingZoneSchema.parse(body);

    const zone = await prisma.shippingZone.create({
      data: validatedData,
    });

    return NextResponse.json(zone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[SHIPPING_ZONES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return new NextResponse("Zone ID is required", { status: 400 });
    }

    const validatedData = shippingZoneSchema.parse(data);

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(zone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[SHIPPING_ZONES_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Zone ID is required", { status: 400 });
    }

    await prisma.shippingZone.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SHIPPING_ZONES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 