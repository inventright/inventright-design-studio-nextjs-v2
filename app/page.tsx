'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {

  const services = [
    {
      title: 'Sell Sheet',
      price: '$249',
      description: 'This is a one-page marketing piece for your product idea. There are different styles and templates available depending on your needs.',
      image: 'https://inventright.com/wp-content/uploads/2023/02/sellsheetsmple.png',
      link: '/job-intake'
    },
    {
      title: 'Virtual Prototype',
      price: '$499',
      description: 'This is a life-like 3D rendering of your product idea created by our designers. Available with an Augmented-Reality upgrade for an interactive 360 view.',
      image: 'https://inventright.com/wp-content/uploads/2023/02/vpsample.png',
      link: '/job-intake'
    },
    {
      title: 'Design Package',
      price: '$669',
      description: 'Save over $75 When Combined. This premium design package includes a Virtual Prototype and Sell Sheet.',
      badge: 'Best Value',
      image: 'https://inventright.com/wp-content/uploads/2023/02/designpkg.png',
      link: '/packages/order'
    },
    {
      title: 'Line Drawings',
      price: '$30 Each',
      description: 'Work with a designer to create clear, concise illustrations that show the features and details of your product. Each order has a 3 drawing minimum.',
      image: 'https://inventright.com/wp-content/uploads/2023/02/linedrawsmple.jpg',
      link: '/job-intake'
    }
  ];

  const carouselImages = [
    'https://inventright.com/wp-content/uploads/2025/02/treadmill.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/phone.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/hammer.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/P22.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/P21.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/P20.jpg',
  ];

  const testimonials = [
    {
      text: "I recently finished my provisional patent application, phew 😅 it was rough. I agonized and sweated it and had late nights of worry. With the encouragement of Terry my coach, It's done! My next big win is I just received my video with the voice over and the sell sheet. WOW! It's really happening! My very own commercial! It's so exciting to see it come to life.",
      author: "Andrea T"
    },
    {
      text: "I've worked with an array of freelance engineers and designers over the years. Nothing has compared to my experience with your Design Studio! The completed designs of my virtual prototype are beyond extraordinary. The team did a remarkable job on execution. Absolute home run!",
      author: "Nathan S"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      {/* Add padding to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section - NO IMAGES, just text */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Turn Your Ideas Into Reality
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Have a great product idea but don't know where to start? We create custom physical prototypes tailored to your specifications—whether a "looks-like" or "works-like" model. Bring your idea to life and showcase its market potential.
            </p>
            <Link href="/job-intake">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Our Services Section */}
        <section id="services" className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-blue-600 mb-16">
              Our Services
            </h2>

            {/* From Sketch to Digital Prototype - Blue Box with Continuous Scrolling Carousel */}
            <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
              {/* Left: Blue Card */}
              <div className="bg-blue-600 text-white p-8 rounded-lg shadow-lg">
                <h3 className="text-3xl font-bold mb-4">
                  From Sketch to Digital Prototype
                </h3>
                <p className="text-lg mb-6 text-white/90">
                  Got an idea on a napkin? We'll turn it into a high-quality 3D computer-generated prototype, giving you a clear vision of your product.
                </p>
                <a href="https://inventright.com/virtual-prototype-samples/" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-blue-600 hover:bg-white/90 font-semibold">
                    VIEW MORE SAMPLES
                  </Button>
                </a>
              </div>

              {/* Right: Continuous Horizontal Scrolling Carousel */}
              <div className="relative overflow-hidden h-64">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes scroll {
                    0% {
                      transform: translateX(0);
                    }
                    100% {
                      transform: translateX(calc(-100% / 3));
                    }
                  }
                  .carousel-track {
                    animation: scroll 13s linear infinite;
                    display: flex;
                    width: max-content;
                  }
                  .carousel-track:hover {
                    animation-play-state: paused;
                  }
                `}} />
                <div className="carousel-track">
                  {/* Triple the images for truly seamless loop */}
                  {[...carouselImages, ...carouselImages, ...carouselImages].map((image, index) => (
                    <div key={index} className="flex-shrink-0 px-2">
                      <img
                        src={image}
                        alt={`Prototype sample ${(index % carouselImages.length) + 1}`}
                        className="h-64 w-auto object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Cards - Horizontal Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-xl transition-all duration-300 relative flex flex-col"
                >
                  {service.badge && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      {service.badge}
                    </div>
                  )}
                  <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-grow">{service.description}</p>
                  <div className="mt-auto">
                    <p className="text-3xl font-bold text-blue-600 mb-4">{service.price}</p>
                    <Link href={service.link}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                  <p className="text-gray-700 mb-4 italic text-sm leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <p className="text-gray-900 font-semibold text-right">— {testimonial.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Let's turn your vision into a reality.
            </h2>
            <p className="text-xl mb-6 text-white/90">
              Contact us today to get started!
            </p>
            <p className="text-2xl font-bold mb-8">
              Call us at <a href="tel:1-800-701-7993" className="underline hover:text-white/90">1-800-701-7993</a> to Talk About Your Prototype!
            </p>
            <Link href="/job-intake">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6">
                Contact Us Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} inventRight, LLC. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
