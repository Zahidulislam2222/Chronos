import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { loginUser, registerUser, updateUserName } from '@/utils/api'; 

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRobotChecked) {
      toast({
        title: 'Verification Required',
        description: 'Please confirm you are not a robot.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await loginUser(loginForm.email, loginForm.password);

      if (response?.authToken) {
        login(response.user, response.authToken);
        
        toast({
          title: 'Welcome Back',
          description: `Logged in as ${response.user.name || 'User'}`,
        });
        
        setLoginForm({ email: '', password: '' });
        setIsRobotChecked(false);
        closeLoginModal();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // <--- This is the single, corrected version of the function
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRobotChecked) {
      toast({
        title: 'Verification Required',
        description: 'Please confirm you are not a robot.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Step 1: Register the User (unauthenticated)
      const registerResponse = await registerUser(
        registerForm.name, 
        registerForm.email, 
        registerForm.password
      );

      if (!registerResponse) {
          throw new Error('Registration failed at API level.');
      }

      // Step 2: Log the new user in to get an Auth Token
      const loginResponse = await loginUser(registerForm.email, registerForm.password);

      if (loginResponse && loginResponse.user && loginResponse.authToken) {
        
        // Step 3: Manually save the token to storage BEFORE making the next call
        localStorage.setItem('auth-token', loginResponse.authToken);
        
        // Step 4: NOW that we are authenticated, update the user's name
        await updateUserName(loginResponse.user.id, registerForm.name);

        // Step 5: Update the global state with the final user data. This also saves user data to storage and closes the modal.
        login({ ...loginResponse.user, name: registerForm.name }, loginResponse.authToken);
        
        toast({
          title: 'Account Created & Logged In',
          description: `Welcome, ${registerForm.name}!`,
        });
        
        // Cleanup
        setRegisterForm({ name: '', email: '', password: '' });
        setIsRobotChecked(false);
        
      } else {
        throw new Error('Auto-login after registration failed.');
      }
      
    } catch (error) {
      console.error(error);
      toast({
        title: 'Registration Failed',
        description: 'This email might already be registered.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    toast({
      title: 'Coming Soon',
      description: 'Google authentication will be available soon.',
    });
  };

  const handleClose = () => {
    closeLoginModal();
    setActiveTab('login');
    setIsRobotChecked(false);
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '' });
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-5 w-5 text-foreground" />
                <span className="sr-only">Close</span>
              </button>

              <div className="p-8">
                <div className="mb-8 text-center">
                  <h2 className="font-display text-3xl mb-2">Welcome to Chronos</h2>
                  <p className="text-muted-foreground text-sm">
                    Sign in to your account or create a new one
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                    <TabsTrigger 
                      value="login"
                      className="data-[state=active]:bg-background data-[state=active]:text-primary"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register"
                      className="data-[state=active]:bg-background data-[state=active]:text-primary"
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          required
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="login-robot"
                          checked={isRobotChecked}
                          onCheckedChange={(checked) => setIsRobotChecked(checked === true)}
                        />
                        <label
                          htmlFor="login-robot"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          I am not a robot
                        </label>
                      </div>

                      <Button
                        type="submit"
                        variant="gold"
                        size="lg"
                        className="w-full"
                        disabled={!isRobotChecked || isSubmitting}
                      >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-0">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Your name"
                          required
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="your@email.com"
                          required
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="register-robot"
                          checked={isRobotChecked}
                          onCheckedChange={(checked) => setIsRobotChecked(checked === true)}
                        />
                        <label
                          htmlFor="register-robot"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          I am not a robot
                        </label>
                      </div>

                      <Button
                        type="submit"
                        variant="gold"
                        size="lg"
                        className="w-full"
                        disabled={!isRobotChecked || isSubmitting}
                      >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full mt-4"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
