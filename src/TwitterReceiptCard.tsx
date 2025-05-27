import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTwitter, FaCheckCircle, FaDownload, FaShare, FaCopy } from 'react-icons/fa';
import html2canvas from 'html2canvas';

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

const TwitterReceiptCard: React.FC<TwitterReceiptCardProps> = ({ order, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!order) return null;

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    } else if (currency === 'USDC') {
      return `${amount.toFixed(6)} USDC`;
    } else if (currency === 'ETH') {
      return `${amount.toFixed(6)} ETH`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionType = (type: string) => {
    switch (type) {
      case 'onramp':
        return 'Bought';
      case 'offramp':
        return 'Sold';
      case 'swap':
        return 'Swapped';
      default:
        return 'Converted';
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
        windowHeight: cardRef.current.scrollHeight
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    const imageData = await generateImage();
    if (imageData) {
      const link = document.createElement('a');
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
      
      const tweetText = `🎉 Just ${getTransactionType(order.type).toLowerCase()} ${formatCurrency(order.targetAmount, order.targetCurrency)} on @Abokixyz! 

        Change your Naira to Dollar or Crypto to Naira made easy on Base 🚀

        #Crypto #DeFi #Web3 #AbokiBeta #CryptoTrading #Base`;
      
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([], '')] })) {
        try {
          const file = new File([blob], 'aboki-receipt.png', { type: 'image/png' });
          await navigator.share({
            title: 'Aboki Transaction Receipt',
            text: tweetText,
            files: [file]
          });
          return;
        } catch (err) {
          console.log('Web Share API failed, falling back to Twitter URL');
        }
      }
      
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, '_blank');
      
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        alert('Receipt image copied to clipboard! Paste it in your tweet.');
      } catch (err) {
        console.error('Failed to copy image:', err);
        alert('Tweet opened! Please download the image and attach it manually.');
      }
    }
  };

  const shareToWhatsApp = async () => {
    const imageData = await generateImage();
    if (imageData) {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const message = `🎉 Just ${getTransactionType(order.type).toLowerCase()} ${formatCurrency(order.targetAmount, order.targetCurrency)} on Aboki! 

Change your dollar to crypto or Crypto to Naira made easy on Base 🚀`;
      
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([], '')] })) {
        try {
          const file = new File([blob], 'aboki-receipt.png', { type: 'image/png' });
          await navigator.share({
            title: 'Aboki Transaction Receipt',
            text: message,
            files: [file]
          });
          return;
        } catch (err) {
          console.log('Web Share API failed, falling back to WhatsApp URL');
        }
      }
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        alert('Receipt image copied to clipboard! Paste it in WhatsApp.');
      } catch (err) {
        alert('WhatsApp opened! Please download the image and share it manually.');
      }
    }
  };

  const copyTransactionId = async () => {
    const id = order._id || order.id || '';
    try {
      await navigator.clipboard.writeText(id);
      alert('Transaction ID copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-screen overflow-y-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Share Your Success!</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Share your successful transaction with the world!</p>
        </div>

        {/* Receipt Card - Mobile Optimized */}
        <div className="p-4 sm:p-6">
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl text-white relative overflow-hidden w-full aspect-square max-w-lg mx-auto"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent"></div>
              <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full opacity-20"></div>
              <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white rounded-full opacity-10"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8">
              {/* Header Section */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                    <FaCheckCircle className="text-green-500 text-2xl sm:text-3xl" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Transaction Successful!</h1>
                <p className="text-sm sm:text-base opacity-90">Change your dollar to crypto or</p>
                <p className="text-sm sm:text-base opacity-90">Crypto to Naira made easy on Base</p>
              </div>

              {/* Transaction Amount */}
              <div className="text-center my-6">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                  <div className="text-3xl sm:text-4xl font-bold mb-2">
                    {formatCurrency(order.targetAmount, order.targetCurrency)}
                  </div>
                  <div className="text-sm sm:text-base opacity-90 mb-3">
                    {getTransactionType(order.type)} from {formatCurrency(order.sourceAmount, order.sourceCurrency)}
                  </div>
                  <div className="text-xs sm:text-sm opacity-80">
                    {formatDate(order.completedAt || order.createdAt)} • {order.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Branding Section */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 mb-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">🚀 Aboki</h3>
                  <p className="text-white text-sm sm:text-base font-semibold">
                    Seamless Crypto Experience
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm opacity-90">#AbokiBeta #CryptoMadeEasy</p>
                  <p className="text-xs opacity-75">Powered by Base Network</p>
                  {order.transactionHash && (
                    <p className="text-xs opacity-75">
                      Tx: {order.transactionHash.substring(0, 6)}...{order.transactionHash.substring(order.transactionHash.length - 4)}
                    </p>
                  )}
                </div>
              </div>
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
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
              >
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
                onClick={shareToWhatsApp}
                disabled={isGenerating}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <FaShare className="text-lg" />
                <span>Share on WhatsApp</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadImage}
                disabled={isGenerating}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <FaDownload />
                <span>Download</span>
              </button>

              <button
                onClick={copyTransactionId}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaCopy />
                <span>Copy ID</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TwitterReceiptCard;