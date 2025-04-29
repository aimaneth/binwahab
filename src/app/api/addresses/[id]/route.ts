import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  addressLine1: z.string().min(5).optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  postalCode: z.string().min(5).optional(),
  country: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const address = await prisma.address.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { message: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { message: "Failed to fetch address" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = addressUpdateSchema.parse(body);

    // Check if address exists and belongs to user
    const addressExists = await prisma.address.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!addressExists) {
      return NextResponse.json(
        { message: "Address not found" },
        { status: 404 }
      );
    }

    // If setting as default, update all other addresses
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          id: {
            not: params.id
          }
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Prepare street field from addressLine1 and addressLine2
    let street = undefined;
    if (data.addressLine1) {
      street = data.addressLine1;
      if (data.addressLine2) {
        street += `, ${data.addressLine2}`;
      }
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: {
        id: params.id,
      },
      data: {
        ...(street && { street }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.postalCode && { zipCode: data.postalCode }),
        ...(data.country && { country: data.country }),
        ...(data.phone && { phone: data.phone }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating address:", error);
    return NextResponse.json(
      { message: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { message: "Address not found" },
        { status: 404 }
      );
    }

    // Delete address
    await prisma.address.delete({
      where: {
        id: params.id,
      },
    });

    // If this was the default address, make another address the default if available
    if (address.isDefault) {
      const remainingAddress = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
        },
      });

      if (remainingAddress) {
        await prisma.address.update({
          where: {
            id: remainingAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json(
      { message: "Address deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { message: "Failed to delete address" },
      { status: 500 }
    );
  }
} 