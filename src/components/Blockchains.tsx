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

// Single logo component with hover effects and special Base animation
const Logo: React.FC<LogoProps> = ({ name, isBase = false, imgSrc, alt }) => {
   const [isHovered, setIsHovered] = useState(false);
   const logoRef = useRef<HTMLImageElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const animationRef = useRef<number | null>(null);

   useEffect(() => {
      if (!isBase || !logoRef.current || !containerRef.current) return;

      let startTime = Date.now();
      const duration = 6000; // 6 seconds for full animation cycle

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
            animationRef.current = null;
         }
      };
   }, [isBase]);

   const logoStyles = {
      width: "100%",
      filter: isBase || isHovered ? "none" : "grayscale(100%) blur(5px)",
      transition: "filter 0.3s ease-in-out, transform 0.2s ease-in-out",
      transform: isHovered && !isBase ? "scale(1.1)" : "none",
   };

   return (
      <div
         className="flex-shrink-0 mx-8 w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
         <div
            ref={containerRef}
            role="img"
            aria-label={name}
            className="relative flex items-center justify-center w-full h-full">
            {isBase ? (
               <>
                  {/* Base logo special effects */}
                  <div className="absolute w-full h-full opacity-30">
                     {/* Dynamic particle effect */}
                     {[...Array(6)].map((_, i) => {
                        const size = 4 + Math.random() * 5;
                        const top = Math.random() * 100;
                        const left = Math.random() * 100;
                        const duration = 3 + Math.random() * 5;
                        const delay = Math.random() * 5;

                        return (
                           <div
                              key={i}
                              className="absolute rounded-full bg-blue-500 opacity-80"
                              style={{
                                 width: `${size}px`,
                                 height: `${size}px`,
                                 top: `${top}%`,
                                 left: `${left}%`,
                                 animation: `float-particle ${duration}s infinite ease-in-out ${delay}s`,
                                 boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)",
                              }}
                           />
                        );
                     })}

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

                  {/* Main logo image */}
                  <img
                     ref={logoRef}
                     src={imgSrc}
                     alt={alt}
                     style={logoStyles}
                     className="object-contain relative z-10"
                  />
               </>
            ) : (
               // Standard logo with hover effects
               <img
                  src={imgSrc}
                  alt={alt}
                  style={logoStyles}
                  className="object-contain"
               />
            )}
         </div>
      </div>
   );
};

// Single continuous marquee with logos in fixed order
const BlockchainLogos: React.FC = () => {
   // Define our logos in the specific order you want
   const logos: LogoProps[] = [
      { name: "Ethereum", imgSrc: ethereumLogoSrc, alt: "Ethereum logo" },
      { name: "Solana", imgSrc: solanaLogoSrc, alt: "Solana logo" },
      { name: "Base", imgSrc: baseLogoSrc, alt: "Base logo", isBase: true },
      { name: "Arbitrum", imgSrc: arbitrumLogoSrc, alt: "Arbitrum logo" },
      { name: "Polygon", imgSrc: polygonLogoSrc, alt: "Polygon logo" },
   ];

   // Create a sequence that maintains fixed order and handles the loop point correctly
   const createFixedOrderSequence = () => {
      // Create multiple complete cycles of the logos in the specified order
      const sequence = [...logos, ...logos, ...logos, ...logos];

      // To handle the loop point (where the animation restarts),
      // we need to add the first 4 logos again at the end
      // This ensures when the animation loops, there's no duplicate within 5 positions
      return [...sequence, logos[0], logos[1], logos[2], logos[3]];
   };

   const sequence = createFixedOrderSequence();

   return (
      <div className="w-full bg-transparent mt-16 py-16 overflow-hidden">
         <div className="relative h-56">
            <div className="marquee-container w-full">
               <div className="marquee-track flex single-marquee">
                  {sequence.map((logo, index) => (
                     <Logo
                        key={`logo-${index}`}
                        name={logo.name}
                        isBase={logo.isBase}
                        imgSrc={logo.imgSrc}
                        alt={logo.alt}
                     />
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default BlockchainLogos;
