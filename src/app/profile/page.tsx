import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { AddressForm } from "@/components/profile/address-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { AddressList } from "@/components/profile/address-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile - BINWAHAB",
  description: "Manage your BINWAHAB account",
};

interface ProfilePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch user data including addresses and orders summary
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: true,
      orders: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const showAddressForm = searchParams["add-address"] === "true";

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Account</h1>
          {!showAddressForm && (
            <Button asChild>
              <Link href="?add-address=true" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Address
              </Link>
            </Button>
          )}
        </div>

        {showAddressForm ? (
          <Card>
            <CardContent className="p-6">
              <AddressForm />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardContent className="p-6">
                  <ProfileForm user={user} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <AddressList addresses={user.addresses} />
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {user.orders.length > 0 ? (
                      <>
                        <h3 className="text-lg font-medium">Recent Orders</h3>
                        <div className="space-y-4">
                          {user.orders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-4 border-b last:border-0">
                              <div>
                                <p className="font-medium">Order #{order.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">{order.status}</span>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/orders?id=${order.id}`}>View Details</Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-6">
                          <Button variant="outline" asChild>
                            <Link href="/orders">View All Orders</Link>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No orders yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 