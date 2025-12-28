import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/lib/mockData';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/button';
import { fetchProducts } from '@/utils/api'; // Use the REAL API

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products when the component loads
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const allProducts = await fetchProducts();
        // Filter for featured products and take the first 4
        const featured = allProducts.filter((p) => p.featured).slice(0, 4);
        setProducts(featured);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      }
    };
    loadFeaturedProducts();
  }, []);

  // If there are no featured products, don't render the section
  if (products.length === 0) {
    return null; 
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary tracking-[0.3em] uppercase text-sm mb-4 block">
            Featured Collection
          </span>
          <h2 className="font-display text-4xl md:text-5xl mb-6">
            Exceptional Timepieces
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each piece in our collection represents the pinnacle of Swiss watchmaking,
            combining centuries of tradition with innovative engineering.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="luxuryOutline" size="lg" asChild>
            <Link to="/shop">
              View All Timepieces
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;