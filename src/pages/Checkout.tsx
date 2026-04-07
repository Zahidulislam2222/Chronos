import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Removed Link as it wasn't used
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/parseWPContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Circle, Lock } from 'lucide-react';
import { processCheckout } from '@/utils/api';
import CartItemRow from '@/components/CartDrawer'; // Assuming you might have a summary component, or using raw HTML below

const Checkout = () => {
  const { state, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod');
  const stripeComingSoon = true; // Will be replaced with real Stripe in Phase 4

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // --- SIMULATED STRIPE LOGIC ---
    // Even if 'stripe' is selected, we effectively process it as a standardized order
    // to the backend so the order is created successfully in WooCommerce.
    try {
      if (!state.items || state.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // We pass the formData and items. The api.ts handles the heavy lifting.
      const result = await processCheckout(formData, state.items);
      
      if (result?.order) {
        toast({
          title: 'Order Placed Successfully',
          description: `Order #${result.order.orderNumber} confirmed. Check your email.`,
        });
        clearCart();
        setTimeout(() => navigate('/shop'), 2000);
      } else {
        throw new Error('Order creation failed');
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast({
        variant: "destructive",
        title: 'Checkout Failed',
        description: 'Please check your connection and try again.',
      });
      setIsProcessing(false); 
    }
  };

  // Empty Cart Check
  if (!state || state.items.length === 0) {
    return (
      <Layout>
         <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h1 className="font-display text-4xl mb-4">Your Cart is Empty</h1>
              <Button variant="luxuryOutline" onClick={() => navigate('/shop')}>
                Return to Shop
              </Button>
            </div>
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="font-display text-3xl">Checkout</h1>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Left Column: Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact */}
                <div>
                  <h2 className="font-display text-2xl mb-6">Contact</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        className="bg-card border-border"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h2 className="font-display text-2xl mb-6">Shipping Address</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        required
                        className="bg-card border-border"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        required
                        className="bg-card border-border"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        required
                        className="bg-card border-border"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        required
                        className="bg-card border-border"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        placeholder="10001"
                        required
                        className="bg-card border-border"
                        value={formData.zip}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="United States"
                        required
                        className="bg-card border-border"
                        value={formData.country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <h2 className="font-display text-2xl mb-6">Payment Method</h2>
                  <div className="space-y-4">
                    
                    {/* Option 1: Cash on Delivery */}
                    <div 
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 rounded-md flex items-start gap-4 cursor-pointer transition-all border ${
                        paymentMethod === 'cod' 
                          ? 'bg-card border-primary ring-1 ring-primary' 
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="mt-1">
                        {paymentMethod === 'cod' ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Cash on Delivery / Bank Transfer</p>
                        <p className="text-xs text-muted-foreground mt-1">Pay securely when your order arrives.</p>
                      </div>
                    </div>

                    {/* Option 2: Credit Card (Stripe — coming in Phase 4) */}
                    <div
                      className="p-4 rounded-md transition-all border border-border bg-card opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Credit Card</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Secure Stripe integration coming soon</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <Button
                  variant="gold"
                  size="xl"
                  className="w-full"
                  type="submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing Order...' : <>Place Order • {formatPrice(totalPrice)}</>}
                </Button>
              </form>
            </motion.div>

            {/* Right Column: Order Summary (Design Unchanged) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-8 h-fit sticky top-24 rounded-sm border border-border"
            >
              <h3 className="font-display text-xl mb-6">Order Summary</h3>
              <div className="space-y-6">
                {state.items.map((item) => (
                   <div key={item.product.id} className="flex gap-4">
                     <div className="w-16 h-16 bg-background rounded-sm overflow-hidden flex-shrink-0">
                       <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                       <p className="font-medium text-sm">{item.product.name}</p>
                       <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                     </div>
                     <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                   </div>
                ))}

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-display pt-2 border-t border-border mt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;