import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '@/lib/mockData';
import { formatPrice } from '@/lib/parseWPContent';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-lg bg-secondary mb-4">
        <Link to={`/product/${product.slug}`}>
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </Link>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Link
            to={`/product/${product.slug}`}
            className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-primary transition-colors"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-primary transition-colors disabled:opacity-50"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.featured && (
            <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase rounded">
              Featured
            </span>
          )}
          {!product.inStock && (
            <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium tracking-wider uppercase rounded">
              Sold Out
            </span>
          )}
        </div>
      </div>

      <Link to={`/product/${product.slug}`} className="block space-y-2">
        <h3 className="font-display text-lg group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm">{product.shortDescription}</p>
        <p className="text-primary font-semibold">{formatPrice(product.price)}</p>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
