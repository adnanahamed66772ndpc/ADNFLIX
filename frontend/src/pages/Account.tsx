import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Crown, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscriptionPlans } from '@/data/subscriptionData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const Account = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentPlan = subscriptionPlans.find(p => p.id === user.subscriptionPlan) || subscriptionPlans[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-8 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="subscription"><Crown className="w-4 h-4 mr-2" />Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="max-w-md bg-card rounded-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName || ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user.displayName || 'User'}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Current Plan</span>
                  <span className="capitalize font-semibold">{currentPlan.name}</span>
                </div>
              </div>
              <Button variant="destructive" className="mt-6" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="max-w-2xl">
              {/* Current Plan */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Current Plan</h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${currentPlan.color} text-white`}>
                        <Crown className="w-4 h-4" />
                        <span className="font-semibold">{currentPlan.name}</span>
                      </div>
                      <p className="text-muted-foreground mt-2">
                        {currentPlan.price === 0 ? 'Free forever' : `৳${currentPlan.price}/month`}
                      </p>
                    </div>
                    <Button onClick={() => navigate('/subscription')}>
                      {user.subscriptionPlan === 'premium' ? 'Manage Plan' : 'Upgrade'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Comparison */}
              <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
              <div className="grid gap-4">
                {subscriptionPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${user.subscriptionPlan === plan.id ? 'border-primary' : ''}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{plan.name}</h4>
                            {plan.popular && (
                              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                                POPULAR
                              </span>
                            )}
                            {user.subscriptionPlan === plan.id && (
                              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plan.price === 0 ? 'Free' : `৳${plan.price}/month`}
                            {plan.hasAds && ' • Contains ads'}
                          </p>
                        </div>
                        {user.subscriptionPlan !== plan.id && plan.id !== 'free' && (
                          <Button size="sm" onClick={() => navigate('/subscription')}>
                            Select
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button size="lg" onClick={() => navigate('/subscription')}>
                  View All Plans & Payment Options
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
