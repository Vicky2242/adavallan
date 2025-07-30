
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


interface GalleryImage { src: string; hint: string; }
interface GalleryAlbum { id: string; title: string; coverImage: string; imageHint: string; images: GalleryImage[]; }

async function getAlbum(albumId: string): Promise<GalleryAlbum | null> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch gallery content.");
        return null;
    }
    
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "gallery"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.content) {
                const galleryContent = JSON.parse(docData.content);
                const foundAlbum = galleryContent.albums.find((a: GalleryAlbum) => a.id === albumId);
                return foundAlbum || null;
            }
        }
    } catch (e) {
      console.error("Failed to parse 'Gallery' content from Firestore.", e);
    }
    return null;
}

export default async function AlbumDetailPage({ params }: { params: { albumId: string } }) {
  const { albumId } = params;
  const album = await getAlbum(albumId);

  if (!album) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Album Not Found</h1>
        <p className="text-muted-foreground mb-6">The gallery you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/ssc/gallery">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="mb-10">
        <Button asChild variant="outline" className="mb-4 hover:text-primary">
          <Link href="/ssc/gallery">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Albums
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-center">{album.title}</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {album.images.map((image, index) => (
          <div key={index} className="overflow-hidden rounded-lg shadow-lg aspect-w-1 aspect-h-1 group">
            <Image
              src={image.src}
              alt={`Gallery image ${index + 1} from ${album.title}`}
              width={600}
              height={400}
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={image.hint}
            />
          </div>
        ))}
        {album.images.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">This album is currently empty.</div>
        )}
      </div>
    </div>
  );
}
