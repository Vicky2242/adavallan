
import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


interface Instructor {
  id: string;
  name: string;
  role: string;
  description: string;
}

interface AboutPageContent {
  mainHeading: string;
  mainSubheading: string;
  journey: {
    heading: string;
    paragraph1: string;
    paragraph2: string;
    imageUrl: string;
    imageAlt: string;
  };
  missionVision: {
    heading: string;
    mission: {
      heading: string;
      text: string;
    };
    vision: {
      heading: string;
      text: string;
    };
    imageUrl: string;
    imageAlt: string;
  };
  instructorsSection: {
    heading: string;
    instructors: Instructor[];
  };
}

async function getAboutContent(): Promise<AboutPageContent | null> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch about page content.");
        return null;
    }

    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "about"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.content) {
                return JSON.parse(docData.content);
            }
        }
    } catch (e) {
        console.error("Failed to fetch or parse 'About Us' content from Firestore.", e);
    }
    return null;
}

export default async function AboutPage() {
  const aboutContent = await getAboutContent();

  if (!aboutContent) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h2 className="text-2xl font-bold text-muted-foreground">Content Not Available</h2>
        <p className="text-muted-foreground">The content for this page could not be loaded.</p>
      </div>
    );
  }

  const { mainHeading, mainSubheading, journey, missionVision, instructorsSection } = aboutContent;

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-20 space-y-16 md:space-y-24">
        
        <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold">{mainHeading}</h1>
            <p className="text-lg text-muted-foreground mt-2">{mainSubheading}</p>
        </section>

        {journey && (
          <section>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">{journey.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{journey.paragraph1}</p>
                <p className="text-muted-foreground leading-relaxed">{journey.paragraph2}</p>
              </div>
              <div className="text-center">
                <Image src={journey.imageUrl} alt={journey.imageAlt} width={500} height={500} className="rounded-lg shadow-lg mx-auto" data-ai-hint="dance pose solo" />
                <p className="text-sm text-muted-foreground mt-2">Studio Early Days</p>
              </div>
            </div>
          </section>
        )}

        {missionVision && (
          <section>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 text-center">
                <Image src={missionVision.imageUrl} alt={missionVision.imageAlt} width={500} height={500} className="rounded-lg shadow-lg mx-auto" data-ai-hint="group dance performance" />
                <p className="text-sm text-muted-foreground mt-2">Artistic Vision</p>
              </div>
              <div className="order-1 md:order-2 space-y-6">
                <h2 className="text-3xl font-bold">{missionVision.heading}</h2>
                <div className="space-y-4">
                    {missionVision.mission && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mt-1">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{missionVision.mission.heading}</h3>
                            <p className="text-muted-foreground">{missionVision.mission.text}</p>
                        </div>
                      </div>
                    )}
                    {missionVision.vision && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mt-1">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{missionVision.vision.heading}</h3>
                            <p className="text-muted-foreground">{missionVision.vision.text}</p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </section>
        )}
        
        {instructorsSection && (
          <section className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">{instructorsSection.heading}</h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {(instructorsSection.instructors || []).map((instructor) => (
                <Card key={instructor.id} className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xl">{instructor.name}</CardTitle>
                    <p className="text-primary font-medium">{instructor.role}</p>
                  </CardHeader>
                  <CardContent className="p-0 mt-4">
                    <p className="text-muted-foreground">{instructor.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
        
      </div>
    </div>
  );
}
