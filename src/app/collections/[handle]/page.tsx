import { redirect } from 'next/navigation';

interface CollectionRedirectProps {
  params: { handle: string };
}

export default function CollectionRedirect({ params }: CollectionRedirectProps) {
  redirect(`/shop/collection/${params.handle}`);
} 