import React, { useEffect, useRef, useState } from "react";
import baseLogoSrc from "../assets/baselogo.svg";
import ethereumLogoSrc from "../assets/ethereumlogo.png";
import solanaLogoSrc from "../assets/solanalogo.svg";
import arbitrumLogoSrc from "../assets/arbitrumlogo.png";
import polygonLogoSrc from "../assets/polygonlogo.png";
import "./style.css";

interface LogoProps {
   name: string;
   isBase?: boolean;
   imgSrc: string;
   alt: string;
}

const Logo: React.FC<LogoProps> = ({ isBase = false, imgSrc, alt }) => {
   const [isHovered, setIsHovered] = useState(false);
   const logoRef = useRef<HTMLImageElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const animationRef = useRef<number>();

   useEffect(() => {
      if (!isBase || !logoRef.current || !containerRef.current) return;

      let startTime = Date.now();
      const duration = 6000; // 6 seconds for full animation cycle (2 phases instead of 4)

      const animate = () => {
         if (!logoRef.current || !containerRef.current) return;

         // Time calculation for animation cycle
         const elapsed = (Date.now() - startTime) % duration;
         const progress = elapsed / duration;

         // Track the current animation phase
         const phase = Math.floor(progress * 2) % 2; // 2 distinct phases
         const phaseProgress = (progress * 2) % 1; // Progress within current phase (0-1)

         // Reset transformations
         logoRef.current.style.transform = "none";
         logoRef.current.style.filter = "none";
         containerRef.current.style.filter = "none";

         // Different animation phases
         switch (phase) {
            case 0: // Morphing/stretching phase
               const stretchX = 1 + Math.sin(phaseProgress * Math.PI) * 0.1;
               const stretchY = 1 - Math.sin(phaseProgress * Math.PI) * 0.05;
               logoRef.current.style.transform = `scale(${stretchX}, ${stretchY})`;
               break;

            case 1: // Rotation and glow phase
               const rotation = Math.sin(phaseProgress * Math.PI * 2) * 2; // -2 to 2 degrees
               const glowSize = 5 + Math.sin(phaseProgress * Math.PI) * 15; // 5-20px glow
               const glowOpacity =
                  0.6 + Math.sin(phaseProgress * Math.PI) * 0.4; // 0.6-1.0 opacity
               logoRef.current.style.transform = `rotate(${rotation}deg) scale(1.05)`;
               containerRef.current.style.filter = `drop-shadow(0 0 ${glowSize}px rgba(59, 130, 246, ${glowOpacity}))`;
               break;
         }

         animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
         if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
         }
      };
   }, [isBase]);

   return (
      <div
         className="flex items-center justify-center"
         style={{ width: "calc(20% - 2%)" }}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
         <div
            ref={containerRef}
            className="relative flex items-center justify-center w-full">
            {isBase ? (
               // Enhanced dynamic Base logo animation with multiple effects
               <>
                  {/* Animated background elements */}
                  <div className="absolute w-full h-full opacity-30">
                     {/* Dynamic particle effect */}
                     {[...Array(6)].map((_, i) => (
                        <div
                           key={i}
                           className="absolute rounded-full bg-blue-500 opacity-80"
                           style={{
                              width: `${4 + Math.random() * 5}px`,
                              height: `${4 + Math.random() * 5}px`,
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              animation: `float-particle ${
                                 3 + Math.random() * 5
                              }s infinite ease-in-out ${Math.random() * 5}s`,
                              boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)",
                           }}
                        />
                     ))}

                     {/* Glowing background */}
                     <div
                        className="absolute w-full h-full rounded-full"
                        style={{
                           background:
                              "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 50%)",
                           animation:
                              "pulse-bg 5s infinite alternate ease-in-out",
                           transform: "scale(1.5)",
                        }}
                     />
                  </div>

                  {/* Main logo image with animations */}
                  <img
                     ref={logoRef}
                     src={imgSrc}
                     alt={alt}
                     className="object-contain transition-all duration-300 relative z-10"
                     style={{
                        width: "100%",
                     }}
                  />
               </>
            ) : (
               // Other logos with grayscale/blur
               <img
                  src={imgSrc}
                  alt={alt}
                  className="object-contain transition-all duration-300"
                  style={{
                     width: "100%",
                     filter: isHovered ? "none" : "grayscale(100%) blur(5px)",
                  }}
               />
            )}
         </div>
      </div>
   );
};

const BlockchainLogos: React.FC = () => {
   const logos: LogoProps[] = [
      {
         name: "Ethereum",
         imgSrc: ethereumLogoSrc,
         alt: "Ethereum logo",
      },
      {
         name: "Solana",
         imgSrc: solanaLogoSrc,
         alt: "Solana logo",
      },
      {
         name: "Base",
         imgSrc: baseLogoSrc,
         alt: "Base logo",
         isBase: true,
      },
      {
         name: "Arbitrum",
         imgSrc: arbitrumLogoSrc,
         alt: "Arbitrum logo",
      },
      {
         name: "Polygon",
         imgSrc: polygonLogoSrc,
         alt: "Polygon logo",
      },
   ];

   return (
      <div className="w-full bg-transparent mt-16 py-16">
         <div className="flex flex-row justify-between gap-[8%] items-center w-full px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
            {logos.map((logo, index) => (
               <Logo
                  key={index}
                  name={logo.name}
                  isBase={logo.isBase}
                  imgSrc={logo.imgSrc}
                  alt={logo.alt}
               />
            ))}
         </div>
      </div>
   );
};

export default BlockchainLogos;
