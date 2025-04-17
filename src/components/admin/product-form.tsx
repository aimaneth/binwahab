"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductVariantForm } from "./product-variant-form";
import { ImageUpload } from "./image-upload";
import { useUploadThing } from "@/lib/uploadthing-client";
import { ProductStatus } from "@prisma/client";

type ProductWithRelations = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  slug?: string;
  stock?: number;
  status?: ProductStatus;
  collections?: { collectionId: string }[];
  variants?: any[];
  images?: string[];
};

interface ProductFormProps {
  product?: ProductWithRelations;
  categories: {
    id: string;
    name: string;
  }[];
  collections: {
    id: string;
    name: string;
  }[];
}

export function ProductForm({ product, categories, collections }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Add variant state management
  const [variantOptions, setVariantOptions] = useState<Array<{ name: string; values: string[] }>>([
    { name: "Size", values: ["S", "M", "L", "XL"] },
    { name: "Color", values: [] },
  ]);
  const [variants, setVariants] = useState<any[]>(product?.variants || []);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    image: string;
    images: string[];
    isActive: boolean;
    status: ProductStatus;
    collectionIds: string[];
  }>({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    categoryId: product?.categoryId || categories[0]?.id || "",
    image: product?.image || "",
    images: product?.images || [],
    isActive: product?.isActive || false,
    status: product?.status || "DRAFT",
    collectionIds: product?.collections?.map((c) => c.collectionId) || [],
  });

  // Add handlers for variant state
  const handleVariantOptionsChange = (newOptions: Array<{ name: string; values: string[] }>) => {
    setVariantOptions(newOptions);
  };

  const handleVariantsChange = (newVariants: any[]) => {
    setVariants(newVariants);
  };

  // Add a function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Update the name change handler to also update the slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  // Add a function to handle image changes
  const handleImagesChange = (newImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  // Add validation for variant options
  const validateVariantOptions = (options: Array<{ name: string; values: string[] }>) => {
    const errors: string[] = [];
    
    // Filter out empty options
    const nonEmptyOptions = options.filter(opt => opt.name.trim() !== "");
    
    // Check each non-empty option
    nonEmptyOptions.forEach(option => {
      if (option.name.trim() && option.values.length === 0) {
        errors.push(`Please add values for the "${option.name}" option or remove it.`);
      }
    });

    return errors;
  };

  // Add handler for generating variants
  const handleGenerateVariants = async (productId: string) => {
    setIsGeneratingVariants(true);
    try {
      const errors = validateVariantOptions(variantOptions);
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join("\n"),
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ options: variantOptions.filter(opt => opt.name.trim() !== "" && opt.values.length > 0) }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate variants");
      }

      const newVariants = await response.json();
      setVariants(newVariants);

      toast({
        title: "Success",
        description: "Product variants generated successfully",
      });
    } catch (error) {
      console.error("Error generating variants:", error);
      toast({
        title: "Error",
        description: "Failed to generate variants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.slug || !formData.categoryId || formData.categoryId === '') {
        toast({
          title: "Error",
          description: "Please fill in all required fields including category",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate variant options before submission
      const variantErrors = validateVariantOptions(variantOptions);
      if (variantErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: variantErrors.join("\n"),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Filter out empty variant options
      const filteredVariantOptions = variantOptions.filter(
        opt => opt.name.trim() !== "" && opt.values.length > 0
      );

      const dataToSubmit = {
        ...formData,
        collectionIds: formData.collectionIds,
        images: formData.images,
        variantOptions: filteredVariantOptions,
        variants,
      };

      // Only remove collections reference
      delete (dataToSubmit as any).collections;

      const response = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSubmit),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to save product";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || "Failed to save product";
          } catch (e2) {
            console.error("Could not get error details:", e2);
          }
        }
        throw new Error(errorMessage);
      }

      const savedProduct = await response.json();

      // Generate variants for new products if we have valid variant options
      if (!product && filteredVariantOptions.length > 0) {
        await handleGenerateVariants(savedProduct.id);
      }

      toast({
        title: "Success",
        description: `Product ${product ? "updated" : "created"} successfully`,
      });
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProductStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <ImageUpload
                  images={formData.images}
                  onChange={handleImagesChange}
                  maxFiles={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Collections</Label>
                <div className="grid grid-cols-2 gap-4">
                  {collections.map((collection) => (
                    <div key={collection.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={collection.id}
                        checked={formData.collectionIds.includes(collection.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              collectionIds: [...formData.collectionIds, collection.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              collectionIds: formData.collectionIds.filter(
                                (id) => id !== collection.id
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={collection.id}>{collection.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    defaultValue={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <ProductVariantForm
            productId={product?.id}
            variants={variants}
            options={variantOptions}
            onOptionsChange={handleVariantOptionsChange}
            onVariantsChange={handleVariantsChange}
            isGeneratingVariants={isGeneratingVariants}
            onGenerateVariants={
              product?.id ? 
              () => handleGenerateVariants(product.id) : 
              () => {
                toast({
                  title: "Info",
                  description: "Variants will be automatically generated when you save the product.",
                });
              }
            }
          />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="product-url-slug"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProductStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
} 