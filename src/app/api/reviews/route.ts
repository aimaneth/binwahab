import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = parseInt(searchParams.get("productId") || "");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (!productId || isNaN(productId)) {
      return new NextResponse("Valid Product ID is required", { status: 400 });
    }

    // Get reviews for a product
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          status: ReviewStatus.APPROVED,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          productId,
          status: ReviewStatus.APPROVED,
        },
      }),
    ]);

    // Calculate average rating
    const averageRating = await prisma.review.aggregate({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      _avg: {
        rating: true,
      },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      _count: true,
    });

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: averageRating._avg?.rating || 0,
      ratingDistribution,
    });
  } catch (error) {
    console.error("[REVIEWS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { productId: rawProductId, rating, title, content } = body;
    const productId = parseInt(rawProductId);

    if (!productId || isNaN(productId) || !rating || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return new NextResponse("Rating must be between 1 and 5", { status: 400 });
    }

    // Check if user has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: "DELIVERED",
        },
      },
    });

    // Check if user has already reviewed the product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return new NextResponse("You have already reviewed this product", { status: 400 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title,
        content,
        status: ReviewStatus.PENDING,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEWS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { id: rawId, rating, title, content } = body;
    const id = parseInt(rawId);

    if (!id || isNaN(id) || !rating || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return new NextResponse("Rating must be between 1 and 5", { status: 400 });
    }

    // Check if the review belongs to the user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return new NextResponse("Review not found", { status: 404 });
    }

    if (existingReview.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update the review
    const review = await prisma.review.update({
      where: { id },
      data: {
        rating,
        title,
        content,
        status: session.user.role === "ADMIN" ? existingReview.status : ReviewStatus.PENDING,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEWS_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("id");
    const id = parseInt(rawId || "");

    if (!id || isNaN(id)) {
      return new NextResponse("Review ID is required", { status: 400 });
    }

    // Check if the review belongs to the user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return new NextResponse("Review not found", { status: 404 });
    }

    if (existingReview.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[REVIEWS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 