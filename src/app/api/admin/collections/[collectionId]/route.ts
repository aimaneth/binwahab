import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const collection = await prisma.collection.findUnique({
      where: {
        id: params.collectionId,
      },
      include: {
        products: true,
      },
    });

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[COLLECTION_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      slug,
      description, 
      image,
      image2,
      type,
      conditions,
      isActive,
      order,
      seoTitle,
      seoDescription,
      seoKeywords,
      showOnHomePage,
      displaySection
    } = body;

    console.log("Updating collection with image2:", image2);

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Use type assertion to handle the image2 field
    const updateData = {
      name,
      slug,
      description,
      image,
      image2,
      type,
      conditions,
      isActive,
      order,
      seoTitle,
      seoDescription,
      seoKeywords,
      showOnHomePage,
      displaySection
    } as any;

    const collection = await prisma.collection.update({
      where: {
        id: params.collectionId,
      },
      data: updateData,
      include: {
        products: true,
      },
    });

    console.log("Collection updated successfully with image2:", (collection as any).image2);

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[COLLECTION_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.collection.delete({
      where: {
        id: params.collectionId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COLLECTION_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 