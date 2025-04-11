import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Schema for category validation
const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().int().optional(),
});

// GET /api/admin/categories
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    
    // Build filter conditions
    const where: Prisma.CategoryWhereInput = {
      ...(search ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      } : {}),
    };

    // Get categories with parent-child relationships
    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { order: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST /api/admin/categories
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCategory) {
      return new NextResponse("Category with this slug already exists", { status: 400 });
    }

    // If parentId is provided, check if it exists
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        return new NextResponse("Parent category not found", { status: 400 });
      }
    }

    // If order is not provided, set it to the highest order + 1
    if (validatedData.order === undefined) {
      const highestOrder = await prisma.category.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });

      validatedData.order = (highestOrder?.order || 0) + 1;
    }

    const category = await prisma.category.create({
      data: validatedData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[CATEGORIES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/admin/categories/bulk
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { ids, action, data } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    let result;

    switch (action) {
      case "delete":
        // Check if categories have products
        const categoriesWithProducts = await prisma.category.findMany({
          where: {
            id: { in: ids },
            products: { some: {} },
          },
          select: { id: true, name: true },
        });

        if (categoriesWithProducts.length > 0) {
          return new NextResponse(
            `Cannot delete categories with products: ${categoriesWithProducts.map((c: { name: string }) => c.name).join(", ")}`,
            { status: 400 }
          );
        }

        result = await prisma.category.deleteMany({
          where: {
            id: { in: ids },
          },
        });
        return NextResponse.json({ success: true, count: result.count });

      case "update":
        if (!data) {
          return new NextResponse("Update data is required", { status: 400 });
        }
        
        // Validate update data
        const updateSchema = z.object({
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          image: z.string().optional(),
          parentId: z.string().optional(),
          order: z.number().int().optional(),
        });
        
        const validatedData = updateSchema.parse(data);
        
        // If slug is being updated, check if it already exists
        if (validatedData.slug) {
          const existingCategory = await prisma.category.findFirst({
            where: {
              slug: validatedData.slug,
              id: { notIn: ids },
            },
          });

          if (existingCategory) {
            return new NextResponse("Category with this slug already exists", { status: 400 });
          }
        }
        
        result = await prisma.category.updateMany({
          where: {
            id: { in: ids },
          },
          data: validatedData,
        });
        
        return NextResponse.json({ success: true, count: result.count });

      default:
        return new NextResponse(`Invalid action: ${action}`, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[CATEGORIES_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 