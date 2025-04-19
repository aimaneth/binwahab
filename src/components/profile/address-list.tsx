"use client";

import { useState } from "react";
import { Address } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface AddressListProps {
  addresses: Address[];
}

export function AddressList({ addresses }: AddressListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (addressId: string) => {
    try {
      setIsDeleting(addressId);
      const response = await fetch(`/api/user/address/${addressId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete address");
      }

      toast.success("Address deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete address");
    } finally {
      setIsDeleting(null);
    }
  };

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a shipping address to make checkout faster
            </p>
            <Button onClick={() => router.push("?add-address=true")}>
              Add New Address
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card key={address.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  {address.phone}
                  {address.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/profile?edit-address=${address.id}`)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(address.id)}
                  disabled={isDeleting === address.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>{address.street}</p>
              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
              <p>{address.country}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 