
import React from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Button } from './ui/button';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LinkItem {
    title: string;
    href: string;
}

interface SocialLink {
    icon: keyof typeof LucideIcons;
    href: string;
}

interface FooterContent {
    companyName: string;
    companyDescription: string;
    quickLinksTitle: string;
    quickLinks: LinkItem[];
    connectTitle: string;
    socials: SocialLink[];
    address: string;
    email: string;
    copyright: string;
    phone: string;
}

async function getFooterContent(): Promise<FooterContent | null> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch footer content.");
        return null;
    }
    
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "footer-content"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const footerDoc = querySnapshot.docs[0].data();
            if (footerDoc.content) {
                return JSON.parse(footerDoc.content);
            }
        } else {
            console.warn("Footer content document not found in Firestore.");
        }
    } catch (e) {
        console.error("Failed to parse footer content from Firestore.", e);
    }
    
    return null;
}

const SSCFooter: React.FC = async () => {
  const footerContent = await getFooterContent();

  if (!footerContent) {
    return (
      <footer className="bg-muted/50 text-secondary-foreground">
        <div className="container mx-auto px-4 py-8">
           <p className="text-center">Error loading footer content.</p>
        </div>
      </footer>
    );
  }
  
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 text-secondary-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Company Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{footerContent.companyName}</h3>
             <p className="text-sm text-secondary-foreground/80">{footerContent.companyDescription}</p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{footerContent.quickLinksTitle}</h3>
            <ul className="space-y-1 text-sm">
              {(Array.isArray(footerContent.quickLinks) ? footerContent.quickLinks : []).map(link => (
                  <li key={link.title}>
                      <Link href={link.href} className="hover:text-primary text-secondary-foreground/80">
                          {link.title}
                      </Link>
                  </li>
              ))}
            </ul>
          </div>
          
          {/* Contact and Social Media */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{footerContent.connectTitle}</h3>
            <div className="flex justify-center md:justify-start space-x-3 mb-3">
              {(Array.isArray(footerContent.socials) ? footerContent.socials : []).map(social => {
                const Icon = LucideIcons[social.icon] as React.ElementType;
                if (!Icon) return null;
                return (
                  <Button asChild key={social.icon} variant="ghost" size="icon" className="text-secondary-foreground/80 hover:text-primary hover:bg-secondary/80">
                    <a href={social.href} target="_blank" rel="noopener noreferrer"><Icon className="h-5 w-5" /></a>
                  </Button>
                );
              })}
            </div>
            <p className="text-sm text-secondary-foreground/80" style={{whiteSpace: 'pre-wrap'}}>{footerContent.address}</p>
            <p className="text-sm mt-1 text-secondary-foreground/80">Email: {footerContent.email}</p>
            <p className="text-sm mt-1 text-secondary-foreground/80">Phone No: {footerContent.phone}</p>
          </div>
        </div>
        
        <div className="border-t border-secondary-foreground/20 mt-8 pt-6 text-center text-sm text-secondary-foreground/60">
            <p>
                <a href="https://adavallan.com/index.php" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    Adavallan Isaiyalayam
                </a>
                <span> © {currentYear} All Rights Reserved. Powered by </span>
                <a href="http://www.wezads.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    WEZADS
                </a>
            </p>
        </div>
      </div>
    </footer>
  );
};

export default SSCFooter;
