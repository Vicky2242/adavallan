
import { redirect } from 'next/navigation';

/**
 * This page is a redirect handler for legacy album URLs. It forwards any request
 * from "/ssc/galleries/[albumId]" to "/ssc/gallery/[albumId]".
 */
export default function AlbumRedirectPage({ params }: { params: { albumId: string } }) {
  const { albumId } = params;
  redirect(`/ssc/gallery/${albumId}`);
}
