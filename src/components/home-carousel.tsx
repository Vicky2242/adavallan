
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { type SliderItem } from '@/lib/initial-data';

interface HomeCarouselProps {
    sliderItems: SliderItem[];
    hero: {
        heading?: string;
        subheading?: string;
        primaryButtonText?: string;
        primaryButtonLink?: string;
        secondaryButtonText?: string;
        secondaryButtonLink?: string;
    } | null;
}

const HomeCarousel: React.FC<HomeCarouselProps> = ({ sliderItems, hero }) => {
    return (
        <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
            <Carousel
                className="w-full h-full"
                opts={{ align: "start", loop: true }}
                plugins={[
                    Autoplay({ delay: 5000, stopOnInteraction: false })
                ]}
            >
                <CarouselContent className="h-full">
                    {sliderItems && sliderItems.length > 0 ? (
                        sliderItems.map((item, index) => (
                            <CarouselItem key={item.id || index} className="relative h-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.sliderTitle}
                                    fill
                                    sizes="100vw"
                                    className="object-cover"
                                    data-ai-hint="bharatanatyam performance"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 bg-black/50" />
                            </CarouselItem>
                        ))
                    ) : (
                        <CarouselItem className="relative h-full">
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <p className="text-muted-foreground">No slides available.</p>
                            </div>
                        </CarouselItem>
                    )}
                </CarouselContent>

                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white p-4">
                    <h1 className="text-3xl md:text-6xl font-semibold tracking-tight drop-shadow-lg">{hero?.heading}</h1>
                    <p className="mt-3 text-lg md:text-xl max-w-3xl mx-auto drop-shadow-md">{hero?.subheading}</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Link href={hero?.primaryButtonLink || '#'}>{hero?.primaryButtonText}</Link>
                        </Button>
                         {hero?.secondaryButtonText && (
                           <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black">
                             <Link href={hero?.secondaryButtonLink || '#'}>{hero?.secondaryButtonText}</Link>
                           </Button>
                        )}
                    </div>
                </div>

                {sliderItems && sliderItems.length > 1 && (
                    <>
                        <CarouselPrevious className="absolute z-20 left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 text-foreground" />
                        <CarouselNext className="absolute z-20 right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 text-foreground" />
                    </>
                )}
            </Carousel>
        </section>
    );
};

export default HomeCarousel;
