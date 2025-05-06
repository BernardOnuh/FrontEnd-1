import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const stats = [
   { value: 2500000000, label: "Trading Volume", prefix: "$", suffix: "+" },
   { value: 100000, label: "Active Users", suffix: "+" },
   { value: 50, label: "Supported Tokens", suffix: "+" },
   { value: 0.1, label: "Average Fees", suffix: "%" },
];

const CountUpAnimation = ({ value, prefix = "", suffix = "" }) => {
   const [count, setCount] = useState(0);
   const ref = useRef(null);
   const isInView = useInView(ref, { once: true, margin: "-100px" });

   useEffect(() => {
      if (isInView) {
         const duration = 2000; // 2 seconds
         const steps = 60;
         const increment = value / steps;
         let current = 0;
         const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
               setCount(value);
               clearInterval(timer);
            } else {
               setCount(current);
            }
         }, duration / steps);
         return () => clearInterval(timer);
      }
   }, [isInView, value]);

   const formatNumber = (num) => {
      if (num >= 1000000000) {
         return (num / 1000000000).toFixed(1) + "B";
      }
      if (num >= 1000000) {
         return (num / 1000000).toFixed(1) + "M";
      }
      if (num >= 1000) {
         return (num / 1000).toFixed(1) + "K";
      }
      return num.toFixed(1);
   };

   return (
      <span ref={ref}>
         {isInView
            ? `${prefix}${formatNumber(count)}${suffix}`
            : `${prefix}0${suffix}`}
      </span>
   );
};

const StatsSection = () => {
   return (
      <section className="py-28 bg-gradient-to-r from-purple-500 to-indigo-600">
         <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
               {stats.map((stat, index) => (
                  <motion.div
                     key={index}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.5, delay: 0.1 * index }}
                     whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(245, 240, 255, 0.8)",
                        boxShadow: "0 4px 20px rgba(100, 80, 230, 0.1)",
                     }}
                     className="text-center p-6 rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300">
                     <div className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">
                        <CountUpAnimation
                           value={stat.value}
                           prefix={stat.prefix}
                           suffix={stat.suffix}
                        />
                     </div>
                     <div className="text-gray-600">{stat.label}</div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>
   );
};

export default StatsSection;
