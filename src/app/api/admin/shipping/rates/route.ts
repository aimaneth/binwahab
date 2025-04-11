import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for creating/updating a shipping rate
const shippingRateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  zoneId: z.string().min(1, "Zone ID is required"),
  price: z.number().min(0, "Price must be a positive number"),
  minOrderValue: z.number().optional(),
  maxOrderValue: z.number().optional(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const rates = await prisma.shippingRate.findMany({
      include: {
        zone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error("[SHIPPING_RATES_GET]", error);
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
    const validatedData = shippingRateSchema.parse(body);

    const rate = await prisma.shippingRate.create({
      data: validatedData,
      include: {
        zone: true,
      },
    });

    return NextResponse.json(rate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[SHIPPING_RATES_POST]", error);
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
      return new NextResponse("Rate ID is required", { status: 400 });
    }

    const validatedData = shippingRateSchema.parse(data);

    const rate = await prisma.shippingRate.update({
      where: { id },
      data: validatedData,
      include: {
        zone: true,
      },
    });

    return NextResponse.json(rate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[SHIPPING_RATES_PATCH]", error);
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
      return new NextResponse("Rate ID is required", { status: 400 });
    }

    await prisma.shippingRate.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SHIPPING_RATES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 