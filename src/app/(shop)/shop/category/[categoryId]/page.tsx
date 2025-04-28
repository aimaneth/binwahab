import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: { categoryId: string } }): Promise<Metadata> {
  // Try to find by slug first, then by id
  let category = await prisma.category.findUnique({
    where: { slug: params.categoryId },
  });
  if (!category) {
    category = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });
  }
  if (!category) {
    return {
      title: "Category Not Found - BINWAHAB",
    };
  }
  return {
    title: `${category.name} - BINWAHAB`,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({ params }: { params: { categoryId: string } }) {
  // Try to find by slug first, then by id
  let category = await prisma.category.findUnique({
    where: { slug: params.categoryId },
  });
  if (!category) {
    category = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });
  }
  if (!category) {
    redirect('/shop');
  }

  // Redirect to shop page with category filter
  redirect(`/shop?category=${category.id}`);
} 