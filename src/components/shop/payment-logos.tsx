import Image from "next/image";

export function StripeLogo() {
  return (
    <Image
      src="/payment-logos/stripe.svg"
      alt="Stripe"
      width={62}
      height={20}
      className="h-7 w-auto"
    />
  );
}

export function VisaLogo() {
  return (
    <Image
      src="/payment-logos/visa.svg"
      alt="Visa"
      width={32}
      height={20}
      className="h-5 w-auto"
    />
  );
}

export function MastercardLogo() {
  return (
    <Image
      src="/payment-logos/mastercard.svg"
      alt="Mastercard"
      width={32}
      height={20}
      className="h-5 w-auto"
    />
  );
}

export function UnionPayLogo() {
  return (
    <Image
      src="/payment-logos/unionpay.svg"
      alt="UnionPay"
      width={32}
      height={20}
      className="h-5 w-auto"
    />
  );
}

export function LinkLogo() {
  return (
    <Image
      src="/payment-logos/link.svg"
      alt="Link"
      width={32}
      height={20}
      className="h-4 w-auto"
    />
  );
}

export function FPXLogo() {
  return (
    <Image
      src="/payment-logos/fpx.svg"
      alt="FPX"
      width={32}
      height={20}
      className="h-5 w-auto"
    />
  );
} 