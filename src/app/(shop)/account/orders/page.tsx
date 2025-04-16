import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackageIcon } from "lucide-react";

export const metadata = {
  title: "My Orders - BINWAHAB",
  description: "View your order history",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
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
      shippingAddress: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't placed any orders yet.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-medium capitalize">{order.status}</span>
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    Total: {formatPrice(order.total)}
                  </p>
                </div>
              </div>

              <ul className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16">
                        {item.variant?.images?.[0] || item.product?.image ? (
                          <img
                            src={item.variant?.images?.[0] || item.product?.image!}
                            alt={item.product?.name}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.name}
                        </p>
                        {item.variant && (
                          <p className="text-sm text-gray-500">
                            Variant: {item.variant.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm font-medium text-gray-900">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">Shipping Address:</span>
                  <span className="text-gray-500">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
} 