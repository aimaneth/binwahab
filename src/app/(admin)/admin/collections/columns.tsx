"use client"

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Edit, Trash2, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Collection } from "@prisma/client";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { CollectionRules } from "./collection-rules";
import { CollectionProductsDialog } from "./collection-products-dialog";
import { useState } from "react";
import { CollectionImage } from "@/components/collections/collection-image";

interface DataTableProps {
  onEdit: (collection: Collection) => void;
}

export const columns: ColumnDef<Collection>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const collection = row.original;
      return (
        <CollectionImage
          image={collection.image}
          image2={collection.image2}
          alt={collection.name}
          className="w-16 h-16"
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "slug",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Handle" />
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return type.charAt(0) + type.slice(1).toLowerCase();
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return isActive ? "Active" : "Inactive";
    },
  },
  {
    id: "rules",
    header: "Rules",
    cell: ({ row }) => {
      const collection = row.original;
      return (
        <CollectionRules
          collection={collection}
          onUpdate={() => {
            // Trigger table refresh
            window.location.reload();
          }}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const collection = row.original;
      const [productsDialogOpen, setProductsDialogOpen] = useState(false);
      const meta = table.options.meta as { onEdit?: (collection: Collection) => void };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (meta?.onEdit) {
                    meta.onEdit(collection);
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setProductsDialogOpen(true)}
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(collection.id);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement delete
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CollectionProductsDialog
            open={productsDialogOpen}
            onOpenChange={setProductsDialogOpen}
            collection={collection}
          />
        </>
      );
    },
  },
]; 