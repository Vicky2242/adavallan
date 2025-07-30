

// This key is no longer used for seeding pages, but might still be used by components during transition.
export const PAGES_STORAGE_KEY = 'adminContentPagesData';
export const SLIDER_ITEMS_STORAGE_KEY = 'adminSliderItemsData';

export interface ContentPage {
  id: string; // Document ID from Firestore
  title: string;
  slug: string;
  isHomepage: boolean;
  status: 'published' | 'draft';
  createdAt: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  updatedAt?: string;
}

// NOTE: This data is now used to seed Firestore, not localStorage. The client-side `id` is ignored.
export const initialPagesData: Omit<ContentPage, 'id'>[] = [
  { 
    title: 'Home', 
    slug: 'home', 
    isHomepage: true, 
    status: 'published', 
    createdAt: '2024-07-20', 
    updatedAt: '2024-07-20',
    content: JSON.stringify({
      hero: {
        heading: "Welcome to SadhanaiSigaram",
        subheading: "Nurturing tradition, inspiring artistry. Discover the timeless beauty of Bharatanatyam with us.",
        primaryButtonText: "Explore Our Classes",
        primaryButtonLink: "/register",
        secondaryButtonText: "Contact Us",
        secondaryButtonLink: "/ssc/contact"
      },
      embraceArt: {
        heading: "Embrace the Art of Bharathanatyam",
        paragraph1: "SadhanaiSigaram is a premier Bharatanatyam dance studio dedicated to preserving and promoting the rich cultural heritage of this classical Indian dance form. We offer comprehensive training for all ages and skill levels, fostering a deep appreciation for the art.",
        paragraph2: "Our experienced instructors provide personalized guidance, ensuring that each student develops strong technique, expressive storytelling, and a profound connection to Bharatanatyam.",
        linkText: "Learn More About Us →",
        linkHref: "/ssc/about",
        imageUrl: "https://images.unsplash.com/photo-1588265038343-228519145693?q=80&w=600&h=400&fit=crop"
      },
      whyChoose: {
        heading: "Why Choose SadhanaiSigaram?",
        features: [
          {
            icon: "Users",
            title: "Expert Instructors",
            description: "Learn from highly experienced and passionate Bharatanatyam gurus."
          },
          {
            icon: "BookOpen",
            title: "Traditional Pedagogy",
            description: "Authentic teaching methods rooted in ancient traditions."
          },
          {
            icon: "Trophy",
            title: "Performance Opportunities",
            description: "Showcase your talent at recitals, events, and competitions."
          }
        ]
      },
      journey: {
        heading: "Begin Your Dance Journey Today",
        paragraph: "Whether you're a beginner or an experienced dancer, SadhanaiSigaram offers a welcoming and inspiring environment to explore the world of Bharatanatyam.",
        buttonText: "Enroll Now",
        buttonLink: "/ssc/contact"
      }
    }, null, 2)
  },
  { 
    title: 'About', 
    slug: 'about', 
    isHomepage: false, 
    status: 'published', 
    createdAt: '2024-07-20',
    updatedAt: '2024-07-20',
    content: JSON.stringify({
      mainHeading: "Adavallan Isaiyalayam",
      mainSubheading: "We teach bharatham to whoever is interested",
      journey: {
        heading: "About Adavallan Isaiyalayam",
        paragraph1: "'Adavallan Isaiyalayam - The Bharatanatyam and music teaching and training School' was founded on 1st September, 2008 by “Nattuvanga Kalaimani” Karuvoor Nava Athistabalan, who a well-known Bharatanatyam preceptor hail from the southern part of Tamilnadu Dindigul. He has more than 15 years of experience in the ancient Indian classical art Bharatanatyam.",
        paragraph2: "As a Bharatanatyam preceptor he has trained more than 10000 students so far. He has done Salangai Worship and Acceptance ceremony for more than 100 students so far and also conducted many Arangetram stages for his students.He has performed bharathanatyam dance programs in many Shiva Sthalas across India along with his students.",
        imageUrl: "https://placehold.co/500x500.png",
        imageAlt: "A Bharatanatyam dancer in a striking pose"
      },
      missionVision: {
        heading: "Our Mission & Vision",
        mission: {
          heading: "Mission",
          text: "To impart authentic Bharatanatyam training, fostering discipline, creativity, and cultural appreciation in every student."
        },
        vision: {
          heading: "Vision",
          text: "To be a leading institution for Bharatanatyam, recognized globally for excellence in education, performance, and preservation of this classical art form."
        },
        imageUrl: "https://placehold.co/500x500.png",
        imageAlt: "A group of Bharatanatyam dancers performing on stage"
      },
      instructorsSection: {
        heading: "Meet Our Esteemed Instructors",
        instructors: [
          {
            id: "inst_1",
            name: "Smt. Vidya Natarajan",
            role: "Founder & Artistic Director",
            description: "Smt. Vidya Natarajan, a distinguished Bharatanatyam exponent, has dedicated over three decades to the art form. Her vision for SadhanaiSigaram is to create a nurturing space where tradition meets innovation."
          },
          {
            id: "inst_2",
            name: "Sri. Anand Kumar",
            role: "Senior Instructor",
            description: "Sri. Anand Kumar brings a wealth of performance experience and a passion for teaching. He specializes in advanced Nattuvangam and choreography, inspiring students to reach new heights."
          }
        ]
      }
    }, null, 2)
  },
  { 
    title: 'Services', 
    slug: 'services', 
    isHomepage: false, 
    status: 'published', 
    createdAt: '2024-07-20',
    updatedAt: '2024-07-20',
    content: JSON.stringify({
      mainHeading: "Our Services",
      mainSubheading: "Explore the diverse range of Bharatanatyam training and opportunities we offer at SadhanaiSigaram.",
      programsSection: {
        heading: "Dance Classes & Programs",
        programs: [
          {
            id: "prog_1",
            title: "Beginner Bharatanatyam Classes",
            category: "Beginner Class",
            icon: "Feather",
            description: "Introduction to fundamental adavus (steps), hasta mudras (hand gestures), and basic theory. Perfect for new students of all ages.",
            features: [
              "Basic Adavus",
              "Hasta Mudras",
              "Rhythm Introduction",
              "Storytelling Basics"
            ],
            imageUrl: "https://images.unsplash.com/photo-1594868453472-5a0a7d57864f?q=80&w=600&h=400&fit=crop",
            imageHint: "dance class basics"
          },
          {
            id: "prog_2",
            title: "Intermediate & Advanced Classes",
            category: "Advanced Class",
            icon: "Gem",
            description: "Focus on complex adavu combinations, abhinaya (expressions), items from the margam (repertoire), and Nattuvangam.",
            features: [
              "Complex Repertoire",
              "Advanced Abhinaya",
              "Nattuvangam Skills",
              "Choreography Principles"
            ],
            imageUrl: "https://images.unsplash.com/photo-1588265038343-228519145693?q=80&w=600&h=400&fit=crop",
            imageHint: "advanced dance pose"
          },
          {
            id: "prog_3",
            title: "Specialized Workshops",
            category: "Workshop",
            icon: "Sparkles",
            description: "Periodic workshops on specific aspects like Abhinaya, Nattuvangam, choreography, makeup, and costume styling.",
            features: [
              "Guest Lecturers",
              "Focused Skill Development",
              "Practical Sessions",
              "Certification Options"
            ],
            imageUrl: "https://images.unsplash.com/photo-1557425529-b1494de3a13a?q=80&w=600&h=400&fit=crop",
            imageHint: "dance workshop"
          },
          {
            id: "prog_4",
            title: "Performance Opportunities",
            category: "Stage Performance",
            icon: "Trophy",
            description: "Students get opportunities to perform at annual recitals, community events, and prestigious dance festivals.",
            features: [
              "Annual Recitals",
              "Festival Participation",
              "Community Outreach",
              "Ensemble Work"
            ],
            imageUrl: "https://images.unsplash.com/photo-1542487354-feaf934752e5?q=80&w=600&h=400&fit=crop",
            imageHint: "stage performance"
          }
        ]
      },
      benefitsSection: {
        heading: "Why Train With Us?",
        benefits: [
            {
                id: "ben_1",
                title: "Authentic Tradition",
                description: "Learn Bharatanatyam in its purest form, guided by ancient texts and guru-shishya parampara."
            },
            {
                id: "ben_2",
                title: "Holistic Development",
                description: "We focus on not just technique, but also on emotional expression, cultural understanding, and discipline."
            },
            {
                id: "ben_3",
                title: "Supportive Community",
                description: "Join a family of passionate dancers and art lovers who support and inspire each other."
            }
        ]
      }
    }, null, 2)
  },
  { 
    title: 'Awards', 
    slug: 'awards', 
    isHomepage: false, 
    status: 'published', 
    createdAt: '2024-07-20',
    updatedAt: '2024-07-20',
    content: JSON.stringify({
      "heading": "Awards & Recognition",
      "subheading": "Celebrating the milestones and accolades achieved by SadhanaiSigaram and our talented students.",
      "awards": [
        { "id": "award_1", "category": "National Recognition", "title": "National Nritya Shiromani Award", "issuer": "2023 - All India Cultural Dance Federation", "description": "Awarded for outstanding contribution to promoting classical Indian dance.", "icon": "Trophy", "imageUrl": "https://placehold.co/800x450.png", "imageHint": "award ceremony" },
        { "id": "award_2", "category": "State-Level", "title": "Best Choreography Award - State Level", "issuer": "2022 - State Arts Council", "description": "Recognized for innovative and traditional choreography in the annual state dance competition.", "icon": "Award", "imageUrl": "https://placehold.co/800x450.png", "imageHint": "choreography award" },
        { "id": "award_3", "category": "Government Grant", "title": "Young Talent Promotion Grant", "issuer": "2021 - Ministry of Culture", "description": "Received a grant for nurturing young talents in Bharatanatyam and providing them with performance platforms.", "icon": "Star", "imageUrl": "https://placehold.co/800x450.png", "imageHint": "grant certificate" },
        { "id": "award_4", "category": "International", "title": "Cultural Ambassador Recognition", "issuer": "2020 - International Dance Alliance", "description": "Acknowledged for efforts in showcasing Indian culture through Bharatanatyam at international forums.", "icon": "Badge", "imageUrl": "https://placehold.co/800x450.png", "imageHint": "cultural event" }
      ],
      "studentAchievements": {
        "heading": "Student Achievements",
        "paragraph": "We take immense pride in the accomplishments of our students, who regularly win accolades at various competitions and receive recognition for their dedication and talent. Their success is a testament to their hard work and the quality of training at SadhanaiSigaram.",
        "imageUrl": "https://placehold.co/1200x675.png",
        "imageHint": "students trophies"
      }
    }, null, 2)
  },
  { 
    title: 'Gallery', 
    slug: 'gallery', 
    isHomepage: false, 
    status: 'published', 
    createdAt: '2024-07-20',
    updatedAt: '2024-07-20',
    content: JSON.stringify({
      heading: "Event Gallery",
      albums: [
        {
          id: "annual-showcase-2023",
          title: "Annual Showcase 2023",
          coverImage: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=600&h=400&fit=crop",
          imageHint: "stage performance dancers",
          images: [
            { "src": "https://images.unsplash.com/photo-1542487354-feaf934752e5?q=80&w=600&h=400&fit=crop", "hint": "group dance" },
            { "src": "https://images.unsplash.com/photo-1588265038343-228519145693?q=80&w=600&h=400&fit=crop", "hint": "solo dance" },
            { "src": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=600&h=400&fit=crop", "hint": "audience applause" }
          ]
        },
        {
          id: "summer-workshop-2023",
          title: "Summer Workshop 2023",
          coverImage: "https://images.unsplash.com/photo-1557425529-b1494de3a13a?q=80&w=600&h=400&fit=crop",
          imageHint: "dance workshop students",
          images: [
            { "src": "https://images.unsplash.com/photo-1584813539824-7434574b66b2?q=80&w=600&h=400&fit=crop", "hint": "learning steps" },
            { "src": "https://images.unsplash.com/photo-1594868453472-5a0a7d57864f?q=80&w=600&h=400&fit=crop", "hint": "instructor teaching" },
            { "src": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=600&h=400&fit=crop", "hint": "group photo" }
          ]
        },
        {
          id: "charity-gala-2022",
          title: "Charity Gala 2022",
          coverImage: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&h=400&fit=crop",
          imageHint: "gala event charity",
          images: [
            { "src": "https://images.unsplash.com/photo-1615184697985-5404ad318502?q=80&w=600&h=400&fit=crop", "hint": "performance gala" },
            { "src": "https://images.unsplash.com/photo-1504197980513-4a17b3379058?q=80&w=600&h=400&fit=crop", "hint": "dignitaries event" }
          ]
        },
        {
          id: "arangetram-season-2022",
          title: "Arangetram Season 2022",
          coverImage: "https://images.unsplash.com/photo-1565373634242-5279a0532294?q=80&w=600&h=400&fit=crop",
          imageHint: "solo performance arangetram",
          images: [
            { "src": "https://images.unsplash.com/photo-1588265038343-228519145693?q=80&w=600&h=400&fit=crop", "hint": "debut performance" },
            { "src": "https://images.unsplash.com/photo-1584813539824-7434574b66b2?q=80&w=600&h=400&fit=crop", "hint": "dancer portrait" }
          ]
        }
      ]
    }, null, 2)
  },
  { 
    title: 'Contact', 
    slug: 'contact', 
    isHomepage: false, 
    status: 'published', 
    createdAt: '2024-07-20',
    updatedAt: '2024-07-20',
    content: JSON.stringify({
      heading: "Get In Touch",
      paragraph: "Have questions? We'd love to hear from you. Reach out to us via any of the methods below.",
      address: "Adavallan Isaiyalayam\n3/627 A, 3rd cross street,\nN.S. Nagar, Old Karur Road,\nDindigul - 624005, Tamilnadu.",
      phone: "+91 967 7500 442, +91 967 7500 443",
      email: "adavallanisaiyalayam@gmail.com",
      website: "http://www.adavallan.com",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.986347969894!2d77.9897868147937!3d10.37984189249404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b00aa6e94e9f7e5%3A0x8085a23998184e9d!2sPannai%20College%20of%20Pharmacy!5e0!3m2!1sen!2sin!4v1620912053185!5m2!1sen!2sin",
      socials: [
        { "icon": "Facebook", "href": "https://facebook.com" },
        { "icon": "Youtube", "href": "https://youtube.com" },
        { "icon": "Instagram", "href": "https://instagram.com" }
      ]
    }, null, 2)
  },
  {
    title: 'Header Content',
    slug: 'header-content',
    isHomepage: false,
    status: 'published',
    createdAt: '2024-07-25',
    updatedAt: '2024-07-25',
    content: JSON.stringify({
        logoUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&h=200&fit=crop",
        siteName: "SadhanaiSigaram",
        menuItems: [
            { "title": "Home", "href": "/ssc/home" },
            { "title": "About Us", "href": "/ssc/about" },
            { "title": "Our Services", "href": "/ssc/services" },
            { "title": "Awards", "href": "/ssc/awards" },
            { "title": "Gallery", "href": "/ssc/gallery" },
            { "title": "Events", "href": "/ssc/events" },
            { "title": "Hall Ticket", "href": "/ssc/hall-ticket" }
        ]
    }, null, 2)
  },
  {
    title: 'Footer Content',
    slug: 'footer-content',
    isHomepage: false,
    status: 'published',
    createdAt: '2024-07-25',
    updatedAt: '2024-07-25',
    content: JSON.stringify({
      companyName: "Adavallan Isaiyalayam",
      companyDescription: "Nurturing tradition, inspiring artistry in Bharatanatyam.",
      quickLinksTitle: "Quick Links",
      quickLinks: [
          { "title": "About Us", "href": "/ssc/about" },
          { "title": "Services", "href": "/ssc/services" },
          { "title": "Contact", "href": "/ssc/contact" },
          { "title": "Gallery", "href": "/ssc/gallery" },
          { "title": "Certificate", "href": "/ssc/certificate" }
      ],
      connectTitle: "GET IN TOUCH",
      socials: [
          { "icon": "Facebook", "href": "https://facebook.com" },
          { "icon": "Youtube", "href": "https://youtube.com" },
          { "icon": "Instagram", "href": "https://instagram.com" }
      ],
      address: "Adavallan Isaiyalayam 3/627 A, 3rd cross street, N.S.\nNagar, Old Karur Road, Dindigul - 624005, Tamilnadu.",
      email: "adavallanisaiyalayam@gmail.com",
      phone: "+91 967 7500 442, +91 967 7500 443",
      copyright: "Adavallan Isaiyalayam © {year} All rights reserved. WEZADS"
    }, null, 2)
  }
];

export interface SliderItem {
  id: string;
  sliderTitle: string;
  imageUrl: string; 
  sortOrder: number;
}

export const initialSliderItems: SliderItem[] = [
  {
    id: 'slide_1',
    sliderTitle: 'Rhythmic Grace in Motion',
    imageUrl: 'https://images.unsplash.com/photo-1588265038343-228519145693?q=80&w=1920&h=1080&fit=crop',
    sortOrder: 1,
  },
  {
    id: 'slide_2',
    sliderTitle: 'Expressions of the Divine',
    imageUrl: 'https://images.unsplash.com/photo-1542487354-feaf934752e5?q=80&w=1920&h=1080&fit=crop',
    sortOrder: 2,
  },
  {
    id: 'slide_3',
    sliderTitle: 'A Legacy of Classical Art',
    imageUrl: 'https://images.unsplash.com/photo-1615184697985-5404ad318502?q=80&w=1920&h=1080&fit=crop',
    sortOrder: 3,
  },
];

export const EVENTS_STORAGE_KEY = 'adminAllEventsData'; 

export interface RegistrationType {
  id: string;
  name: string;
  price: number;
}

export interface Event {
  id: string;
  eventTitle: string;
  date: string;
  category: string;
  location: string;
  mapUrl: string;
  description: string;
  registrationStatus: 'open' | 'closed' | 'scheduled';
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationTypes: RegistrationType[];
}

export const initialEventsData: Event[] = [
  { id: '1', eventTitle: 'Annual Dance Showcase', date: '2024-12-15T18:00', category: 'Performance', location: 'Community Hall, Chennai', mapUrl: 'https://maps.google.com', description: 'A grand showcase of our students\' talent.', registrationStatus: 'scheduled', registrationStartDate: '2024-10-01T00:00', registrationEndDate: '2024-12-10T23:59', registrationTypes: [{ id: '1a', name: 'General Admission', price: 500 }, { id: '1b', name: 'VIP', price: 1500 }] },
  { id: '2', eventTitle: 'Summer Workshop', date: '2025-06-20T10:00', category: 'Workshop', location: 'Studio A, Bangalore', mapUrl: 'https://maps.google.com', description: 'An intensive workshop on advanced techniques.', registrationStatus: 'closed', registrationTypes: [{ id: '2a', name: '', price: 2000 }] },
  { id: '3', eventTitle: 'Classical Fusion Night', date: '2024-08-10T19:00', category: 'Fusion Concert', location: 'Open Air Theatre, Mumbai', mapUrl: 'https://maps.google.com', description: 'An evening of classical dance blended with contemporary music.', registrationStatus: 'open', registrationStartDate: '2024-07-01T00:00', registrationEndDate: '2024-08-08T23:59', registrationTypes: [{ id: '3a', name: 'Online Viewer', price: 300 }, { id: '3b', name: 'In-Person Seat', price: 750 }] },
  { id: '4', eventTitle: 'Beginner Arangetram Prep', date: '2025-01-15T09:00', category: 'Training', location: 'Main Auditorium, Delhi', mapUrl: 'https://maps.google.com', description: 'A preparatory workshop for students planning their Arangetram.', registrationStatus: 'scheduled', registrationStartDate: '2024-11-01T00:00', registrationEndDate: '2025-01-10T23:59', registrationTypes: [{ id: '4a', name: '', price: 5000 }] },
  { id: '5', eventTitle: 'Test Event - Open Now', date: '2025-09-01T10:00', category: 'Testing', location: 'Virtual', mapUrl: '', description: 'This event is open for testing the registration flow.', registrationStatus: 'open', registrationTypes: [{ id: '5a', name: 'Test Ticket', price: 100 }] },
  { id: '6', eventTitle: 'Test Event - Scheduled', date: '2025-10-01T10:00', category: 'Testing', location: 'Virtual', mapUrl: '', description: 'This event is scheduled for the future.', registrationStatus: 'scheduled', registrationStartDate: '2025-09-15T00:00', registrationEndDate: '2025-09-30T23:59', registrationTypes: [{ id: '6a', name: 'Early Bird', price: 50 }, {id: '6b', name: 'Standard', price: 75}] }
];

export interface ServiceProgram { id: string; title: string; category: string; icon: string; description: string; features: string[]; imageUrl: string; imageHint: string; }
export interface ServiceBenefit { id: string; title: string; description: string; }
export interface AwardItem { id: string; category: string; title: string; issuer: string; description: string; icon: string; imageUrl: string; imageHint: string; }
