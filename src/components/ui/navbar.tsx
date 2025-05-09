"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, ChevronDown, ShoppingCart } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
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
import { useCart } from "@/contexts/cart-context";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface Category {
  id: string;
  name: string;
  collections: {
    id: string;
    name: string;
    handle: string;
    description: string | null;
  }[];
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const cartCount = useCartCount();
  const cartIconRef = useRef<HTMLDivElement>(null);
  const { setCartIconPosition } = useCart();

  const fetchCategoriesAndCollections = useCallback(async () => {
      try {
      setIsLoading(true);
      const categoriesResponse = await fetch('/api/categories', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();

        const categoriesWithCollections = await Promise.all(
          categoriesData.map(async (category: { id: string; name: string }) => {
          const collectionsResponse = await fetch(`/api/collections?category=${category.id}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
            if (!collectionsResponse.ok) throw new Error('Failed to fetch collections');
            const collections = await collectionsResponse.json();
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
  }, []);

  useEffect(() => {
    fetchCategoriesAndCollections();
  }, [fetchCategoriesAndCollections, lastUpdate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 5 * 60 * 1000);

    const handleFocus = () => {
      setLastUpdate(Date.now());
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const updateCartPosition = () => {
      if (cartIconRef.current) {
        const rect = cartIconRef.current.getBoundingClientRect();
        setCartIconPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    updateCartPosition();

    window.addEventListener('resize', updateCartPosition);
    window.addEventListener('scroll', updateCartPosition);

    return () => {
      window.removeEventListener('resize', updateCartPosition);
      window.removeEventListener('scroll', updateCartPosition);
    };
  }, [setCartIconPosition]);

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent" style={{ fontFamily: 'Times New Roman, serif' }}>
                BINWAHAB
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:justify-center flex-1">
            <div className="flex items-center gap-6">
              <Link
                href="/shop"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Shop
              </Link>
              
              {/* Categories Dropdowns */}
              <div className="flex items-center gap-2">
              {categories.map((category) => (
                  <NavigationMenu key={category.id}>
                    <NavigationMenuList className="gap-2">
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {category.name}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="min-w-[200px] p-2">
                    {isLoading ? (
                              <li className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</li>
                    ) : category.collections.length > 0 ? (
                      category.collections.map((collection) => (
                                <Link
                                  key={collection.id}
                                  href={`/shop?collection=${collection.id}&category=${category.id}`}
                                  className="block select-none rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                            {collection.name}
                          </Link>
                      ))
                    ) : (
                              <li className="px-2 py-1.5 text-sm text-muted-foreground">No collections found</li>
                    )}
                            <li className="mt-2 pt-2 border-t">
                              <Link
                                href={`/shop/collection/${category.id}`}
                                className="block px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm"
                              >
                                View All {category.name}
                              </Link>
                            </li>
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
              ))}
              </div>
              
              <Link
                href="/shop/collections"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Collections
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/shop/cart" className="relative">
              <div ref={cartIconRef} className="relative inline-block">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </div>
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
        <div className="space-y-1 px-2 pb-3 pt-2">
          <Link
            href="/shop"
            className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
          >
            Shop
          </Link>
          
          {/* Categories Mobile */}
          <div className="space-y-1">
            {categories.map((category, index) => (
              <div key={category.id} className="relative" style={{ zIndex: 50 - index }}>
                <NavigationMenu className="w-full">
                  <NavigationMenuList className="w-full flex justify-center">
                    <NavigationMenuItem className="w-auto min-w-[16rem] max-w-[20rem]">
                      <NavigationMenuTrigger className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors justify-start bg-transparent">
                        {category.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="w-full p-3 bg-popover rounded-md">
                          {isLoading ? (
                            <li className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</li>
                          ) : category.collections.length > 0 ? (
                            category.collections.map((collection) => (
                              <Link
                                key={collection.id}
                                href={`/shop?collection=${collection.id}&category=${category.id}`}
                                className="block select-none rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                onClick={() => setIsOpen(false)}
                              >
                                {collection.name}
                              </Link>
                            ))
                          ) : (
                            <li className="px-2 py-1.5 text-sm text-muted-foreground">No collections found</li>
                          )}
                          <li className="mt-2 pt-2 border-t">
                            <Link
                              href={`/shop/collection/${category.id}`}
                              className="block px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm"
                              onClick={() => setIsOpen(false)}
                            >
                              View All {category.name}
                            </Link>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            ))}
          </div>
          
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