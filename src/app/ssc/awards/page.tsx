
import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { type AwardItem } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AwardsPageContent {
  heading: string;
  subheading: string;
  awards: AwardItem[];
  studentAchievements: {
    heading: string;
    paragraph: string;
    imageUrl: string;
    imageHint: string;
  };
}

async function getAwardsContent(): Promise<AwardsPageContent | null> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch awards page content.");
        return null;
    }

    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "awards"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.content) {
                return JSON.parse(docData.content);
            }
        } else {
            console.warn("No 'awards' page document found in Firestore. Check seeding.");
        }
    } catch (e) {
        console.error("Failed to fetch or parse 'Awards' content from Firestore.", e);
    }
    return null;
}

export default async function AwardsPage() {
  const iconMap: { [key: string]: React.ElementType } = LucideIcons;
  const content = await getAwardsContent();

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Content Error</h2>
        <p className="text-muted-foreground">The content for this page could not be loaded. It may be missing or malformed. Please check the admin panel.</p>
      </div>
    );
  }

  const { heading, subheading, awards, studentAchievements } = content;

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-20 space-y-16 md:space-y-24">

        <section className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">{heading}</h1>
          <p className="text-lg text-muted-foreground">{subheading}</p>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(awards || []).map((award: AwardItem) => {
              const Icon = iconMap[award.icon] || LucideIcons.Award;
              return (
                <Card key={award.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group bg-card flex flex-col">
                  <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image
                      src={award.imageUrl}
                      alt={award.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      data-ai-hint={award.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">{award.title}</h3>
                    </div>
                     <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm p-2 rounded-full">
                       <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <h4 className="text-lg font-semibold text-primary">{award.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">{award.issuer}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed flex-grow">{award.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {studentAchievements && (
          <section className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{studentAchievements.heading}</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {studentAchievements.paragraph}
            </p>
            <div className="aspect-video w-full rounded-lg shadow-lg overflow-hidden border">
              <Image
                src={studentAchievements.imageUrl}
                alt={studentAchievements.heading}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
                data-ai-hint={studentAchievements.imageHint}
              />
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
