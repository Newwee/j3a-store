import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { getProductBySlug } from '@/lib/firestore/products';
import { getBundleBySlug, getBundleById, bundleToProduct } from '@/lib/firestore/bundles';

export const revalidate = 60;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const siteUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://j3a-store.vercel.app';

  let product: any = null;
  try {
    product = await getProductBySlug(slug);
    if (!product) {
      const cleanSlug = slug.replace(/^bundle_/, '');
      const bundle = (await getBundleBySlug(cleanSlug)) || (await getBundleById(cleanSlug));
      if (bundle) {
        product = bundleToProduct(bundle);
      }
    }
  } catch (err) {
    console.error('Error fetching metadata for product:', err);
  }

  if (!product) {
    return {
      title: 'รายละเอียดสินค้า | J3A STORE',
      description: 'ศูนย์รวมโปรแกรม Discord และบริการดิจิทัลอัตโนมัติ 24 ชม.',
    };
  }

  const title = `${product.name} — J3A STORE`;
  const rawDesc =
    product.shortDescription ||
    product.description ||
    'ซอฟต์แวร์ Discord คุณภาพสูงและบริการดิจิทัลอัตโนมัติ 24 ชม. จาก J3A STORE';
  const description = rawDesc
    .replace(/<[^>]*>?/gm, '')
    .replace(/[#*_`]/g, '')
    .trim()
    .slice(0, 160);

  const rawImage = product.coverImage || product.images?.[0] || '/logo.png';
  const fullImageUrl = rawImage.startsWith('http')
    ? rawImage
    : `${siteUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  const productUrl = `${siteUrl}/products/${slug}`;

  return {
    title: product.name,
    description,
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'J3A STORE',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  return <ProductDetailClient params={props.params} />;
}
