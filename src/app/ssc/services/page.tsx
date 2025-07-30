
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { type ServiceBenefit, type ServiceProgram } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firestore';


const iconMap: { [key: string]: React.ElementType } = LucideIcons;

async function getServicesContent(): Promise<any> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch services page content.");
        return null;
    }
    
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "services"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.content) {
                return JSON.parse(docData.content);
            }
        }
    } catch (e) {
      console.error("Failed to parse 'Services' content from Firestore.", e);
    }
    return null;
}

export default async function ServicesPage() {
  const servicesContent = await getServicesContent();

  if (!servicesContent) {
    return (
        <div className="container mx-auto px-4 py-12 md:py-20 text-center">
            <h2 className="text-2xl font-bold text-muted-foreground">No Content Available</h2>
            <p className="text-muted-foreground">The content for this page has not been set up yet.</p>
        </div>
    );
  }

  const { mainHeading, mainSubheading, programsSection, benefitsSection } = servicesContent;

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-20 space-y-16">
        
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">{mainHeading}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{mainSubheading}</p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-10 text-foreground/90">{programsSection?.heading}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {(programsSection?.programs || []).map((program: ServiceProgram) => {
               const Icon = iconMap[program.icon] || LucideIcons.Feather;
               return (
                <Card key={program.id || program.title} className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                  <div className="relative h-64 bg-muted">
                     <Image
                        src={program.imageUrl}
                        alt={program.category}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{objectFit: 'cover'}}
                        data-ai-hint={program.imageHint}
                      />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <h3 className="text-4xl font-bold text-white text-center drop-shadow-lg">{program.category}</h3>
                     </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Icon className="h-8 w-8 text-primary mt-1 shrink-0" />
                      <div>
                          <h4 className="text-xl font-semibold text-foreground">{program.title}</h4>
                          <p className="text-sm text-muted-foreground">{program.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-2 text-foreground/90">Key Features:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {(program.features || []).map((feature: string) => <li key={feature}>{feature}</li>)}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Button asChild className="w-full">
                         <Link href="/ssc/contact">Inquire Now</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            )})}
          </div>
        </section>

        <section className="py-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground/90">{benefitsSection?.heading}</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {(benefitsSection?.benefits || []).map((benefit: ServiceBenefit) => (
                    <div key={benefit.id || benefit.title} className="text-center">
                        <h3 className="text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
}
