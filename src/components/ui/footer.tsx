"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent" style={{ fontFamily: 'Times New Roman, serif' }}>
                BINWAHAB
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Premium fashion that combines contemporary design with timeless elegance.
            </p>
            <div className="flex space-x-6">
              <Link
                href="https://www.facebook.com/binwahab.kurta"
                className="text-gray-400 hover:text-gray-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="https://www.instagram.com/99binwahab"
                className="text-gray-400 hover:text-gray-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/shop/collections" className="text-sm text-muted-foreground hover:text-foreground">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/shop/category/new-arrivals" className="text-sm text-muted-foreground hover:text-foreground">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop/category/sale" className="text-sm text-muted-foreground hover:text-foreground">
                  Sale
                </Link>
              </li>
              <li>
                <Link href="/shop/categories" className="text-sm text-muted-foreground hover:text-foreground">
                  All Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-muted-foreground hover:text-foreground">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-muted-foreground hover:text-foreground">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="py-8 border-t border-border">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-sm font-semibold text-foreground">We Accept</h3>
            <div className="flex flex-wrap justify-center gap-4 items-center">
              <Image
                src="/payment-logos/visa.svg"
                alt="Visa"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
              <Image
                src="/payment-logos/mastercard.svg"
                alt="Mastercard"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
              <Image
                src="/payment-logos/tng.png"
                alt="Touch 'n Go"
                width={40}
                height={22}
                className="h-8 w-auto"
              />
              <Image
                src="/payment-logos/boost.png"
                alt="Boost"
                width={40}
                height={22}
                className="h-8 w-auto"
              />
              <Image
                src="/payment-logos/grabpay.png"
                alt="GrabPay"
                width={40}
                height={22}
                className="h-8 w-auto"
              />
              <Image
                src="/payment-logos/fpx.svg"
                alt="FPX"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Secured by</span>
              <Image
                src="/payment-logos/curlec.svg"
                alt="Curlec"
                width={40}
                height={24}
                className="h-7 w-auto"
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2025 BinWahab. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 