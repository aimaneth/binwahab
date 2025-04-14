import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shippingRateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  zoneId: z.string().min(1, "Zone ID is required"),
  price: z.string().transform((val) => parseFloat(val)),
  minOrderValue: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  maxOrderValue: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  minWeight: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  maxWeight: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  isActive: z.boolean().optional().default(true),
});

type ShippingRateInput = z.infer<typeof shippingRateSchema>;

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
    const data = shippingRateSchema.parse(body);

    const rate = await prisma.shippingRate.create({
      data: {
        name: data.name,
        zone: {
          connect: { id: data.zoneId }
        },
        price: data.price,
        minOrderValue: data.minOrderValue,
        maxOrderValue: data.maxOrderValue,
        minWeight: data.minWeight,
        maxWeight: data.maxWeight,
        isActive: data.isActive,
      },
      include: {
        zone: true,
      },
    });

    return NextResponse.json(rate, { status: 201 });
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
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse("Rate ID is required", { status: 400 });
    }

    const data = shippingRateSchema.parse(updateData);

    const rate = await prisma.shippingRate.update({
      where: { id },
      data: {
        name: data.name,
        zone: {
          connect: { id: data.zoneId }
        },
        price: data.price,
        minOrderValue: data.minOrderValue,
        maxOrderValue: data.maxOrderValue,
        minWeight: data.minWeight,
        maxWeight: data.maxWeight,
        isActive: data.isActive,
      },
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

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Shipping rate ID is required" },
        { status: 400 }
      );
    }

    await prisma.shippingRate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping rate:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping rate" },
      { status: 500 }
    );
  }
} 