import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Award, Users, Globe, Gem } from 'lucide-react';

const stats = [
  { number: '1875', label: 'Year Founded' },
  { number: '150+', label: 'Years of Excellence' },
  { number: '50+', label: 'Countries' },
  { number: '100K+', label: 'Timepieces Crafted' },
];

const values = [
  {
    icon: Award,
    title: 'Excellence',
    description: 'We pursue perfection in every detail, from the smallest component to the final polish.',
  },
  {
    icon: Users,
    title: 'Heritage',
    description: 'Our craft has been passed down through generations, preserving timeless techniques.',
  },
  {
    icon: Globe,
    title: 'Innovation',
    description: 'While honoring tradition, we continuously push the boundaries of horology.',
  },
  {
    icon: Gem,
    title: 'Integrity',
    description: 'Every timepiece is a promise of quality, authenticity, and lasting value.',
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-primary tracking-[0.3em] uppercase text-sm mb-4 block">
              Our Story
            </span>
            <h1 className="font-display text-5xl md:text-6xl mb-6">
              A Legacy of Excellence
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              For over a century, Chronos has been at the forefront of Swiss watchmaking, 
              creating timepieces that transcend mere functionality to become cherished heirlooms.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="font-display text-4xl md:text-5xl text-primary mb-2">
                  {stat.number}
                </p>
                <p className="text-muted-foreground text-sm uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl mb-6">
                Crafting Time Since 1875
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  In the heart of the Swiss Jura mountains, our founder Henri Chronos 
                  established his first atelier with a singular vision: to create timepieces 
                  of uncompromising quality that would stand the test of time.
                </p>
                <p>
                  Today, five generations later, that vision endures. Our master watchmakers 
                  continue to handcraft each movement, combining centuries-old techniques with 
                  cutting-edge innovation to produce watches that are both works of art and 
                  instruments of precision.
                </p>
                <p>
                  Every Chronos timepiece represents not just hours of painstaking labor, 
                  but a legacy of excellence that spans over 150 years.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-secondary rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=800"
                  alt="Watchmaker at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-primary/10 rounded-lg -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary tracking-[0.3em] uppercase text-sm mb-4 block">
              Our Values
            </span>
            <h2 className="font-display text-4xl">What Guides Us</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-background p-8 rounded-lg border border-border"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
