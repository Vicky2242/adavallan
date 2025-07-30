
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, PlusCircle, Trash2, UploadCloud, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ContentPage, type ServiceProgram, type ServiceBenefit, type AwardItem } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


// Define types for dynamic content
interface MenuItem { title: string; href: string; }
interface SocialLink { icon: string; href: string; }
interface HeaderContent { logoUrl: string; siteName: string; menuItems: MenuItem[]; }
export interface FooterContent { phone: string; companyName: string; companyDescription: string; quickLinksTitle: string; quickLinks: MenuItem[];
  connectTitle: string; socials: SocialLink[]; address: string; email: string; copyright: string;
}
interface HomePageContent {
    hero: { heading: string; subheading: string; primaryButtonText: string; primaryButtonLink: string; secondaryButtonText: string; secondaryButtonLink: string; };
    embraceArt: { heading: string; paragraph1: string; paragraph2: string; linkText: string; linkHref: string; imageUrl: string; };
    whyChoose: { heading: string; features: { icon: string; title: string; description: string; }[]; };
    journey: { heading: string; paragraph: string; buttonText: string; buttonLink: string; };
}
interface Instructor { id: string; name: string; role: string; description: string; }
interface AboutPageContent {
  mainHeading: string;
  mainSubheading: string;
  journey: { heading: string; paragraph1: string; paragraph2: string; imageUrl: string; imageAlt: string; };
  missionVision: { heading: string; mission: { heading: string; text: string; }; vision: { heading: string; text: string; }; imageUrl: string; imageAlt: string; };
  instructorsSection: { heading: string; instructors: Instructor[]; };
}
interface ServicesPageContent {
  mainHeading: string; mainSubheading: string; 
  programsSection: { heading: string; programs: ServiceProgram[]; };
  benefitsSection: { heading: string; benefits: ServiceBenefit[]; };
}
interface AwardsPageContent {
  heading: string;
  subheading: string;
  awards: AwardItem[];
  studentAchievements: { heading: string; paragraph: string; imageUrl: string; imageHint: string; };
}
interface GalleryImage { src: string; hint: string; }
interface GalleryAlbum { id: string; title: string; coverImage: string; imageHint: string; images: GalleryImage[]; }
interface GalleryContent { heading: string; albums: GalleryAlbum[]; }
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


export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const { toast } = useToast();
  const headerLogoInputRef = useRef<HTMLInputElement>(null);
  const embraceArtFileInputRef = useRef<HTMLInputElement>(null);
  const journeyImageFileInputRef = useRef<HTMLInputElement>(null);
  const missionVisionImageFileInputRef = useRef<HTMLInputElement>(null);
  const studentAchievementsImageFileInputRef = useRef<HTMLInputElement>(null);
  const galleryCoverImageInputRef = useRef<HTMLInputElement>(null);
  const galleryAlbumImageInputRef = useRef<HTMLInputElement>(null);


  const [formData, setFormData] = useState<ContentPage | null>(null);
  
  const [dynamicHeaderData, setDynamicHeaderData] = useState<HeaderContent | null>(null);
  const [dynamicFooterData, setDynamicFooterData] = useState<FooterContent | null>(null);
  const [dynamicHomeData, setDynamicHomeData] = useState<HomePageContent | null>(null);
  const [dynamicAboutData, setDynamicAboutData] = useState<AboutPageContent | null>(null);
  const [dynamicServicesData, setDynamicServicesData] = useState<ServicesPageContent | null>(null);
  const [dynamicAwardsData, setDynamicAwardsData] = useState<AwardsPageContent | null>(null);
  const [dynamicGalleryData, setDynamicGalleryData] = useState<GalleryContent | null>(null);
  const [dynamicContactData, setDynamicContactData] = useState<ContactPageContent | null>(null);


  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContentMalformed, setIsContentMalformed] = useState(false);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setIsContentMalformed(false);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot load page. Firebase is not configured.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const pageDocRef = doc(db, 'pages', pageId);
        const docSnap = await getDoc(pageDocRef);
        
        if (docSnap.exists()) {
            const currentPageData = { id: docSnap.id, ...docSnap.data() } as ContentPage;
            setFormData(currentPageData);

            let parsedContent: any = null;
            if (currentPageData.content) {
                try {
                    parsedContent = JSON.parse(currentPageData.content);
                } catch (e) {
                    console.error(`Could not parse JSON for page ID ${pageId}.`, e);
                    toast({ title: "Content Warning", description: "The content for this page is malformed. Please review, fix, and save.", variant: "default" });
                    setIsContentMalformed(true);
                }
            }
            if (parsedContent) {
                if (currentPageData.slug === 'header-content') setDynamicHeaderData(parsedContent);
                if (currentPageData.slug === 'footer-content') setDynamicFooterData({ ...parsedContent, phone: parsedContent.phone ?? '' });
                if (currentPageData.slug === 'home') setDynamicHomeData(parsedContent);
                if (currentPageData.slug === 'about') setDynamicAboutData(parsedContent);
                if (currentPageData.slug === 'services') setDynamicServicesData(parsedContent);
                if (currentPageData.slug === 'awards') setDynamicAwardsData(parsedContent);
                if (currentPageData.slug === 'gallery') setDynamicGalleryData(parsedContent);
                if (currentPageData.slug === 'contact') setDynamicContactData(parsedContent);
            }
        } else {
            toast({ title: "Error", description: "Page not found in Firestore.", variant: "destructive" });
            router.push('/admin/site-pages');
        }
    } catch (error) {
        toast({ title: "Error", description: "Could not load page data from Firestore.", variant: "destructive" });
        router.push('/admin/site-pages');
    }
    setIsLoading(false);
  }, [pageId, router, toast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !db) return;
    setIsSubmitting(true);
  
    let finalContentString = formData.content || '{}';
    const pageSlug = formData.slug;

    try {
        if (pageSlug === 'header-content' && dynamicHeaderData) { finalContentString = JSON.stringify(dynamicHeaderData, null, 2); }
        else if (pageSlug === 'footer-content' && dynamicFooterData) { finalContentString = JSON.stringify(dynamicFooterData, null, 2); }
        else if (pageSlug === 'home' && dynamicHomeData) { finalContentString = JSON.stringify(dynamicHomeData, null, 2); }
        else if (pageSlug === 'about' && dynamicAboutData) { finalContentString = JSON.stringify(dynamicAboutData, null, 2); }
        else if (pageSlug === 'services' && dynamicServicesData) { finalContentString = JSON.stringify(dynamicServicesData, null, 2); }
        else if (pageSlug === 'awards' && dynamicAwardsData) { finalContentString = JSON.stringify(dynamicAwardsData, null, 2); }
        else if (pageSlug === 'gallery' && dynamicGalleryData) { finalContentString = JSON.stringify(dynamicGalleryData, null, 2); }
        else if (pageSlug === 'contact' && dynamicContactData) { finalContentString = JSON.stringify(dynamicContactData, null, 2); }
        
        JSON.parse(finalContentString);

        const pageDocRef = doc(db, 'pages', pageId);
        const updatedData = {
            ...formData,
            content: finalContentString,
            updatedAt: new Date().toISOString()
        };
        
        const { id, ...dataToUpdate } = updatedData;

        await updateDoc(pageDocRef, dataToUpdate);
        toast({ title: "Success", description: `${formData.title} page updated successfully.` });
        const isSettingsPage = pageSlug === 'header-content' || pageSlug === 'footer-content';
        const redirectPath = isSettingsPage ? '/admin/settings' : '/admin/site-pages';
        router.push(redirectPath);
        router.refresh(); 
    } catch (error: any) {
        console.error("Error during form submission:", error);
        toast({ title: "Error Saving", description: "Could not save page data. The content might be invalid JSON. " + error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDynamicHeaderData(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUri = reader.result as string;
            setDynamicHeaderData(prev => prev ? { ...prev, logoUrl: dataUri } : null);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleHeaderMenuItemChange = (index: number, field: keyof MenuItem, value: string) => {
    setDynamicHeaderData(prev => {
        if (!prev) return null;
        const newItems = [...(prev.menuItems || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        return { ...prev, menuItems: newItems };
    });
  };
  const addHeaderMenuItem = () => {
    setDynamicHeaderData(prev => prev ? { ...prev, menuItems: [...(prev.menuItems || []), { title: '', href: '' }] } : null);
  };
  const removeHeaderMenuItem = (index: number) => {
    setDynamicHeaderData(prev => prev ? { ...prev, menuItems: (prev.menuItems || []).filter((_, i) => i !== index) } : null);
  };

  const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
     const { name, value } = e.target;
    setDynamicFooterData(prev => prev ? { ...prev, [name]: value } : null);
  };
  const handleFooterLinkChange = (index: number, field: keyof MenuItem, value: string) => {
    setDynamicFooterData(prev => {
        if (!prev) return null;
        const newLinks = [...(prev.quickLinks || [])];
        newLinks[index] = { ...newLinks[index], [field]: value };
        return { ...prev, quickLinks: newLinks };
    });
  };
  const addFooterLink = () => {
    setDynamicFooterData(prev => prev ? { ...prev, quickLinks: [...(prev.quickLinks || []), { title: '', href: '' }] } : null);
  };
  const removeFooterLink = (index: number) => {
    setDynamicFooterData(prev => prev ? { ...prev, quickLinks: (prev.quickLinks || []).filter((_, i) => i !== index) } : null);
  };
  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    setDynamicFooterData(prev => {
        if (!prev) return null;
        const newSocials = [...(prev.socials || [])];
        newSocials[index] = { ...newSocials[index], [field]: value };
        return { ...prev, socials: newSocials };
    });
  };
  const addSocialLink = () => {
    setDynamicFooterData(prev => prev ? { ...prev, socials: [...(prev.socials || []), { icon: '', href: '' }] } : null);
  };
  const removeSocialLink = (index: number) => {
    setDynamicFooterData(prev => prev ? { ...prev, socials: (prev.socials || []).filter((_, i) => i !== index) } : null);
  };

  const handleHomeChange = (section: keyof HomePageContent, field: string, value: string) => {
    setDynamicHomeData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [section]: {
                ...(prev[section] as any),
                [field]: value
            }
        };
    });
  };
  const handleEmbraceArtImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!file.type.startsWith('image/')) {
              toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUri = reader.result as string;
              handleHomeChange('embraceArt', 'imageUrl', dataUri);
          };
          reader.readAsDataURL(file);
      }
  };
  const handleWhyChooseFeatureChange = (index: number, field: 'icon' | 'title' | 'description', value: string) => {
    setDynamicHomeData(prev => {
        if (!prev || !prev.whyChoose || !prev.whyChoose.features) return prev;
        const newFeatures = [...prev.whyChoose.features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        return { ...prev, whyChoose: { ...prev.whyChoose, features: newFeatures } };
    });
  };
  const addWhyChooseFeature = () => {
    setDynamicHomeData(prev => {
        if (!prev) return null;
        const newFeatures = [...(prev.whyChoose?.features || []), { icon: '', title: '', description: '' }];
        return { ...prev, whyChoose: { ...(prev.whyChoose), features: newFeatures } };
    });
  };
  const removeWhyChooseFeature = (index: number) => {
    setDynamicHomeData(prev => {
        if (!prev || !prev.whyChoose || !prev.whyChoose.features) return prev;
        const newFeatures = prev.whyChoose.features.filter((_, i) => i !== index);
        return { ...prev, whyChoose: { ...prev.whyChoose, features: newFeatures } };
    });
  };
  
 const handleAboutChange = (field: keyof Omit<AboutPageContent, 'journey' | 'missionVision' | 'instructorsSection'>, value: string) => {
    setDynamicAboutData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleNestedAboutChange = (section: 'journey' | 'missionVision' | 'instructorsSection', field: string, value: string) => {
    setDynamicAboutData(prev => {
        if (!prev) return null;
        return { ...prev, [section]: { ...(prev[section] as any), [field]: value } };
    });
  };
  const handleMissionVisionSubChange = (sub: 'mission' | 'vision', field: string, value: string) => {
    setDynamicAboutData(prev => {
        if (!prev || !prev.missionVision) return null;
        return { ...prev, missionVision: { ...prev.missionVision, [sub]: { ...(prev.missionVision[sub] as any), [field]: value } } };
    });
  };

  const handleInstructorChange = (index: number, field: keyof Omit<Instructor, 'id'>, value: string) => {
    setDynamicAboutData(prev => {
        if (!prev || !prev.instructorsSection || !prev.instructorsSection.instructors) return prev;
        const newInstructors = [...prev.instructorsSection.instructors];
        newInstructors[index] = { ...newInstructors[index], [field]: value };
        return { ...prev, instructorsSection: { ...prev.instructorsSection, instructors: newInstructors } };
    });
  };
  const addInstructor = () => {
    setDynamicAboutData(prev => {
        if (!prev) return null;
        const instructorsSection = prev.instructorsSection || { heading: 'Meet Our Esteemed Instructors', instructors: [] };
        const currentInstructors = instructorsSection.instructors || [];
        const newInstructors = [...currentInstructors, { id: `new_${Date.now()}`, name: '', role: '', description: '' }];
        return { 
            ...prev, 
            instructorsSection: { 
                ...instructorsSection,
                instructors: newInstructors 
            } 
        };
    });
  };
  const removeInstructor = (index: number) => {
    setDynamicAboutData(prev => {
        if (!prev || !prev.instructorsSection || !prev.instructorsSection.instructors) return prev;
        const newInstructors = prev.instructorsSection.instructors.filter((_, i) => i !== index);
        return { ...prev, instructorsSection: { ...prev.instructorsSection, instructors: newInstructors } };
    });
  };

  const handleAboutImageChange = (e: React.ChangeEvent<HTMLInputElement>, section: 'journey' | 'missionVision') => {
      const file = e.target.files?.[0];
      if (file) {
          if (!file.type.startsWith('image/')) {
              toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUri = reader.result as string;
              handleNestedAboutChange(section, 'imageUrl', dataUri);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleServicesChange = (section: keyof ServicesPageContent | 'main', field: string, value: string) => {
    setDynamicServicesData(prev => {
      if (!prev) return null;
      if (section === 'main') {
        return { ...prev, [field]: value };
      }
      const sectionData = prev[section as keyof ServicesPageContent] || {};
      return { ...prev, [section]: { ...sectionData, [field]: value } };
    });
  };

    const handleProgramChange = (progIndex: number, field: keyof Omit<ServiceProgram, 'id' | 'features' | 'imageUrl'>, value: string) => {
        setDynamicServicesData(prev => {
            if (!prev?.programsSection?.programs) return prev;
            const newPrograms = [...prev.programsSection.programs];
            newPrograms[progIndex] = { ...newPrograms[progIndex], [field]: value };
            return { ...prev, programsSection: { ...prev.programsSection, programs: newPrograms } };
        });
    };
    
    const handleProgramImageChange = (e: React.ChangeEvent<HTMLInputElement>, progIndex: number) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!file.type.startsWith('image/')) {
              toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUri = reader.result as string;
              setDynamicServicesData(prev => {
                if (!prev?.programsSection?.programs) return prev;
                const newPrograms = [...prev.programsSection.programs];
                newPrograms[progIndex] = { ...newPrograms[progIndex], imageUrl: dataUri };
                return { ...prev, programsSection: { ...prev.programsSection, programs: newPrograms } };
              });
          };
          reader.readAsDataURL(file);
      }
    };
    
    const handleProgramFeatureChange = (progIndex: number, featIndex: number, value: string) => {
        setDynamicServicesData(prev => {
            if (!prev?.programsSection?.programs) return prev;
            const newPrograms = [...prev.programsSection.programs];
            const newFeatures = [...newPrograms[progIndex].features];
            newFeatures[featIndex] = value;
            newPrograms[progIndex] = { ...newPrograms[progIndex], features: newFeatures };
            return { ...prev, programsSection: { ...prev.programsSection, programs: newPrograms } };
        });
    };
    const addProgramFeature = (progIndex: number) => {
        setDynamicServicesData(prev => {
            if (!prev?.programsSection?.programs) return prev;
            const newPrograms = [...prev.programsSection.programs];
            newPrograms[progIndex].features.push('');
            return { ...prev, programsSection: { ...prev.programsSection, programs: newPrograms } };
        });
    };
    const removeProgramFeature = (progIndex: number, featIndex: number) => {
        setDynamicServicesData(prev => {
            if (!prev?.programsSection?.programs) return prev;
            const newPrograms = [...prev.programsSection.programs];
            newPrograms[progIndex].features = newPrograms[progIndex].features.filter((_, i) => i !== featIndex);
            return { ...prev, programsSection: { ...prev.programsSection, programs: newPrograms } };
        });
    };
    const addProgram = () => {
        setDynamicServicesData(prev => {
            if (!prev) return null;
            const newProgram: ServiceProgram = { id: `new_prog_${Date.now()}`, title: '', category: '', icon: '', description: '', features: [], imageUrl: '', imageHint: '' };
            const programs = [...(prev.programsSection?.programs || []), newProgram];
            return { ...prev, programsSection: { ...(prev.programsSection), programs } };
        });
    };
    const removeProgram = (index: number) => {
        setDynamicServicesData(prev => {
            if (!prev?.programsSection?.programs) return prev;
            const programs = prev.programsSection.programs.filter((_, i) => i !== index);
            return { ...prev, programsSection: { ...prev.programsSection, programs } };
        });
    };
    const handleBenefitChange = (index: number, field: keyof Omit<ServiceBenefit, 'id'>, value: string) => {
        setDynamicServicesData(prev => {
            if (!prev?.benefitsSection?.benefits) return prev;
            const newBenefits = [...prev.benefitsSection.benefits];
            newBenefits[index] = { ...newBenefits[index], [field]: value };
            return { ...prev, benefitsSection: { ...prev.benefitsSection, benefits: newBenefits } };
        });
    };
    const addBenefit = () => {
        setDynamicServicesData(prev => {
            if (!prev) return null;
            const newBenefit: ServiceBenefit = { id: `new_ben_${Date.now()}`, title: '', description: '' };
            const benefits = [...(prev.benefitsSection?.benefits || []), newBenefit];
            return { ...prev, benefitsSection: { ...(prev.benefitsSection), benefits } };
        });
    };
    const removeBenefit = (index: number) => {
        setDynamicServicesData(prev => {
            if (!prev?.benefitsSection?.benefits) return prev;
            const benefits = prev.benefitsSection.benefits.filter((_, i) => i !== index);
            return { ...prev, benefitsSection: { ...prev.benefitsSection, benefits } };
        });
    };
    
    const handleAwardsChange = (field: keyof Omit<AwardsPageContent, 'awards' | 'studentAchievements'>, value: string) => {
        setDynamicAwardsData(prev => prev ? { ...prev, [field]: value } : null);
    };
    const handleAwardItemChange = (index: number, field: keyof Omit<AwardItem, 'id' | 'imageUrl'>, value: string) => {
        setDynamicAwardsData(prev => {
            if (!prev?.awards) return prev;
            const newAwards = [...prev.awards];
            newAwards[index] = { ...newAwards[index], [field]: value };
            return { ...prev, awards: newAwards };
        });
    };
    const handleAwardImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast({ title: "Invalid File Type", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUri = reader.result as string;
          setDynamicAwardsData(prev => {
            if (!prev || !prev.awards) return prev;
            const newAwards = [...prev.awards];
            newAwards[index] = { ...newAwards[index], imageUrl: dataUri };
            return { ...prev, awards: newAwards };
          });
        };
        reader.readAsDataURL(file);
      }
    };
    const addAwardItem = () => {
        setDynamicAwardsData(prev => {
            if (!prev) return null;
            const newAward: AwardItem = { id: `award_${Date.now()}`, category: 'New Category', title: '', issuer: '', description: '', icon: 'Trophy', imageUrl: 'https://placehold.co/800x450.png', imageHint: '' };
            return { ...prev, awards: [...(prev.awards || []), newAward] };
        });
    };
    const removeAwardItem = (index: number) => {
        setDynamicAwardsData(prev => prev ? { ...prev, awards: (prev.awards || []).filter((_, i) => i !== index) } : null);
    };

    const handleStudentAchievementsChange = (field: keyof Omit<AwardsPageContent['studentAchievements'], 'imageUrl'>, value: string) => {
        setDynamicAwardsData(prev => {
            if (!prev || !prev.studentAchievements) return null;
            return { ...prev, studentAchievements: { ...prev.studentAchievements, [field]: value } };
        });
    };
    
    const handleStudentAchievementImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) { toast({ title: "Invalid File", variant: "destructive" }); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUri = reader.result as string;
                setDynamicAwardsData(prev => {
                    if (!prev) return null;
                    return { ...prev, studentAchievements: { ...prev.studentAchievements, imageUrl: dataUri } };
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryHeadingChange = (value: string) => {
        setDynamicGalleryData(prev => prev ? { ...prev, heading: value } : null);
    };
    const handleAlbumChange = (albumIndex: number, field: keyof Omit<GalleryAlbum, 'images'>, value: string) => {
        setDynamicGalleryData(prev => {
            if (!prev?.albums) return prev;
            const newAlbums = [...prev.albums];
            newAlbums[albumIndex] = { ...newAlbums[albumIndex], [field]: value };
            return { ...prev, albums: newAlbums };
        });
    };
    const addAlbum = () => {
        setDynamicGalleryData(prev => {
            if (!prev) return null;
            const newAlbum: GalleryAlbum = {
                id: `album-${Date.now()}`, title: 'New Album', coverImage: 'https://placehold.co/600x400.png', imageHint: 'new album', images: []
            };
            return { ...prev, albums: [...(prev.albums || []), newAlbum] };
        });
    };
    const removeAlbum = (albumIndex: number) => {
        setDynamicGalleryData(prev => {
            if (!prev?.albums) return prev;
            const newAlbums = prev.albums.filter((_, i) => i !== albumIndex);
            return { ...prev, albums: newAlbums };
        });
    };
    
    const handleGalleryCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>, albumIndex: number) => {
        const file = e.target.files?.[0];
        if(file) {
            if (!file.type.startsWith('image/')) { toast({ title: "Invalid File Type", variant: "destructive"}); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUri = reader.result as string;
                setDynamicGalleryData(prev => {
                    if (!prev?.albums) return prev;
                    const newAlbums = [...prev.albums];
                    newAlbums[albumIndex].coverImage = dataUri;
                    return { ...prev, albums: newAlbums };
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGalleryImageChange = (albumIndex: number, imageIndex: number, field: keyof GalleryImage, value: string) => {
        setDynamicGalleryData(prev => {
            if (!prev?.albums) return prev;
            const newAlbums = [...prev.albums];
            const newImages = [...newAlbums[albumIndex].images];
            newImages[imageIndex] = { ...newImages[imageIndex], [field]: value };
            newAlbums[albumIndex] = { ...newAlbums[albumIndex], images: newImages };
            return { ...prev, albums: newAlbums };
        });
    };
    const handleGalleryAlbumImageChange = (e: React.ChangeEvent<HTMLInputElement>, albumIndex: number, imageIndex: number) => {
        const file = e.target.files?.[0];
        if(file) {
             if (!file.type.startsWith('image/')) { toast({ title: "Invalid File Type", variant: "destructive"}); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUri = reader.result as string;
                setDynamicGalleryData(prev => {
                    if (!prev?.albums) return prev;
                    const newAlbums = [...prev.albums];
                    const newImages = [...newAlbums[albumIndex].images];
                    newImages[imageIndex] = { ...newImages[imageIndex], src: dataUri };
                    newAlbums[albumIndex] = { ...newAlbums[albumIndex], images: newImages };
                    return { ...prev, albums: newAlbums };
                });
            };
            reader.readAsDataURL(file);
        }
    };


    const addImage = (albumIndex: number) => {
        setDynamicGalleryData(prev => {
            if (!prev?.albums) return prev;
            const newAlbums = [...prev.albums];
            const newImage: GalleryImage = { src: 'https://placehold.co/600x400.png', hint: 'new image' };
            newAlbums[albumIndex].images.push(newImage);
            return { ...prev, albums: newAlbums };
        });
    };
    const removeImage = (albumIndex: number, imageIndex: number) => {
        setDynamicGalleryData(prev => {
            if (!prev?.albums) return prev;
            const newAlbums = [...prev.albums];
            const newImages = newAlbums[albumIndex].images.filter((_, i) => i !== imageIndex);
            newAlbums[albumIndex] = { ...newAlbums[albumIndex], images: newImages };
            return { ...prev, albums: newAlbums };
        });
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDynamicContactData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleContactSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
        setDynamicContactData(prev => {
            if (!prev) return null;
            const newSocials = [...(prev.socials || [])];
            newSocials[index] = { ...newSocials[index], [field]: value };
            return { ...prev, socials: newSocials };
        });
    };

    const addContactSocialLink = () => {
        setDynamicContactData(prev => prev ? { ...prev, socials: [...(prev.socials || []), { icon: 'Link', href: '' }] } : null);
    };

    const removeContactSocialLink = (index: number) => {
        setDynamicContactData(prev => prev ? { ...prev, socials: (prev.socials || []).filter((_, i) => i !== index) } : null);
    };
    
    const handleAttemptDataFix = () => {
        if (!formData || typeof formData.content !== 'string') return;
        try {
            const parsed = JSON.parse(formData.content);
            if (formData.slug === 'awards') setDynamicAwardsData(parsed);
            if (formData.slug === 'home') setDynamicHomeData(parsed);
            setIsContentMalformed(false);
            toast({ title: "Data Parsed", description: "Successfully parsed existing data. You can now save." });
        } catch (e) {
            toast({ title: "Fix Failed", description: "Could not automatically fix the data. Manual correction in the textarea might be needed.", variant: "destructive" });
        }
    };


  if (isLoading || !formData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
      </div>
    );
  }
  
  const renderHeaderForm = () => dynamicHeaderData && (
    <Card>
      <CardHeader><CardTitle>Header Settings</CardTitle><CardDescription>Manage your site's logo, name, and navigation menu.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo Upload</Label>
          <div className="flex items-center gap-4">
            {dynamicHeaderData.logoUrl && (
              <Image
                src={dynamicHeaderData.logoUrl}
                alt="Logo Preview"
                width={80}
                height={80}
                className="rounded-md border object-contain"
                data-ai-hint="company logo"
              />
            )}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => headerLogoInputRef.current?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {dynamicHeaderData.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <Input
                id="logo-upload"
                type="file"
                className="hidden"
                ref={headerLogoInputRef}
                onChange={handleHeaderImageChange}
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground">Recommended size: 200x200 pixels.</p>
            </div>
          </div>
        </div>
        <div className="space-y-2"><Label htmlFor="siteName">Site Name</Label><Input id="siteName" name="siteName" value={dynamicHeaderData.siteName ?? ''} onChange={handleHeaderChange} /></div>
        <div>
            <Label>Menu Items</Label>
            <div className="space-y-3 mt-2">
              {(dynamicHeaderData.menuItems || []).map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                    <Input placeholder="Title" value={item.title ?? ''} onChange={e => handleHeaderMenuItemChange(index, 'title', e.target.value)} className="flex-1"/>
                    <Input placeholder="Href (e.g., /ssc/about)" value={item.href ?? ''} onChange={e => handleHeaderMenuItemChange(index, 'href', e.target.value)} className="flex-1"/>
                    <Button variant="destructive" size="icon" onClick={() => removeHeaderMenuItem(index)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addHeaderMenuItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Menu Item</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFooterForm = () => dynamicFooterData && (
    <Card>
      <CardHeader><CardTitle>Footer Settings</CardTitle><CardDescription>Manage all content in your site's footer.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-md"><h4 className="font-semibold text-muted-foreground">Column 1: Company Info</h4><div className="space-y-2"><Label>Company Name</Label><Input name="companyName" value={dynamicFooterData.companyName ?? ''} onChange={handleFooterChange}/></div><div className="space-y-2"><Label>Description</Label><Textarea name="companyDescription" value={dynamicFooterData.companyDescription ?? ''} onChange={handleFooterChange}/></div></div>
        <div className="space-y-4 p-4 border rounded-md"><h4 className="font-semibold text-muted-foreground">Column 2: Quick Links</h4><div className="space-y-2"><Label>Title</Label><Input name="quickLinksTitle" value={dynamicFooterData.quickLinksTitle ?? ''} onChange={handleFooterChange}/></div><div className="space-y-2"><Label>Links</Label>
            {(dynamicFooterData.quickLinks || []).map((link, index) => (<div key={index} className="flex items-center gap-2"><Input placeholder="Title" value={link.title ?? ''} onChange={e => handleFooterLinkChange(index, 'title', e.target.value)} /><Input placeholder="Href" value={link.href ?? ''} onChange={e => handleFooterLinkChange(index, 'href', e.target.value)} /><Button variant="destructive" size="icon" onClick={() => removeFooterLink(index)}><Trash2 className="h-4 w-4"/></Button></div>))}
            <Button variant="outline" size="sm" onClick={addFooterLink}><PlusCircle className="mr-2 h-4 w-4"/>Add Link</Button></div></div>
        <div className="space-y-4 p-4 border rounded-md"><h4 className="font-semibold text-muted-foreground">Column 3: Contact & Socials</h4><div className="space-y-2"><Label>Title</Label><Input name="connectTitle" value={dynamicFooterData.connectTitle ?? ''} onChange={handleFooterChange}/></div><div className="space-y-2"><Label>Address</Label><Input name="address" value={dynamicFooterData.address ?? ''} onChange={handleFooterChange}/></div><div className="space-y-2"><Label>Email</Label><Input name="email" value={dynamicFooterData.email ?? ''} onChange={handleFooterChange}/></div><div className="space-y-2"><Label>Phone</Label><Input name="phone" value={dynamicFooterData.phone ?? ''} onChange={handleFooterChange}/></div><div className="space-y-2"><Label>Social Links</Label>
            {(dynamicFooterData.socials || []).map((social, index) => (<div key={index} className="flex items-center gap-2"><Input placeholder="Icon Name (e.g., Facebook)" value={social.icon ?? ''} onChange={e => handleSocialLinkChange(index, 'icon', e.target.value)} /><Input placeholder="Full URL" value={social.href ?? ''} onChange={e => handleSocialLinkChange(index, 'href', e.target.value)} /><Button variant="destructive" size="icon" onClick={() => removeSocialLink(index)}><Trash2 className="h-4 w-4"/></Button></div>))}
            <Button variant="outline" size="sm" onClick={addSocialLink}><PlusCircle className="mr-2 h-4 w-4"/>Add Social</Button><p className="text-xs text-muted-foreground">Use icon names from <a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a> (e.g., 'Facebook', 'Twitter', 'Instagram').</p></div></div>
        <div className="space-y-2"><Label>Copyright Text</Label><Input name="copyright" value={dynamicFooterData.copyright ?? ''} onChange={handleFooterChange}/><p className="text-xs text-muted-foreground">Use {'{year}'} to automatically insert the current year.</p></div>
      </CardContent>
    </Card>
  );

  const renderHomePageForm = () => dynamicHomeData && (
    <Card><CardHeader><CardTitle>Homepage Content</CardTitle><CardDescription>Edit the sections of your main homepage.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <Card className="p-4"><CardTitle className="text-lg mb-2">Hero Section</CardTitle><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={dynamicHomeData.hero?.heading ?? ''} onChange={e => handleHomeChange('hero', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Subheading</Label><Textarea value={dynamicHomeData.hero?.subheading ?? ''} onChange={e => handleHomeChange('hero', 'subheading', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Primary Button Text</Label><Input value={dynamicHomeData.hero?.primaryButtonText ?? ''} onChange={e => handleHomeChange('hero', 'primaryButtonText', e.target.value)} /></div>
                <div className="space-y-2"><Label>Primary Button Link</Label><Input value={dynamicHomeData.hero?.primaryButtonLink ?? ''} onChange={e => handleHomeChange('hero', 'primaryButtonLink', e.target.value)} /></div>
                <div className="space-y-2"><Label>Secondary Button Text</Label><Input value={dynamicHomeData.hero?.secondaryButtonText ?? ''} onChange={e => handleHomeChange('hero', 'secondaryButtonText', e.target.value)} /></div>
                <div className="space-y-2"><Label>Secondary Button Link</Label><Input value={dynamicHomeData.hero?.secondaryButtonLink ?? ''} onChange={e => handleHomeChange('hero', 'secondaryButtonLink', e.target.value)} /></div>
            </div>
        </CardContent></Card>
        <Card className="p-4"><CardTitle className="text-lg mb-2">Embrace the Art Section</CardTitle><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={dynamicHomeData.embraceArt?.heading ?? ''} onChange={e => handleHomeChange('embraceArt', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Paragraph 1</Label><Textarea value={dynamicHomeData.embraceArt?.paragraph1 ?? ''} onChange={e => handleHomeChange('embraceArt', 'paragraph1', e.target.value)} /></div>
            <div className="space-y-2"><Label>Paragraph 2</Label><Textarea value={dynamicHomeData.embraceArt?.paragraph2 ?? ''} onChange={e => handleHomeChange('embraceArt', 'paragraph2', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Button type="button" variant="outline" onClick={() => embraceArtFileInputRef.current?.click()} className="w-full justify-center">
                <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
              </Button>
              <Input
                type="file"
                ref={embraceArtFileInputRef}
                onChange={handleEmbraceArtImageChange}
                accept="image/*"
                className="hidden"
              />
              {dynamicHomeData.embraceArt?.imageUrl && (
                <div className="mt-4 border border-border rounded-md p-2 inline-block">
                  <Image src={dynamicHomeData.embraceArt.imageUrl} alt="Embrace the art preview" width={200} height={120} className="rounded object-contain" data-ai-hint="dance class" />
                </div>
              )}
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label>Link Text</Label><Input value={dynamicHomeData.embraceArt?.linkText ?? ''} onChange={e => handleHomeChange('embraceArt', 'linkText', e.target.value)} /></div>
                <div className="space-y-2"><Label>Link Href</Label><Input value={dynamicHomeData.embraceArt?.linkHref ?? ''} onChange={e => handleHomeChange('embraceArt', 'linkHref', e.target.value)} /></div>
             </div>
        </CardContent></Card>
        <Card className="p-4"><CardTitle className="text-lg mb-2">Why Choose Us Section</CardTitle><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={dynamicHomeData.whyChoose?.heading ?? ''} onChange={e => handleHomeChange('whyChoose', 'heading', e.target.value)} /></div>
            <Label>Features</Label>
            {(dynamicHomeData.whyChoose?.features || []).map((feature, index) => (
                <div key={index} className="p-3 border rounded-md space-y-3 relative">
                     <Button variant="destructive" size="icon" className="h-6 w-6 absolute top-2 right-2" onClick={() => removeWhyChooseFeature(index)}><Trash2 className="h-4 w-4"/></Button>
                    <div className="space-y-2"><Label>Icon Name</Label><Input value={feature.icon} onChange={e => handleWhyChooseFeatureChange(index, 'icon', e.target.value)} placeholder="e.g., Users (from lucide.dev)"/></div>
                    <div className="space-y-2"><Label>Title</Label><Input value={feature.title} onChange={e => handleWhyChooseFeatureChange(index, 'title', e.target.value)} /></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea value={feature.description} onChange={e => handleWhyChooseFeatureChange(index, 'description', e.target.value)} /></div>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addWhyChooseFeature}><PlusCircle className="mr-2 h-4 w-4"/>Add Feature</Button>
        </CardContent></Card>
        <Card className="p-4"><CardTitle className="text-lg mb-2">Journey Section</CardTitle><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Heading</Label><Input value={dynamicHomeData.journey?.heading ?? ''} onChange={e => handleHomeChange('journey', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Paragraph</Label><Textarea value={dynamicHomeData.journey?.paragraph ?? ''} onChange={e => handleHomeChange('journey', 'paragraph', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Button Text</Label><Input value={dynamicHomeData.journey?.buttonText ?? ''} onChange={e => handleHomeChange('journey', 'buttonText', e.target.value)} /></div>
                <div className="space-y-2"><Label>Button Link</Label><Input value={dynamicHomeData.journey?.buttonLink ?? ''} onChange={e => handleHomeChange('journey', 'buttonLink', e.target.value)} /></div>
            </div>
        </CardContent></Card>
      </CardContent>
    </Card>
  );

  const renderAboutPageForm = () => dynamicAboutData && (
    <Card>
      <CardHeader><CardTitle>About Us Page Content</CardTitle><CardDescription>Edit the sections of your 'About Us' page.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Main Intro</CardTitle>
            <div className="space-y-2"><Label>Main Heading</Label><Input value={dynamicAboutData.mainHeading ?? ''} onChange={e => handleAboutChange('mainHeading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Main Subheading</Label><Textarea value={dynamicAboutData.mainSubheading ?? ''} onChange={e => handleAboutChange('mainSubheading', e.target.value)} /></div>
        </Card>
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Journey & Legacy</CardTitle>
            <div className="space-y-2"><Label>Heading</Label><Input value={dynamicAboutData.journey?.heading ?? ''} onChange={e => handleNestedAboutChange('journey', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Paragraph 1</Label><Textarea value={dynamicAboutData.journey?.paragraph1 ?? ''} onChange={e => handleNestedAboutChange('journey', 'paragraph1', e.target.value)} /></div>
            <div className="space-y-2"><Label>Paragraph 2</Label><Textarea value={dynamicAboutData.journey?.paragraph2 ?? ''} onChange={e => handleNestedAboutChange('journey', 'paragraph2', e.target.value)} /></div>
            <div className="space-y-2"><Label>Image</Label>
                <Button type="button" variant="outline" onClick={() => journeyImageFileInputRef.current?.click()} className="w-full justify-center">
                    <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                </Button>
                <Input type="file" ref={journeyImageFileInputRef} onChange={(e) => handleAboutImageChange(e, 'journey')} accept="image/*" className="hidden"/>
                {dynamicAboutData.journey?.imageUrl && (<div className="mt-4 border rounded-md p-2 inline-block"><Image src={dynamicAboutData.journey.imageUrl} alt="Journey preview" width={200} height={120} className="rounded object-contain" /></div>)}
            </div>
            <div className="space-y-2"><Label>Image Alt Text</Label><Input value={dynamicAboutData.journey?.imageAlt ?? ''} onChange={e => handleNestedAboutChange('journey', 'imageAlt', e.target.value)} /></div>
        </Card>
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Mission & Vision</CardTitle>
            <div className="space-y-2"><Label>Section Heading</Label><Input value={dynamicAboutData.missionVision?.heading ?? ''} onChange={e => handleNestedAboutChange('missionVision', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Mission Heading</Label><Input value={dynamicAboutData.missionVision?.mission?.heading ?? ''} onChange={e => handleMissionVisionSubChange('mission', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Mission Text</Label><Textarea value={dynamicAboutData.missionVision?.mission?.text ?? ''} onChange={e => handleMissionVisionSubChange('mission', 'text', e.target.value)} /></div>
            <div className="space-y-2"><Label>Vision Heading</Label><Input value={dynamicAboutData.missionVision?.vision?.heading ?? ''} onChange={e => handleMissionVisionSubChange('vision', 'heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Vision Text</Label><Textarea value={dynamicAboutData.missionVision?.vision?.text ?? ''} onChange={e => handleMissionVisionSubChange('vision', 'text', e.target.value)} /></div>
            <div className="space-y-2"><Label>Image</Label>
                <Button type="button" variant="outline" onClick={() => missionVisionImageFileInputRef.current?.click()} className="w-full justify-center">
                    <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                </Button>
                <Input type="file" ref={missionVisionImageFileInputRef} onChange={(e) => handleAboutImageChange(e, 'missionVision')} accept="image/*" className="hidden"/>
                {dynamicAboutData.missionVision?.imageUrl && (<div className="mt-4 border rounded-md p-2 inline-block"><Image src={dynamicAboutData.missionVision.imageUrl} alt="Mission/Vision preview" width={200} height={120} className="rounded object-contain" /></div>)}
            </div>
            <div className="space-y-2"><Label>Image Alt Text</Label><Input value={dynamicAboutData.missionVision?.imageAlt ?? ''} onChange={e => handleNestedAboutChange('missionVision', 'imageAlt', e.target.value)} /></div>
        </Card>
        <Card className="p-4 space-y-4">
          <CardTitle className="text-lg">Instructors Section</CardTitle>
          <div className="space-y-2">
            <Label>Section Heading</Label>
            <Input value={dynamicAboutData.instructorsSection?.heading ?? ''} onChange={e => handleNestedAboutChange('instructorsSection', 'heading', e.target.value)} />
          </div>
          <Label>Instructors</Label>
          <div className="space-y-4">
            {(dynamicAboutData.instructorsSection?.instructors || []).map((instructor, index) => (
              <Card key={instructor.id} className="p-3 border rounded-md space-y-3 relative">
                <Button variant="destructive" size="icon" className="h-6 w-6 absolute top-2 right-2" onClick={() => removeInstructor(index)}>
                  <Trash2 className="h-4 w-4"/>
                </Button>
                <div className="space-y-2">
                  <Label htmlFor={`inst-name-${index}`}>Name</Label>
                  <Input id={`inst-name-${index}`} value={instructor.name} onChange={e => handleInstructorChange(index, 'name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`inst-role-${index}`}>Role</Label>
                  <Input id={`inst-role-${index}`} value={instructor.role} onChange={e => handleInstructorChange(index, 'role', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`inst-desc-${index}`}>Description</Label>
                  <Textarea id={`inst-desc-${index}`} value={instructor.description} onChange={e => handleInstructorChange(index, 'description', e.target.value)} />
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addInstructor}><PlusCircle className="mr-2 h-4 w-4"/>Add Instructor</Button>
          </div>
        </Card>
      </CardContent>
    </Card>
  );

  const renderServicesForm = () => dynamicServicesData && (
    <Card>
        <CardHeader><CardTitle>Services Page Content</CardTitle><CardDescription>Edit all sections of the Services page.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
            <Card className="p-4 space-y-4"><CardTitle className="text-lg">Main Intro</CardTitle>
                <div className="space-y-2"><Label>Main Heading</Label><Input value={dynamicServicesData.mainHeading ?? ''} onChange={e => handleServicesChange('main', 'mainHeading', e.target.value)} /></div>
                <div className="space-y-2"><Label>Main Subheading</Label><Textarea value={dynamicServicesData.mainSubheading ?? ''} onChange={e => handleServicesChange('main', 'mainSubheading', e.target.value)} /></div>
            </Card>

            <Card className="p-4 space-y-4"><CardTitle className="text-lg">Programs Section</CardTitle>
                <div className="space-y-2"><Label>Section Heading</Label><Input value={dynamicServicesData.programsSection?.heading ?? ''} onChange={e => handleServicesChange('programsSection', 'heading', e.target.value)} /></div>
                {(dynamicServicesData.programsSection?.programs || []).map((program, progIndex) => (
                     <Card key={program.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button variant="destructive" size="icon" className="h-6 w-6 absolute top-2 right-2" onClick={() => removeProgram(progIndex)}><Trash2 className="h-4 w-4"/></Button>
                        <div className="space-y-2"><Label>Title</Label><Input value={program.title} onChange={e => handleProgramChange(progIndex, 'title', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Category</Label><Input value={program.category} onChange={e => handleProgramChange(progIndex, 'category', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Icon</Label><Input value={program.icon} onChange={e => handleProgramChange(progIndex, 'icon', e.target.value)} placeholder="Lucide Icon Name" /></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={program.description} onChange={e => handleProgramChange(progIndex, 'description', e.target.value)} /></div>
                        
                        <div className="space-y-2"><Label>Image</Label>
                           <Button type="button" variant="outline" onClick={() => document.getElementById(`program-image-${progIndex}`)?.click()} className="w-full justify-center">
                                <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                           </Button>
                           <Input id={`program-image-${progIndex}`} type="file" onChange={(e) => handleProgramImageChange(e, progIndex)} accept="image/*" className="hidden"/>
                           {program.imageUrl && (<div className="mt-4 border rounded-md p-2 inline-block"><Image src={program.imageUrl} alt="Program preview" width={200} height={120} className="rounded object-contain" /></div>)}
                        </div>
                        
                        <div className="space-y-2"><Label>Image Hint</Label><Input value={program.imageHint} onChange={e => handleProgramChange(progIndex, 'imageHint', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Features</Label>
                          {(program.features || []).map((feature, featIndex) => (
                            <div key={featIndex} className="flex items-center gap-2">
                              <Input value={feature} onChange={e => handleProgramFeatureChange(progIndex, featIndex, e.target.value)} />
                              <Button variant="ghost" size="icon" onClick={() => removeProgramFeature(progIndex, featIndex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => addProgramFeature(progIndex)}><PlusCircle className="mr-2 h-4 w-4"/>Add Feature</Button>
                        </div>
                    </Card>
                ))}
                <Button variant="outline" onClick={addProgram}><PlusCircle className="mr-2 h-4 w-4"/>Add Program</Button>
            </Card>

            <Card className="p-4 space-y-4"><CardTitle className="text-lg">Benefits Section</CardTitle>
                <div className="space-y-2"><Label>Section Heading</Label><Input value={dynamicServicesData.benefitsSection?.heading ?? ''} onChange={e => handleServicesChange('benefitsSection', 'heading', e.target.value)} /></div>
                {(dynamicServicesData.benefitsSection?.benefits || []).map((benefit, benIndex) => (
                     <Card key={benefit.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button variant="destructive" size="icon" className="h-6 w-6 absolute top-2 right-2" onClick={() => removeBenefit(benIndex)}><Trash2 className="h-4 w-4"/></Button>
                        <div className="space-y-2"><Label>Title</Label><Input value={benefit.title} onChange={e => handleBenefitChange(benIndex, 'title', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={benefit.description} onChange={e => handleBenefitChange(benIndex, 'description', e.target.value)} /></div>
                     </Card>
                ))}
                 <Button variant="outline" onClick={addBenefit}><PlusCircle className="mr-2 h-4 w-4"/>Add Benefit</Button>
            </Card>

        </CardContent>
    </Card>
  );

  const renderAwardsPageForm = () => dynamicAwardsData && (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
              <CardTitle>Awards Page Content</CardTitle>
              <CardDescription>Edit all sections of the Awards page.</CardDescription>
            </div>
            {isContentMalformed && (
              <Button type="button" variant="secondary" onClick={handleAttemptDataFix}>
                  <Wrench className="mr-2 h-4 w-4" /> Attempt to Fix Data
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Main Intro</CardTitle>
            <div className="space-y-2"><Label>Main Heading</Label><Input value={dynamicAwardsData.heading ?? ''} onChange={e => handleAwardsChange('heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Main Subheading</Label><Textarea value={dynamicAwardsData.subheading ?? ''} onChange={e => handleAwardsChange('subheading', e.target.value)} /></div>
        </Card>
        
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Awards List</CardTitle>
            {(dynamicAwardsData.awards || []).map((award, index) => (
                <Card key={award.id} className="p-3 border rounded-md space-y-3 relative">
                    <Button variant="destructive" size="icon" className="h-6 w-6 absolute top-2 right-2" onClick={() => removeAwardItem(index)}><Trash2 className="h-4 w-4"/></Button>
                    <div className="space-y-2"><Label>Category (For internal use)</Label><Input value={award.category} onChange={e => handleAwardItemChange(index, 'category', e.target.value)} placeholder="e.g., National Award"/></div>
                    <div className="space-y-2"><Label>Title</Label><Input value={award.title} onChange={e => handleAwardItemChange(index, 'title', e.target.value)} /></div>
                    <div className="space-y-2"><Label>Issuer</Label><Input value={award.issuer} onChange={e => handleAwardItemChange(index, 'issuer', e.target.value)} /></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea value={award.description} onChange={e => handleAwardItemChange(index, 'description', e.target.value)} /></div>
                    <div className="space-y-2"><Label>Icon</Label><Input value={award.icon} onChange={e => handleAwardItemChange(index, 'icon', e.target.value)} placeholder="e.g., Trophy (from lucide.dev)"/></div>
                    
                    <div className="space-y-2"><Label>Image</Label>
                        <Button type="button" variant="outline" onClick={() => document.getElementById(`award-image-${index}`)?.click()} className="w-full justify-center">
                            <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                        </Button>
                        <Input id={`award-image-${index}`} type="file" onChange={(e) => handleAwardImageChange(e, index)} accept="image/*" className="hidden"/>
                        {award.imageUrl && (<div className="mt-4 border rounded-md p-2 inline-block"><Image src={award.imageUrl} alt="Award preview" width={200} height={120} className="rounded object-contain" /></div>)}
                    </div>

                    <div className="space-y-2"><Label>Image Hint (for AI)</Label><Input value={award.imageHint} onChange={e => handleAwardItemChange(index, 'imageHint', e.target.value)} /></div>
                </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addAwardItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Award</Button>
        </Card>

        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Student Achievements Section</CardTitle>
             <div className="space-y-2"><Label>Heading</Label><Input value={dynamicAwardsData.studentAchievements?.heading ?? ''} onChange={e => handleStudentAchievementsChange('heading', e.target.value)} /></div>
             <div className="space-y-2"><Label>Paragraph</Label><Textarea value={dynamicAwardsData.studentAchievements?.paragraph ?? ''} onChange={e => handleStudentAchievementsChange('paragraph', e.target.value)} /></div>
             <div className="space-y-2"><Label>Image</Label>
                <Button type="button" variant="outline" onClick={() => studentAchievementsImageFileInputRef.current?.click()} className="w-full justify-center">
                    <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                </Button>
                <Input type="file" ref={studentAchievementsImageFileInputRef} onChange={handleStudentAchievementImageChange} accept="image/*" className="hidden"/>
                {dynamicAwardsData.studentAchievements?.imageUrl && (<div className="mt-4 border rounded-md p-2 inline-block"><Image src={dynamicAwardsData.studentAchievements.imageUrl} alt="Student Achievements preview" width={200} height={120} className="rounded object-contain" /></div>)}
            </div>
             <div className="space-y-2"><Label>Image Hint (for AI)</Label><Input value={dynamicAwardsData.studentAchievements?.imageHint ?? ''} onChange={e => handleStudentAchievementsChange('imageHint', e.target.value)} /></div>
        </Card>
      </CardContent>
    </Card>
  );

  const renderGalleryForm = () => dynamicGalleryData && (
    <Card>
      <CardHeader><CardTitle>Gallery Page Content</CardTitle><CardDescription>Edit all sections of the Gallery page.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Main Intro</CardTitle>
          <div className="space-y-2"><Label>Main Heading</Label><Input value={dynamicGalleryData.heading ?? ''} onChange={e => handleGalleryHeadingChange(e.target.value)} /></div>
        </Card>
  
        <Card className="p-4 space-y-4"><CardTitle className="text-lg">Albums</CardTitle>
          {(dynamicGalleryData.albums || []).map((album, albumIndex) => (
            <Card key={album.id} className="p-4 border rounded-md space-y-3 relative">
              <Button variant="destructive" size="icon" className="h-7 w-7 absolute top-2 right-2" onClick={() => removeAlbum(albumIndex)}><Trash2 className="h-4 w-4"/></Button>
              <div className="space-y-2"><Label>Album Title</Label><Input value={album.title} onChange={e => handleAlbumChange(albumIndex, 'title', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Album ID (Slug)</Label><Input value={album.id} onChange={e => handleAlbumChange(albumIndex, 'id', e.target.value)} placeholder="e.g., annual-show-2024" /></div>
                <div className="space-y-2"><Label>Cover Image Hint</Label><Input value={album.imageHint} onChange={e => handleAlbumChange(albumIndex, 'imageHint', e.target.value)} placeholder="e.g., dance performance stage" /></div>
              </div>
              
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <Button type="button" variant="outline" onClick={() => document.getElementById(`cover-image-${albumIndex}`)?.click()} className="w-full justify-center">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Cover Image
                </Button>
                <Input id={`cover-image-${albumIndex}`} type="file" onChange={(e) => handleGalleryCoverImageChange(e, albumIndex)} accept="image/*" className="hidden"/>
                {album.coverImage && (<div className="mt-4 border rounded-md p-2 inline-block"><Image src={album.coverImage} alt="Cover preview" width={200} height={120} className="rounded object-contain" /></div>)}
              </div>
  
              <div className="space-y-2 pt-4 border-t"><Label>Images in this Album</Label>
                {(album.images || []).map((image, imageIndex) => (
                  <div key={imageIndex} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Album Image {imageIndex + 1}</Label>
                       <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`album-image-${albumIndex}-${imageIndex}`)?.click()} className="w-full justify-center">
                           <UploadCloud className="mr-2 h-4 w-4" /> Upload Image
                       </Button>
                       <Input id={`album-image-${albumIndex}-${imageIndex}`} type="file" onChange={(e) => handleGalleryAlbumImageChange(e, albumIndex, imageIndex)} accept="image/*" className="hidden"/>
                       {image.src && (<div className="mt-2 border rounded-md p-2 inline-block"><Image src={image.src} alt="Album image preview" width={100} height={60} className="rounded object-contain" /></div>)}
                    </div>
                    <div className="flex-1 space-y-2">
                       <Label htmlFor={`hint-${albumIndex}-${imageIndex}`} className="text-xs">AI Hint</Label>
                       <Input id={`hint-${albumIndex}-${imageIndex}`} placeholder="AI Hint" value={image.hint} onChange={e => handleGalleryImageChange(albumIndex, imageIndex, 'hint', e.target.value)} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeImage(albumIndex, imageIndex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addImage(albumIndex)}><PlusCircle className="mr-2 h-4 w-4"/>Add Image to Album</Button>
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={addAlbum}><PlusCircle className="mr-2 h-4 w-4"/>Add New Album</Button>
        </Card>
      </CardContent>
    </Card>
  );

  const renderContactForm = () => dynamicContactData && (
    <Card>
        <CardHeader><CardTitle>Contact Page Content</CardTitle><CardDescription>Edit the details for your contact page.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="heading">Heading</Label><Input id="heading" name="heading" value={dynamicContactData.heading ?? ''} onChange={handleContactChange} /></div>
            <div className="space-y-2"><Label htmlFor="paragraph">Introductory Paragraph</Label><Textarea id="paragraph" name="paragraph" value={dynamicContactData.paragraph ?? ''} onChange={handleContactChange} /></div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" name="address" value={dynamicContactData.address ?? ''} onChange={handleContactChange} placeholder="Enter full address, use new lines for breaks."/></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" value={dynamicContactData.phone ?? ''} onChange={handleContactChange} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={dynamicContactData.email ?? ''} onChange={handleContactChange} /></div>
            <div className="space-y-2"><Label htmlFor="website">Website URL</Label><Input id="website" name="website" type="url" value={dynamicContactData.website ?? ''} onChange={handleContactChange} placeholder="e.g., https://www.example.com"/></div>
            <div className="space-y-2"><Label htmlFor="mapUrl">Google Maps Embed URL</Label><Textarea id="mapUrl" name="mapUrl" value={dynamicContactData.mapUrl ?? ''} onChange={handleContactChange} placeholder="Paste the full embed URL from Google Maps"/></div>

            <div className="space-y-2">
                <Label>Social Links</Label>
                <div className="space-y-3">
                    {(dynamicContactData.socials || []).map((social, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                            <Input placeholder="Icon Name (e.g., Facebook)" value={social.icon} onChange={(e) => handleContactSocialLinkChange(index, 'icon', e.target.value)} />
                            <Input placeholder="Full URL (e.g., https://facebook.com/user)" value={social.href} onChange={(e) => handleContactSocialLinkChange(index, 'href', e.target.value)} />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeContactSocialLink(index)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addContactSocialLink}><PlusCircle className="mr-2 h-4 w-4" /> Add Social Link</Button>
                    <p className="text-xs text-muted-foreground">Use icon names from <a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a></p>
                </div>
            </div>
        </CardContent>
    </Card>
);


  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href={(formData?.slug === 'header-content' || formData?.slug === 'footer-content') ? "/admin/settings" : "/admin/site-pages"}><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit {formData.title} Page</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        {formData?.slug === 'header-content' && renderHeaderForm()}
        {formData?.slug === 'footer-content' && renderFooterForm()}
        {formData?.slug === 'home' && renderHomePageForm()}
        {formData?.slug === 'about' && renderAboutPageForm()}
        {formData?.slug === 'services' && renderServicesForm()}
        {formData?.slug === 'awards' && renderAwardsPageForm()}
        {formData?.slug === 'gallery' && renderGalleryForm()}
        {formData?.slug === 'contact' && renderContactForm()}
        
        <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push((formData?.slug === 'header-content' || formData?.slug === 'footer-content') ? '/admin/settings' : '/admin/site-pages')}>
            Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
            </Button>
        </div>
      </form>
    </div>
  );
}
