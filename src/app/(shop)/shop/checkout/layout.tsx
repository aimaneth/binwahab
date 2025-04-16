import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const cart = await prisma.cart.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  // Filter out items with null products
  const validItems = (cart?.items?.filter(item => item.product !== null) || []);
  const isEmpty = validItems.length === 0;

  if (isEmpty) {
    redirect("/shop/cart");
  }

  return children;
} 