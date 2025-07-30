
import React from 'react';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SSCHeaderClient from './ssc-header-client';

export interface MenuItem {
    title: string;
    href: string;
}

export interface HeaderContent {
    logoUrl: string;
    siteName: string;
    menuItems: MenuItem[];
}

async function getHeaderContent(): Promise<HeaderContent | null> {
    if (firebaseInitializationError || !db) {
        console.error("Firebase not initialized, cannot fetch header content.");
        return null;
    }
    
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", "header-content"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const headerDoc = querySnapshot.docs[0].data();
            if (headerDoc.content) {
                return JSON.parse(headerDoc.content) as HeaderContent;
            }
        } else {
            console.warn("Header content document not found in Firestore.");
        }
    } catch (e) {
        console.error("Failed to parse header content from Firestore.", e);
    }
    return null;
}

const SSCHeader: React.FC = async () => {
  const headerContent = await getHeaderContent();

  return <SSCHeaderClient headerContent={headerContent} />;
};

export default SSCHeader;
