import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaTwitter, FaDownload, FaShare, FaCopy } from "react-icons/fa";

import { FiCheck } from "react-icons/fi";

import html2canvas from "html2canvas";
import Image from "./assets/abokiwhite.svg";

interface TwitterReceiptCardProps {
   order?: {
      _id?: string;
      id?: string;
      sourceAmount: number;
      sourceCurrency: string;
      targetAmount: number;
      targetCurrency: string;
      status: string;
      completedAt?: string;
      createdAt?: string;
      type: string;
      transactionHash?: string;
   };
   onClose?: () => void;
}

const TwitterReceiptCard: React.FC<TwitterReceiptCardProps> = ({
   order,
   onClose,
}) => {
   const cardRef = useRef<HTMLDivElement>(null);
   const [isGenerating, setIsGenerating] = useState(false);

   if (!order) return null;

   const formatCurrency = (amount: number, currency: string) => {
      if (currency === "NGN") {
         return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
         }).format(amount);
      } else if (currency === "USDC") {
         return `${amount.toFixed(4)} USDC`;
      } else if (currency === "ETH") {
         return `${amount.toFixed(6)} ETH`;
      }
      return `${amount.toLocaleString()} ${currency}`;
   };

   const formatDate = (dateString?: string) => {
      if (!dateString) return new Date().toLocaleDateString();
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   const getTransactionType = (type: string) => {
      switch (type) {
         case "onramp":
            return "Bought";
         case "offramp":
            return "Sold";
         case "swap":
            return "Swapped";
         default:
            return "Converted";
      }
   };

   const generateImage = async () => {
      if (!cardRef.current) return null;

      setIsGenerating(true);

      try {
         const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null,
            scale: 3,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: cardRef.current.scrollWidth,
            windowHeight: cardRef.current.scrollHeight,
         });

         return canvas.toDataURL("image/png");
      } catch (error) {
         console.error("Error generating image:", error);
         return null;
      } finally {
         setIsGenerating(false);
      }
   };

   const downloadImage = async () => {
      const imageData = await generateImage();
      if (imageData) {
         const link = document.createElement("a");
         link.download = `aboki-receipt-${order._id || order.id}.png`;
         link.href = imageData;
         link.click();
      }
   };

   const shareToTwitter = async () => {
      const imageData = await generateImage();
      if (imageData) {
         const response = await fetch(imageData);
         const blob = await response.blob();

         const tweetText = `🎉 Just ${getTransactionType(
            order.type
         ).toLowerCase()} ${formatCurrency(
            order.targetAmount,
            order.targetCurrency
         )} on @Abokixyz! 

        Change your Naira to Dollar or Crypto to Naira made easy on Base 🚀

        #Crypto #DeFi #Web3 #AbokiBeta #CryptoTrading #Base`;

         if (
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [new File([], "")] })
         ) {
            try {
               const file = new File([blob], "aboki-receipt.png", {
                  type: "image/png",
               });
               await navigator.share({
                  title: "Aboki Transaction Receipt",
                  text: tweetText,
                  files: [file],
               });
               return;
            } catch (err) {
               console.log("Web Share API failed, falling back to Twitter URL");
            }
         }

         const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            tweetText
         )}`;
         window.open(twitterUrl, "_blank");

         try {
            await navigator.clipboard.write([
               new ClipboardItem({
                  "image/png": blob,
               }),
            ]);
            alert("Receipt image copied to clipboard! Paste it in your tweet.");
         } catch (err) {
            console.error("Failed to copy image:", err);
            alert(
               "Tweet opened! Please download the image and attach it manually."
            );
         }
      }
   };

   const shareToWhatsApp = async () => {
      const imageData = await generateImage();
      if (imageData) {
         const response = await fetch(imageData);
         const blob = await response.blob();

         const message = `🎉 Just ${getTransactionType(
            order.type
         ).toLowerCase()} ${formatCurrency(
            order.targetAmount,
            order.targetCurrency
         )} on Aboki! 

Change your dollar to crypto or Crypto to Naira made easy on Base 🚀`;

         if (
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [new File([], "")] })
         ) {
            try {
               const file = new File([blob], "aboki-receipt.png", {
                  type: "image/png",
               });
               await navigator.share({
                  title: "Aboki Transaction Receipt",
                  text: message,
                  files: [file],
               });
               return;
            } catch (err) {
               console.log(
                  "Web Share API failed, falling back to WhatsApp URL"
               );
            }
         }

         const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
            message
         )}`;
         window.open(whatsappUrl, "_blank");

         try {
            await navigator.clipboard.write([
               new ClipboardItem({
                  "image/png": blob,
               }),
            ]);
            alert("Receipt image copied to clipboard! Paste it in WhatsApp.");
         } catch (err) {
            alert(
               "WhatsApp opened! Please download the image and share it manually."
            );
         }
      }
   };

   const copyTransactionId = async () => {
      const id = order._id || order.id || "";
      try {
         await navigator.clipboard.writeText(id);
         alert("Transaction ID copied to clipboard!");
      } catch (err) {
         console.error("Failed to copy ID:", err);
      }
   };

   interface DetailLineProps {
      label: string;
      value: string;
   }

   function DetailLine({ label, value }: DetailLineProps) {
      return (
         <div className="flex justify-between text-sm sm:text-sm mb-2 border-b pb-2 border-white/50">
            <span className="opacity-90">{label}</span>
            <span className="font-medium">{value}</span>
         </div>
      );
   }

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
         <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-screen overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100">
               <div className="flex items-center justify-between s">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                     Share Your Success!
                  </h2>
                  <button
                     onClick={onClose}
                     className="text-gray-500 hover:text-gray-700 transition-colors">
                     <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M6 18L18 6M6 6l12 12"
                        />
                     </svg>
                  </button>
               </div>
               <p className="text-gray-600 mt-2 text-sm sm:text-base text-center">
                  Share your successful transaction with the world!
               </p>
            </div>
            <div className="p-4 sm:p-6">
               <div
                  ref={cardRef}
                  className="bg-gradient-to-bl from-purple-700 via-purple-600 to-fuchsia-400 rounded-2xl p-6 text-white shadow-xl shadow-purple-800/30 max-w-lg mx-auto aspect-square  relative overflow-clip backdrop-filter backdrop-blur-xlr ">
                  {/*    className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl text-white relative overflow-hidden w-full aspect-square max-w-lg mx-auto"> */}

                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                     <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white to-transparent"></div>
                     <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-10"></div>
                     <div className="absolute bottom-4 left-4 w-12 h-12 bg-white rounded-full opacity-10"></div>
                     <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full opacity-10"></div>
                  </div>
                  <div className="mx-auto flex items-center justify-center my-6">
                     <img src={Image} alt="logo" className="w-24 my-2" />
                  </div>
                  <div className="text-center">
                     <div className="flex items-center justify-center mb-4">
                        <div className="p-6 rounded-full flex items-center justify-center backdrop-filter backdrop-blur-lg bg-white/20">
                           <div className="p-2 bg-white/30 rounded-full flex items-center justify-center">
                              <FiCheck size={48} className="text-white" />
                           </div>
                        </div>
                     </div>
                     <h1 className="text- font-bold mb-2">
                        Transaction Successful!
                     </h1>

                     <div className="text-4xl font-bold my-8">
                        {formatCurrency(
                           order.targetAmount,
                           order.targetCurrency
                        )}
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 px-2">
                     <DetailLine label="Type" value={order.type} />
                     <DetailLine
                        label="Bought From"
                        value={formatCurrency(
                           order.sourceAmount,
                           order.sourceCurrency
                        )}
                     />
                     {order.completedAt && (
                        <DetailLine
                           label="Date"
                           value={new Date(order.completedAt).toLocaleString()}
                        />
                     )}
                     <DetailLine label="Status" value={order.status} />
                  </div>

                  <div>
                     <p className="text-sm sm:text-xs opacity-90 text-center mt-4">
                        The Aboki Experience
                     </p>
                  </div>
               </div>
            </div>
            {/* Action Buttons */}
            <div className="p-4 sm:p-6 border-t border-gray-100">
               <div className="flex flex-col space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <button
                        onClick={shareToTwitter}
                        disabled={isGenerating}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base">
                        {isGenerating ? (
                           <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Generating...</span>
                           </>
                        ) : (
                           <>
                              <FaTwitter className="text-lg" />
                              <span>Share on Twitter</span>
                           </>
                        )}
                     </button>
                     <button
                        onClick={downloadImage}
                        disabled={isGenerating}
                        className="bg-slate-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base">
                        <FaDownload />
                        <span>Download</span>
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={copyTransactionId}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base">
                        <FaCopy />
                        <span>Copy ID</span>
                     </button>
                     <button
                        onClick={shareToWhatsApp}
                        disabled={isGenerating}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base">
                        <FaShare className="text-lg" />
                        <span>Share on WhatsApp</span>
                     </button>
                  </div>

                  <button
                     onClick={onClose}
                     className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-2xl transition-colors text-sm sm:text-base">
                     Close
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
};

export default TwitterReceiptCard;
