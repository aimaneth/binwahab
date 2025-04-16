"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, ChevronDown, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collection } from "@prisma/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCartCount } from "@/hooks/use-cart-count";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [categories, setCategories] = useState<{ id: string; name: string; collections: Collection[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cartCount = useCartCount();

  useEffect(() => {
    const fetchCategoriesAndCollections = async () => {
      try {
        // Fetch all categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();

        // Fetch collections for each category
        const categoriesWithCollections = await Promise.all(
          categoriesData.map(async (category: { id: string; name: string }) => {
            const collectionsResponse = await fetch(`/api/collections?category=${category.id}`);
            const collections = collectionsResponse.ok ? await collectionsResponse.json() : [];
            return {
              ...category,
              collections
            };
          })
        );

        setCategories(categoriesWithCollections);
      } catch (error) {
        console.error('Failed to fetch categories and collections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoriesAndCollections();
  }, []);

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                BINWAHAB
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:justify-center flex-1">
            <div className="flex items-center space-x-6">
              <Link
                href="/shop"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Shop
              </Link>
              
              {/* Categories Dropdowns */}
              {categories.map((category) => (
                <DropdownMenu key={category.id}>
                  <DropdownMenuTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center">
                    {category.name}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {isLoading ? (
                      <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                    ) : category.collections.length > 0 ? (
                      category.collections.map((collection) => (
                        <DropdownMenuItem key={collection.id} asChild>
                          <Link href={`/shop/collection/${collection.id}`}>
                            {collection.name}
                          </Link>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No collections found</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/shop/category/${category.id}`}>View All {category.name}</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
              
              <Link
                href="/shop/collections"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Collections
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/shop/cart" className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted">
                  <User className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm">
                    {session.user?.name || session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {session.user?.role === "ADMIN" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-sm">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="text-sm">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="text-sm">
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-sm text-red-600 cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-md"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "sm:hidden border-b border-border",
          isOpen ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-4 pb-3 pt-2">
          <div className="px-3 py-2">
            <ThemeToggle />
          </div>
          <Link
            href="/shop"
            className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
          >
            Shop
          </Link>
          
          {/* Categories Mobile */}
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                {category.name}
              </div>
              {isLoading ? (
                <div className="px-6 py-2 text-sm text-gray-500">Loading...</div>
              ) : category.collections.length > 0 ? (
                category.collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/shop/collection/${collection.id}`}
                    className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-black rounded-md"
                  >
                    {collection.name}
                  </Link>
                ))
              ) : (
                <div className="px-6 py-2 text-sm text-gray-500">No collections found</div>
              )}
              <Link
                href={`/shop/category/${category.id}`}
                className="block px-6 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
              >
                View All {category.name}
              </Link>
            </div>
          ))}
          
          <Link
            href="/shop/collections"
            className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
          >
            Collections
          </Link>
          <Link
            href="/shop/cart"
            className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
          >
            Cart
          </Link>
          {session ? (
            <>
              <Link
                href="/profile"
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
              >
                Profile
              </Link>
              <Link
                href="/orders"
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
              >
                Orders
              </Link>
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-50 rounded-md"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 