import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Package, ShoppingBag, User as UserIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { fetchCustomerOrders } from '@/utils/api'; // <--- IMPORT REAL API

const Account = () => {
  const { user, logout } = useAuth();
  const { state: cartState, totalPrice } = useCart();
  const navigate = useNavigate();

  // New State for Real Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // --- REAL DATA FETCHING ---
    const loadOrders = async () => {
      try {
        const realOrders = await fetchCustomerOrders();
        setOrders(realOrders || []);
      } catch (error) {
        console.error("Failed to load orders", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl mb-8">My Account</h1>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-lg">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </CardContent>
                </Card>
              </aside>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Order History */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="w-6 h-6 text-primary" />
                    <h2 className="font-display text-2xl">Order History</h2>
                  </div>

                  <div className="space-y-4">
                    {loading ? (
                       <p className="text-muted-foreground pl-1">Loading your purchase history...</p>
                    ) : orders.length > 0 ? (
                      orders.map((order: any) => (
                        <Card key={order.orderNumber} className="bg-card border-border">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(order.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">
                                  {order.total}
                                </p>
                                <span
                                  className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                                    order.status === 'COMPLETED'
                                      ? 'bg-green-900/20 text-green-400 border border-green-800'
                                      : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          {/* Note: WooCommerce GraphQL doesn't always send lineItems in the basic query unless requested. 
                              For now, we show the order summary. */}
                        </Card>
                      ))
                    ) : (
                      <Card className="bg-card border-border border-dashed">
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">No orders found.</p>
                            <p className="text-xs text-muted-foreground mt-2">Purchase a timepiece to see it here.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </section>

                <Separator className="bg-border" />

                {/* My Cart (Unchanged) */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h2 className="font-display text-2xl">My Cart</h2>
                  </div>

                  {cartState.items.length > 0 ? (
                    <Card className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {cartState.items.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0"
                            >
                              <div className="flex items-center gap-4">
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <div>
                                  <h4 className="font-medium">{item.product.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold">
                                ${(item.product.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4 bg-border" />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total</span>
                          <span className="text-xl font-display text-primary">
                            ${totalPrice.toLocaleString()}
                          </span>
                        </div>
                        <Button
                          variant="gold"
                          size="lg"
                          className="w-full mt-6"
                          onClick={() => navigate('/checkout')}
                        >
                          Proceed to Checkout
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="p-12 text-center">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Your cart is empty</p>
                        <Button variant="outline" onClick={() => navigate('/shop')}>
                          Browse Collection
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;