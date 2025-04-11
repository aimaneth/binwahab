import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { Prisma, Collection, Product, DisplaySection, ProductImage } from "@prisma/client";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  showOnHomePage: z.boolean().default(false),
  displaySection: z.enum(["FEATURED", "COMPLETE", "NONE"]).default("NONE"),
  order: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = collectionSchema.parse(json);

    // @ts-ignore - Ignoring type error for displaySection
    const collection = await prisma.collection.create({
      data: {
        name: body.name,
        slug: body.name.toLowerCase().replace(/\s+/g, '-'),
        description: body.description,
        image: body.image,
        isActive: body.isActive,
        showOnHomePage: body.showOnHomePage,
        displaySection: body.displaySection,
        order: body.order,
      } as any,
    });

    return NextResponse.json(collection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") as DisplaySection | null;

    let whereClause: Prisma.CollectionWhereInput = {
      isActive: true,
      showOnHomePage: true,
    };

    if (section) {
      whereClause.displaySection = section;
    }

    const collections = await prisma.collection.findMany({
      where: whereClause,
      take: section === "FEATURED" ? 3 : undefined,
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        products: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform the response to include products directly
    const transformedCollections = collections.map(collection => {
      const products = collection.products.map(pc => ({
        ...pc.product,
        images: pc.product.images.map(img => ({ url: img.url }))
      }));
      return {
        ...collection,
        products
      };
    });

    return NextResponse.json({ collections: transformedCollections });
  } catch (error) {
    console.error("[COLLECTIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 