'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

/* --------------------------------------------------------
   SIMPLE CARD (Student + Institution)
--------------------------------------------------------- */

export function PricingCardSimple({
  name,
  price,
  period,
  description,
  features,
  popular,
  cta,
}: any) {
  return (
    <div
      className="p-6 rounded-xl backdrop-blur-xl transition-all flex flex-col h-full w-full"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: popular
          ? '1px solid #3B1CFF'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: popular ? '0 4px 30px rgba(59,28,255,0.2)' : 'none',
      }}
    >
      {popular && (
        <div className="text-xs mb-2 px-2 py-1 bg-purple-900 text-white rounded-md w-fit">
          Most Popular
        </div>
      )}

      <h3 className="text-xl font-bold text-white">{name}</h3>

      <div className="text-3xl font-extrabold text-white my-2">
        {price}
        {period && <span className="text-sm text-gray-400 ml-1">{period}</span>}
      </div>

      <p className="text-sm text-gray-400 mb-4">{description}</p>

      <ul className="space-y-2 mb-6 flex-grow">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white">{feature}</span>
          </li>
        ))}
      </ul>

      <Button className="w-full mt-auto">{cta}</Button>
    </div>
  );
}

/* --------------------------------------------------------
   ADVANCED CARD (Organizer)
--------------------------------------------------------- */

interface PricingFeature {
  title: string;
  items: string[];
}

interface AdvancedProps {
  title: string;
  description: string;
  price: number;
  features: PricingFeature[];
  buttonText?: string;
}

export function PricingCardAdvanced({
  title,
  description,
  price,
  features,
  buttonText = 'Get Started',
}: AdvancedProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView) setHasAnimated(true);
  }, [isInView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 180, damping: 18 },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full mt-2"
      initial="hidden"
      animate={hasAnimated ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {/* MATCH WIDTH WITH SIMPLE CARDS */}
      <Card className="w-full rounded-xl bg-transparent border-none shadow-none overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* LEFT SIDE — MAIN BLACK */}
          <motion.div
            className="flex flex-col justify-between p-6 lg:w-2/5 lg:p-10"
            style={{ backgroundColor: '#0a0a1f', color: '#FFFFFF' }}
            variants={itemVariants}
          >
            <CardHeader className="p-0">
              <CardTitle className="text-3xl font-bold text-white">
                {title}
              </CardTitle>
              <CardDescription className="mt-2 text-gray-400">
                {description}
              </CardDescription>
            </CardHeader>

            <div className="mt-6">
              <span className="text-5xl font-extrabold text-white">
                ${price}
              </span>
            </div>

            <Button
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              size="lg"
            >
              {buttonText}
            </Button>
          </motion.div>

          {/* RIGHT SIDE — SLIGHTLY LIGHTER BLACK */}
          <motion.div
            className="p-6 lg:w-3/5 lg:p-10"
            style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF' }}
            variants={itemVariants}
          >
            <div className="space-y-6">
              {features.map((feature, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="text-blue-400 w-4 h-4" />
                        <span className="text-sm text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {idx < features.length - 1 && (
                    <Separator className="my-6 bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
