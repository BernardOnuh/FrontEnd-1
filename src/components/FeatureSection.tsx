import { motion, useInView } from "framer-motion";
import { Shield, Zap, RefreshCw, Users } from "lucide-react";
import { useRef } from "react";

const features = [
   {
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      title: "Built on Base",
      description:
         "Every transaction is secured with military-grade encryption and verified on Base blockchain.",
   },
   {
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      title: "Lightning Fast",
      description:
         "Experience near-instant deposits and withdrawals with our optimized network connections.",
   },
   {
      icon: <RefreshCw className="h-8 w-8 text-pink-500" />,
      title: "Low Fees",
      description:
         "Enjoy some of the lowest fees in the industry with transparent pricing on every transaction.",
   },
   {
      icon: <Users className="h-8 w-8 text-indigo-500" />,
      title: "Trade Directly",
      description:
         "Sell to the blockchain and buy from the blockchain. its a direct online marketplace without middlemen.",
   },
];

const FeatureSection = () => {
   const ref = useRef(null);
   const isInView = useInView(ref, { once: true });

   return (
      <section ref={ref} id="features" className="relative py-20  min-h-screen">
         <div className="absolute inset-0 overflow-hidden">
            <motion.div
               initial={{ opacity: 0, scale: 0.2 }}
               animate={isInView ? { opacity: 0.5, scale: 1 } : {}}
               transition={{ duration: 1.5 }}
               className="absolute right-0 top-1/4 w-96 h-96 bg-purple-600/50 rounded-full blur-[100px]"
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.5 }}
               animate={isInView ? { opacity: 0.5, scale: 1 } : {}}
               transition={{ duration: 1.5, delay: 0.2 }}
               className="absolute left-0 bottom-1/4 w-80 h-80 bg-blue-800/50 rounded-full blur-[100px]"
            />
         </div>

         <div className="relative container mx-auto px-6 md:px-12 mt-4">
            <div className="text-center mb-16">
               <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-4 text-[#000]">
                  Why Choose{" "}
                  <span
                     className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 mx-2
                  ">
                     ABOKI
                  </span>
               </motion.h2>
               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-gray-700 max-w-3xl mx-auto text-lg">
                  Our platform provides a seamless, secure, and efficient way to
                  exchange digital assets.
               </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
               {features.map((feature, index) => (
                  <motion.div
                     key={index}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.5, delay: 0.1 * index }}
                     whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(217, 230, 255, 0.6)",
                        boxShadow: "0 4px 18px rgba(100, 80, 230, 0.1)",
                     }}
                     className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 transition-all duration-300">
                     <motion.div
                        className="rounded-lg mb-4 p-2 inline-block bg-transparent"
                        whileHover={{
                           scale: 1.1,
                           rotate: 360,
                        }}>
                        {feature.icon}
                     </motion.div>
                     <h3 className="text-xl font-semibold mb-3 text-gray-800">
                        {feature.title}
                     </h3>
                     <p className="text-gray-600">{feature.description}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>
   );
};

export default FeatureSection;
