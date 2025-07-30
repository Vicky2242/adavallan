
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { type SliderItem } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import HomeCarousel from '@/components/home-carousel';


const iconMap: { [key: string]: React.ElementType } = Object.keys(LucideIcons).reduce((acc, key) => {
  const icon = (LucideIcons as any)[key];
  if (typeof icon === 'function') acc[key] = icon;
  return acc;
}, {} as { [key: string]: React.ElementType });


async function getHomeContent() {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized. Cannot fetch page content.");
        return { homeContent: {}, sliderItems: [] };
    }

    try {
        const pagesCollection = collection(db, "pages");
        const sliderCollection = collection(db, "sliders");

        const homeContentQuery = query(pagesCollection, where("slug", "==", "home"));
        const sliderQuery = query(sliderCollection, orderBy("sortOrder", "asc"));

        const [homeContentSnapshot, sliderSnapshot] = await Promise.all([
            getDocs(homeContentQuery),
            getDocs(sliderQuery)
        ]);

        let homeContent = {};
        if (!homeContentSnapshot.empty) {
            const homeDoc = homeContentSnapshot.docs[0].data();
            if (homeDoc.content) {
                homeContent = JSON.parse(homeDoc.content);
            }
        }

        const sliderItems = sliderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SliderItem[];

        return { homeContent, sliderItems };
    } catch (e) {
        console.error("Error loading content from Firestore:", e);
        return { homeContent: {}, sliderItems: [] };
    }
}


export default async function SscHomePage() {
  const { homeContent, sliderItems } = await getHomeContent();
  
  const { hero = {}, embraceArt = {}, whyChoose = {}, journey = {} } = homeContent || {};
  const { features = [] } = whyChoose;


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HomeCarousel sliderItems={sliderItems} hero={hero} />

      <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-5 gap-12 items-center">
              <div className="text-left md:col-span-3">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{embraceArt?.heading}</h2>
                <p className="text-muted-foreground mb-4">{embraceArt?.paragraph1}</p>
                <p className="text-muted-foreground mb-6">{embraceArt?.paragraph2}</p>
                <Link href={embraceArt?.linkHref || '#'} className="font-semibold text-primary hover:text-primary/80">{embraceArt?.linkText}</Link>
              </div>
              <div className="md:col-span-2">
                {embraceArt?.imageUrl ? (
                  <Image src={embraceArt.imageUrl} alt={embraceArt.heading || 'Embrace Art'} width={600} height={400} className="rounded-lg shadow-lg w-full h-full object-cover" data-ai-hint="dance class"/>
                ) : (
                  <div className="w-full h-[400px] rounded-lg bg-muted"/>
                )}
              </div>
            </div>
          </div>
        </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">{whyChoose?.heading}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature: any, index: number) => {
                 const Icon = iconMap[feature.icon] || LucideIcons.Users;
                 return (
                    <Card key={feature.title || index} className="text-center bg-card p-8 border-border/80 shadow-lg">
                        <Icon className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                    </Card>
                 );
              })}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{journey?.heading}</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">{journey?.paragraph}</p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href={journey?.buttonLink || '#'}>{journey?.buttonText}</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
