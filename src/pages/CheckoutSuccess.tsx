import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const CheckoutSuccess = () => {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear cart after successful Stripe payment.
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="font-display text-4xl mb-4">Order Confirmed</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase. You will receive an order confirmation email shortly.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground mb-6">
              Session: {sessionId.slice(0, 20)}...
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button variant="luxuryOutline" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
            <Button variant="gold" onClick={() => navigate('/account')}>
              View Orders
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSuccess;
