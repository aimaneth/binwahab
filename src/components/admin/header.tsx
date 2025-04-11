"use client";

import { useState } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function AdminHeader({ sidebarOpen, setSidebarOpen }: AdminHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 flex h-16 flex-shrink-0 border-b border-border bg-card">
      <div className="flex flex-1 justify-between px-4">
        <div className="flex flex-1">
          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden mr-4"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Search */}
          <form className="flex w-full md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-muted-foreground focus-within:text-foreground">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block h-full w-full border-transparent py-2 pl-10 pr-3 text-foreground placeholder:text-muted-foreground bg-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                placeholder="Search"
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </Button>

          {/* Profile dropdown */}
          <div className="relative ml-3">
            <div>
              <Button
                variant="ghost"
                size="icon"
                className="flex max-w-xs items-center rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </Button>
            </div>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Button
                  variant="ghost"
                  className="relative w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Your Profile
                </Button>
                <Button
                  variant="ghost"
                  className="relative w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="relative w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 