import React, { useEffect, useState } from "react";

interface LogoProps {
   name: string;
   isBase?: boolean;
   imgSrc: string;
   alt: string;
}

const Logo: React.FC<LogoProps> = ({ isBase = false, imgSrc, alt }) => {
   const [isHovered, setIsHovered] = useState(false);
   const [isPulsing, setIsPulsing] = useState(false);

   useEffect(() => {
      if (isBase) {
         const pulseInterval = setInterval(() => {
            setIsPulsing((prev) => !prev);
         }, 2000);

         return () => clearInterval(pulseInterval);
      }
   }, [isBase]);

   return (
      <div
         className="flex items-center justify-center"
         style={{ width: "calc(20% - 2%)" }}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
         <div
            className={`flex items-center justify-center ${
               isBase && isPulsing ? "animate-pulse" : ""
            }`}>
            <img
               src={imgSrc}
               alt={alt}
               className="object-contain transition-all duration-300"
               style={{
                  width: "100%",
                  filter: isBase
                     ? isPulsing
                        ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.7))"
                        : "none"
                     : isHovered
                     ? "none"
                     : "grayscale(100%) blur(1px)",
                  transform: isBase && isPulsing ? "scale(1.05)" : "scale(1)",
               }}
            />
         </div>
      </div>
   );
};

const BlockchainLogos: React.FC = () => {
   const logos: LogoProps[] = [
      {
         name: "Ethereum",
         imgSrc: "src/assets/ethereum-logo.png", // Replace with your image path
         alt: "Ethereum logo",
      },
      {
         name: "Solana",
         imgSrc: "/solana-logo.svg", // Replace with your image path
         alt: "Solana logo",
      },
      {
         name: "Base",
         imgSrc: "/base-logo.svg", // Replace with your image path
         alt: "Base logo",
         isBase: true,
      },
      {
         name: "Arbitrum",
         imgSrc: "/arbitrum-logo.svg", // Replace with your image path
         alt: "Arbitrum logo",
      },
      {
         name: "Polygon",
         imgSrc: "/polygon-logo.svg", // Replace with your image path
         alt: "Polygon logo",
      },
   ];

   return (
      <div className="w-full bg-white py-8">
         <div className="flex flex-row justify-between items-center w-full px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
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
