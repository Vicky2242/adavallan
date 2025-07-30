
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


interface GalleryAlbum {
  id: string;
  title: string;
  coverImage: string;
  imageHint: string;
}

interface GalleryContent {
  heading: string;
  albums: GalleryAlbum[];
}

async function getGalleryContent(): Promise<GalleryContent | null> {
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
                return JSON.parse(docData.content);
            }
        }
    } catch (e) {
      console.error("Failed to parse 'Gallery' content from Firestore.", e);
    }
    return null;
}

export default async function GalleryPage() {
  const galleryContent = await getGalleryContent();

  if (!galleryContent) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h2 className="text-2xl font-bold text-muted-foreground">No Content Available</h2>
        <p className="text-muted-foreground">The content for this page has not been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div>
        <h1 className="text-4xl font-bold text-center mb-12">{galleryContent.heading}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(galleryContent.albums || []).map((album) => (
            <Link key={album.id} href={`/ssc/gallery/${album.id}`} passHref>
              <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                <div className="relative aspect-[3/2] w-full bg-muted">
                    <Image
                      src={album.coverImage}
                      alt={`Cover for ${album.title}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      data-ai-hint={album.imageHint}
                    />
                  </div>
                  <div className="p-4 bg-card">
                    <h3 className="font-semibold text-md text-foreground group-hover:text-primary transition-colors">
                      {album.title}
                    </h3>
                  </div>
              </Card>
            </Link>
          ))}
        </div>
         {(galleryContent.albums || []).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No albums have been created yet.</div>
         )}
      </div>
    </div>
  );
}
