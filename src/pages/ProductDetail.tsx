import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { mockProducts } from '@/lib/mockData';
import { formatPrice } from '@/lib/parseWPContent';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart, Share2, ChevronRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);

  const product = mockProducts.find((p) => p.slug === slug);

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl mb-4">Product Not Found</h1>
            <Button variant="luxuryOutline" asChild>
              <Link to="/shop">Return to Shop</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: 'Added to Bag',
      description: `${product.name} has been added to your shopping bag.`,
    });
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-card py-4">
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
                <img
                  src={product.gallery[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.gallery.length > 1 && (
                <div className="flex gap-4">
                  {product.gallery.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <span className="text-primary tracking-widest uppercase text-sm">
                  {product.category}
                </span>
                <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">
                  {product.name}
                </h1>
                <p className="text-3xl font-display text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Specifications */}
              <div className="border border-border rounded-lg p-6 space-y-4">
                <h3 className="font-display text-lg">Specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {product.inStock ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>In Stock - Ready to Ship</span>
                    </>
                  ) : (
                    <span>Currently Unavailable</span>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="gold"
                    size="xl"
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Add to Bag
                  </Button>
                  <Button variant="outline" size="xl">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="xl">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                {[
                  { text: 'Free Shipping', sub: 'Worldwide' },
                  { text: '5-Year Warranty', sub: 'Full Coverage' },
                  { text: 'Secure Payment', sub: 'SSL Encrypted' },
                ].map((badge) => (
                  <div key={badge.text} className="text-center">
                    <p className="text-sm font-medium">{badge.text}</p>
                    <p className="text-xs text-muted-foreground">{badge.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
