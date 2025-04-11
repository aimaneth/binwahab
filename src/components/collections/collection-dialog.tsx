import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Collection } from '@/types/collection';
import { createCollection, updateCollection } from '@/lib/api/collections';

interface CollectionDialogProps {
  collection?: Collection;
  onClose: () => void;
  onSuccess?: () => void;
}

const CollectionDialog: React.FC<CollectionDialogProps> = ({ collection, onClose, onSuccess }) => {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [image, setImage] = useState<string | undefined>(collection?.image || undefined);
  const [image2, setImage2] = useState<string | undefined>(collection?.image2 || undefined);
  const [displaySection, setDisplaySection] = useState<"FEATURED" | "COMPLETE" | "NONE">(collection?.displaySection || "NONE");
  const [type, setType] = useState(collection?.type || '');
  const [conditions, setConditions] = useState(collection?.conditions || '');
  const [isActive, setIsActive] = useState(collection?.isActive || false);
  const [showOnHomePage, setShowOnHomePage] = useState(collection?.showOnHomePage || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name,
        description,
        image,
        image2,
        type,
        conditions,
        isActive,
        showOnHomePage,
        displaySection,
      };

      if (collection) {
        await updateCollection(collection.id, data);
        toast({
          title: "Success",
          description: "Collection updated successfully",
        });
      } else {
        await createCollection(data);
        toast({
          title: "Success",
          description: "Collection created successfully",
        });
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving collection:", error);
      toast({
        title: "Error",
        description: "Failed to save collection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="image">Primary Image</Label>
        <ImageUpload
          value={image}
          onChange={setImage}
          onRemove={() => setImage(undefined)}
        />
      </div>
      <div>
        <Label htmlFor="image2">Secondary Image</Label>
        <ImageUpload
          value={image2}
          onChange={setImage2}
          onRemove={() => setImage2(undefined)}
        />
      </div>
      <div>
        <Label htmlFor="displaySection">Display Section</Label>
        <Select
          value={displaySection}
          onValueChange={(value) => setDisplaySection(value as "FEATURED" | "COMPLETE" | "NONE")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select display section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FEATURED">Featured</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
            <SelectItem value="NONE">None</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CollectionDialog; 