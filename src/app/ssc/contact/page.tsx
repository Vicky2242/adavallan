
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Phone, Mail, MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ContactForm } from './contact-form';


interface SocialLink { icon: string; href: string; }
interface ContactPageContent {
  heading: string;
  paragraph: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  mapUrl: string;
  socials: SocialLink[];
}

const iconMap: { [key: string]: React.ElementType } = LucideIcons;

async function getContactContent(): Promise<ContactPageContent | null> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch contact page content.");
        return null;
    }
    
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "contact"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.content) {
                return JSON.parse(docData.content);
            }
        } else {
            console.warn("Contact page content not found in Firestore.");
        }
    } catch (e) {
      console.error("Failed to parse 'Contact' content from Firestore.", e);
    }
    return null;
}

export default async function ContactPage() {
  const contactContent = await getContactContent();
  
  if (!contactContent) {
    return <div className="container mx-auto px-4 py-16 text-center">Content not available.</div>;
  }

  return (
    <div className="bg-background text-foreground">
      <section className="w-full h-[400px] md:h-[500px] bg-muted">
         <iframe
            src={contactContent.mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
        ></iframe>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="md:col-span-2">
            <ContactForm />
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-3">CONTACT INFO</h3>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-start">
                   <MapPin className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                   <span style={{whiteSpace: 'pre-wrap'}}>{contactContent.address}</span>
                </p>
                 <p className="flex items-center">
                   <Phone className="h-5 w-5 mr-3 text-primary shrink-0"/>
                   <span>{contactContent.phone}</span>
                </p>
                 <p className="flex items-center">
                   <Mail className="h-5 w-5 mr-3 text-primary shrink-0"/>
                   <span>{contactContent.email}</span>
                </p>
                {contactContent.website && (
                  <p className="flex items-center">
                    <Link href={contactContent.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg>
                      <span>{contactContent.website.replace(/^(https?:\/\/)?(www\.)?/, '')}</span>
                    </Link>
                  </p>
                )}
              </div>
            </div>
             <div>
              <h3 className="text-xl font-bold mb-3">GET SOCIAL</h3>
              <div className="flex space-x-3">
                 {(contactContent.socials || []).map(social => {
                   const Icon = iconMap[social.icon] || LucideIcons.Link;
                   return (
                      <Button asChild key={social.icon} variant="outline" size="icon">
                          <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.icon}><Icon className="h-5 w-5" /></a>
                      </Button>
                   );
                 })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
