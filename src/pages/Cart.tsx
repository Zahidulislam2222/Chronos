import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/parseWPContent';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { state, removeFromCart, updateQuantity, totalPrice } = useCart();

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl mb-4">Shopping Bag</h1>
            <p className="text-muted-foreground">
              {state.items.length} {state.items.length === 1 ? 'item' : 'items'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          {state.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="font-display text-2xl mb-4">Your bag is empty</h2>
              <p className="text-muted-foreground mb-8">
                Discover our collection of exceptional timepieces
              </p>
              <Button variant="gold" size="lg" asChild>
                <Link to="/shop">
                  Continue Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Items */}
              <div className="lg:col-span-2 space-y-6">
                {state.items.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6 p-6 bg-card rounded-lg border border-border"
                  >
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="w-32 h-32 bg-secondary rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to={`/product/${item.product.slug}`}
                            className="font-display text-lg hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-muted-foreground text-sm mt-1">
                            {item.product.shortDescription}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-end justify-between mt-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="w-9 h-9 rounded border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="w-9 h-9 rounded border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-display text-xl text-primary">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h2 className="font-display text-xl mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-primary">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between">
                      <span className="font-display text-lg">Total</span>
                      <span className="font-display text-2xl text-primary">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button variant="gold" className="w-full" size="lg" asChild>
                    <Link to="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

                  <Button variant="minimal" className="w-full mt-4" asChild>
                    <Link to="/shop">Continue Shopping</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
