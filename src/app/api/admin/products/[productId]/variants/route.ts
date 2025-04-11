import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const variantOptionsSchema = z.object({
  options: z.array(
    z.object({
      name: z.string().min(1, "Option name is required"),
      values: z.array(z.string().min(1, "Option value is required")).min(1, "At least one value is required"),
    })
  ).min(1, "At least one option is required"),
});

// Helper function to generate all possible combinations of options
function generateCombinations(options: { name: string; values: string[] }[]): Record<string, string>[] {
  if (options.length === 0) return [{}];

  const [currentOption, ...remainingOptions] = options;
  const combinations = generateCombinations(remainingOptions);

  return currentOption.values.flatMap((value) =>
    combinations.map((combination) => ({
      ...combination,
      [currentOption.name]: value,
    }))
  );
}

// POST /api/admin/products/[productId]/variants
export async function POST(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { options } = variantOptionsSchema.parse(body);

    // Get the base product
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      select: { 
        id: true,
        price: true,
        sku: true 
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Generate all possible combinations of options
    const combinations = generateCombinations(options);

    // Check if any of the generated SKUs already exist
    const existingSkus = await Promise.all(
      combinations.map(async (combination) => {
        const optionString = Object.entries(combination)
          .map(([key, value]) => `${key}-${value}`)
          .join("-")
          .toLowerCase();
        const sku = `${product.sku || product.id}-${optionString}`;
        const existing = await prisma.productVariant.findUnique({
          where: { sku },
        });
        return existing ? sku : null;
      })
    );

    const duplicateSkus = existingSkus.filter(Boolean);
    if (duplicateSkus.length > 0) {
      return new NextResponse(
        JSON.stringify({
          message: "Some variants already exist",
          duplicateSkus,
        }),
        { status: 400 }
      );
    }

    // Create variants for each combination
    const variants = await prisma.$transaction(
      combinations.map((combination) => {
        const optionString = Object.entries(combination)
          .map(([key, value]) => `${key}-${value}`)
          .join("-")
          .toLowerCase();

        const sku = `${product.sku || product.id}-${optionString}`;

        return prisma.productVariant.create({
          data: {
            productId: params.productId,
            sku,
            price: product.price,
            stock: 0,
            options: combination,
            isActive: true,
          },
        });
      })
    );

    return NextResponse.json(variants);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          message: "Validation error",
          errors: error.errors,
        }),
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new NextResponse(
          JSON.stringify({
            message: "A variant with this SKU already exists",
            field: "sku",
          }),
          { status: 400 }
        );
      }
    }
    console.error("[VARIANTS_POST]", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

// GET /api/admin/products/[productId]/variants
export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: params.productId,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(variants);
  } catch (error) {
    console.error("[VARIANTS_GET]", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
} 