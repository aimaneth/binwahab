import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  attributeId: z.string().min(1, "Attribute is required"),
  value: z.string().min(1, "Value is required").max(100, "Value must be less than 100 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface Attribute {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ProductAttribute {
  id: string;
  attribute: Attribute;
  value: string;
}

interface ProductAttributesProps {
  productId: string;
  attributes: ProductAttribute[];
  categoryAttributes: Attribute[];
  onAttributeChange: () => void;
}

export function ProductAttributes({
  productId,
  attributes,
  categoryAttributes,
  onAttributeChange,
}: ProductAttributesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attributeId: "",
      value: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Check if attribute already exists
      const existingAttribute = attributes.find(
        (attr) => attr.attribute.id === data.attributeId
      );
      if (existingAttribute) {
        toast.error("This attribute has already been added");
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}/attributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add attribute");
      }

      toast.success("Attribute added successfully");
      form.reset();
      onAttributeChange();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add attribute. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/products/${productId}/attributes?id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete attribute");
      }

      toast.success("Attribute deleted successfully");
      onAttributeChange();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete attribute. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  const selectedAttribute = form.watch("attributeId");
  const currentAttribute = categoryAttributes.find(
    (attr) => attr.id === selectedAttribute
  );

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="attributeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attribute</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an attribute" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryAttributes.map((attr) => (
                      <SelectItem 
                        key={attr.id} 
                        value={attr.id}
                        disabled={attributes.some(a => a.attribute.id === attr.id)}
                      >
                        {attr.name}
                        {attr.required && " *"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentAttribute?.required && (
                  <FormDescription>
                    This is a required attribute
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                {currentAttribute?.options && currentAttribute.options.length > 0 && (
                  <FormDescription>
                    Suggested values: {currentAttribute.options.join(", ")}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Attribute"}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        {attributes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No attributes added yet. Add your first attribute.
          </div>
        ) : (
          attributes.map((attribute) => (
            <div
              key={attribute.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <h4 className="font-medium">
                  {attribute.attribute.name}
                  {attribute.attribute.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Value: {attribute.value}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteId(attribute.id)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attribute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && onDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 