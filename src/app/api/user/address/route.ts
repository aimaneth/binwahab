import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  addressLine1: z.string().min(5, "Address must be at least 5 characters"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
  isDefault: z.boolean().default(false),
});

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
    const data = addressSchema.parse(body);

    // If this is the first address or isDefault is true, update all other addresses to not be default
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Check if this is the first address
    const addressCount = await prisma.address.count({
      where: {
        userId: session.user.id,
      },
    });

    // Create new address
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        street: data.addressLine1 + (data.addressLine2 ? `, ${data.addressLine2}` : ""),
        city: data.city,
        state: data.state,
        zipCode: data.postalCode,
        country: data.country,
        phone: data.phoneNumber,
        isDefault: data.isDefault || addressCount === 0, // Make first address default
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating address:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 