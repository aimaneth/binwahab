"use client";

import { useState } from "react";
import Image from "next/image";
import { Tab } from "@headlessui/react";
import { cn } from "@/utils/cn";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <Tab.Group as="div" className="flex flex-col-reverse">
      {/* Image selector */}
      <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
        <Tab.List className="grid grid-cols-4 gap-6">
          {images.map((image, index) => (
            <Tab
              key={index}
              className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-primary-500 focus:ring-offset-4"
              onClick={() => setSelectedImage(index)}
            >
              {({ selected }) => (
                <>
                  <span className="sr-only">{name}</span>
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <Image
                      src={image}
                      alt={`${name} - Image ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover object-center"
                    />
                  </span>
                  <span
                    className={cn(
                      selected ? "ring-primary-500" : "ring-transparent",
                      "pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-2"
                    )}
                    aria-hidden="true"
                  />
                </>
              )}
            </Tab>
          ))}
        </Tab.List>
      </div>

      <Tab.Panels className="aspect-h-1 aspect-w-1 w-full">
        {images.map((image, index) => (
          <Tab.Panel key={index}>
            <div className="relative h-96 w-full sm:h-[500px]">
              <Image
                src={image}
                alt={`${name} - Image ${index + 1}`}
                fill
                className="h-full w-full object-cover object-center"
                priority={index === 0}
              />
            </div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
} 