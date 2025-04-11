import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shippingRateSchema = z.object({
  name: z.string().min(1),
  zoneId: z.string().min(1),
  price: z.number().min(0),
  minOrderValue: z.number().min(0).nullable(),
  maxOrderValue: z.number().min(0).nullable(),
  minWeight: z.number().min(0).nullable(),
  maxWeight: z.number().min(0).nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const rates = await prisma.shippingRate.findMany({
      include: {
        zone: true,
      },
    });

    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = shippingRateSchema.parse(body);

    const rate = await prisma.shippingRate.create({
      data: validatedData,
    });

    return NextResponse.json(rate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Rate ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = shippingRateSchema.parse(body);

    const rate = await prisma.shippingRate.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(rate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Rate ID is required" },
        { status: 400 }
      );
    }

    await prisma.shippingRate.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Shipping rate deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 