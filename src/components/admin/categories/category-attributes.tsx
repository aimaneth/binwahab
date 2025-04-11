import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AttributeType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(AttributeType),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  order: z.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryAttributesProps {
  categoryId: string;
  attributes: any[];
  onAttributeChange: () => void;
}

export function CategoryAttributes({
  categoryId,
  attributes,
  onAttributeChange,
}: CategoryAttributesProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: AttributeType.TEXT,
      options: [],
      isRequired: false,
      order: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/categories/${categoryId}/attributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create attribute");
      }

      toast.success("Attribute created successfully");
      form.reset();
      onAttributeChange();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/categories/${categoryId}/attributes?id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete attribute");
      }

      toast.success("Attribute deleted successfully");
      onAttributeChange();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attribute type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={AttributeType.TEXT}>Text</SelectItem>
                    <SelectItem value={AttributeType.NUMBER}>Number</SelectItem>
                    <SelectItem value={AttributeType.SELECT}>Select</SelectItem>
                    <SelectItem value={AttributeType.MULTISELECT}>
                      Multi-select
                    </SelectItem>
                    <SelectItem value={AttributeType.BOOLEAN}>Boolean</SelectItem>
                    <SelectItem value={AttributeType.DATE}>Date</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isRequired"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Required</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Make this attribute required for products in this category
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            Add Attribute
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        {attributes.map((attribute) => (
          <div
            key={attribute.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <h4 className="font-medium">{attribute.name}</h4>
              <p className="text-sm text-muted-foreground">
                Type: {attribute.type}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(attribute.id)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 