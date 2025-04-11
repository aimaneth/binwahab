import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { categoryId } = params;

    const category = await (prisma as any).Category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        // Remove fields that don't exist in the model
        // canonicalUrl: true,
        // ogTitle: true,
        // ogDescription: true,
        // ogImage: true,
        // robots: true,
        // structuredData: true,
      },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_SEO_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { categoryId } = params;
    const body = await request.json();

    const {
      seoTitle,
      seoDescription,
      seoKeywords,
      // Remove fields that don't exist in the model
      // metaTitle,
      // metaDescription,
      // metaKeywords,
      // canonicalUrl,
      // ogTitle,
      // ogDescription,
      // ogImage,
      // robots,
      // structuredData,
    } = body;

    // Check if category exists
    const existingCategory = await (prisma as any).Category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return new NextResponse("Category not found", { status: 404 });
    }

    // Update category SEO settings
    const updatedCategory = await (prisma as any).Category.update({
      where: { id: categoryId },
      data: {
        seoTitle,
        seoDescription,
        seoKeywords,
        // Remove fields that don't exist in the model
        // metaTitle,
        // metaDescription,
        // metaKeywords,
        // canonicalUrl,
        // ogTitle,
        // ogDescription,
        // ogImage,
        // robots,
        // structuredData,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("[CATEGORY_SEO_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 