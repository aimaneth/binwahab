import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function GridLayout({ children }: LayoutProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

export function ListLayout({ children }: LayoutProps) {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
}

export function CarouselLayout({ children }: LayoutProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {children}
    </div>
  );
} 