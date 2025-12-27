import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { mockProducts, mockCategories } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X } from 'lucide-react';

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    let products = [...mockProducts];

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return products;
  }, [selectedCategory, sortBy]);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-primary tracking-[0.3em] uppercase text-sm mb-4 block">
              Our Collection
            </span>
            <h1 className="font-display text-5xl md:text-6xl mb-6">
              Timepieces
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated selection of exceptional watches, each crafted with precision and passion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shop Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <p className="text-muted-foreground text-sm">
                {filteredProducts.length} products
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-muted-foreground">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-secondary border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div className="flex gap-12">
            {/* Sidebar */}
            <aside
              className={`${
                showFilters ? 'fixed inset-0 z-50 bg-card p-6' : 'hidden'
              } lg:block lg:static lg:bg-transparent lg:p-0 lg:w-64 flex-shrink-0`}
            >
              <div className="flex items-center justify-between lg:hidden mb-6">
                <h3 className="font-display text-xl">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-display text-lg mb-4">Categories</h4>
                  <div className="space-y-2">
                    {mockCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.slug);
                          setShowFilters(false);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category.slug
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        {category.name}
                        <span className="text-muted-foreground ml-2">({category.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No products found</p>
                  <Button
                    variant="luxuryOutline"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
