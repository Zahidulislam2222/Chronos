import { motion } from 'framer-motion';
import { Award, Shield, Clock, Gem } from 'lucide-react';

const features = [
  {
    icon: Award,
    title: 'Swiss Excellence',
    description: 'Each timepiece crafted with centuries of Swiss watchmaking tradition.',
  },
  {
    icon: Shield,
    title: '5-Year Warranty',
    description: 'Complete coverage for your peace of mind, backed by our artisans.',
  },
  {
    icon: Clock,
    title: 'Precision Movement',
    description: 'COSC-certified movements ensuring accuracy within seconds per day.',
  },
  {
    icon: Gem,
    title: 'Premium Materials',
    description: '18K gold, platinum, and the finest sapphire crystals.',
  },
];

const ValueProposition = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-lg mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
