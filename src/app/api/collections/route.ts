import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { Prisma, Collection, Product, DisplaySection, ProductImage, CollectionSortOption } from "@prisma/client";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  showOnHomePage: z.boolean().default(false),
  displaySection: z.enum(["FEATURED", "COMPLETE", "NONE"]).default("NONE"),
  order: z.number().int().optional(),
  sortBy: z.enum(["MANUAL", "BEST_SELLING", "TITLE_ASC", "TITLE_DESC", "PRICE_ASC", "PRICE_DESC", "CREATED_ASC", "CREATED_DESC"]).default("MANUAL"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = collectionSchema.parse(json);

    const collection = await prisma.collection.create({
      data: {
        name: body.name,
        handle: body.name.toLowerCase().replace(/\s+/g, '-'),
        description: body.description,
        descriptionHtml: body.descriptionHtml,
        image: body.image,
        isActive: body.isActive,
        showOnHomePage: body.showOnHomePage,
        displaySection: body.displaySection,
        order: body.order,
        sortBy: body.sortBy as CollectionSortOption,
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    console.error("Error creating collection:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create collection" }), { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") as DisplaySection | null;
    const category = searchParams.get("category");

    let whereClause: Prisma.CollectionWhereInput = {
      isActive: true,
    };

    if (section) {
      whereClause.displaySection = section;
      whereClause.showOnHomePage = true;
    }

    if (category) {
      whereClause.products = {
        some: {
          product: {
            categoryId: category
          }
        }
      };
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

    return NextResponse.json(transformedCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    // Return an empty array instead of an error to prevent client-side errors
    return NextResponse.json([]);
  }
} 