"use client"

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { columns } from "./columns";
import { useEffect, useState } from "react";
import { CollectionDialog } from "./collection-dialog";
import { Collection } from "@prisma/client";
import { toast } from "sonner";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>(undefined);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/collections");
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = () => {
    setEditingCollection(undefined);
    setIsDialogOpen(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setIsDialogOpen(true);
  };

  const handleSaveCollection = async (collectionData: Partial<Collection>) => {
    try {
      const url = editingCollection 
        ? `/api/admin/collections/${editingCollection.id}` 
        : "/api/admin/collections";
      
      const method = editingCollection ? "PUT" : "POST";
      
      console.log("Saving collection data:", collectionData);
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collectionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to save collection: ${errorText}`);
      }
      
      await fetchCollections();
      setIsDialogOpen(false);
      toast.success(editingCollection ? "Collection updated successfully" : "Collection created successfully");
    } catch (error) {
      console.error("Error saving collection:", error);
      toast.error("Failed to save collection. Please try again.");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateCollection}>
            <Plus className="mr-2 h-4 w-4" /> Add Collection
          </Button>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={collections} 
          meta={{
            onEdit: handleEditCollection,
          }}
        />
      )}
      
      <CollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        collection={editingCollection}
        onSave={handleSaveCollection}
      />
    </div>
  );
} 