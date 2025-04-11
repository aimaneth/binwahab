"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollectionRulesDialog } from "./collection-rules-dialog";
import { Collection } from "@/types/collection";

interface CollectionRulesProps {
  collection: Collection;
  onUpdate: () => void;
}

export function CollectionRules({ collection, onUpdate }: CollectionRulesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSaveRules = async (rules: any[]) => {
    try {
      const response = await fetch("/api/admin/collections/rules", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId: collection.id,
          rules,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rules");
      }

      onUpdate();
    } catch (error) {
      console.error("Error saving rules:", error);
      throw error;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        Manage Rules
      </Button>

      <CollectionRulesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collectionId={collection.id}
        collectionName={collection.name}
        onSave={handleSaveRules}
      />
    </>
  );
} 