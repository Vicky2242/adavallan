
import { redirect } from 'next/navigation';

/**
 * This page is a redirect handler to ensure legacy URLs for "/ssc/galleries"
 * are correctly forwarded to the new "/ssc/gallery" path.
 */
export default function GalleriesRedirectPage() {
  redirect('/ssc/gallery');
}
