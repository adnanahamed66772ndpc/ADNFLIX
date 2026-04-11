import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Crown, Tv, Copy, CheckCircle, Clock, 
  ArrowRight, ArrowLeft, Smartphone, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { subscriptionPlans, paymentMethods as defaultPaymentMethods, SubscriptionPlan, PaymentMethod } from '@/data/subscriptionData';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/api/client';

type Step = 'plans' | 'payment' | 'confirm' | 'success';

const Subscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();
  const { createTransaction } = useTransactions();
  
  const [step, setStep] = useState<Step>('plans');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);

  useEffect(() => {
    apiClient.get<Array<{ id: string; name: string; number: string }>>('/config/payment-methods')
      .then((fromApi) => {
        if (fromApi?.length) {
          setPaymentMethods(
            defaultPaymentMethods.map((d) => {
              const api = fromApi.find((a) => a.id === d.id);
              return api ? { ...d, name: api.name, number: api.number || d.number } : d;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      toast({ title: 'Free Plan', description: 'You are on the Free plan. No payment needed.' });
      navigate('/');
      return;
    }
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleSelectPayment = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setStep('confirm');
  };

  const handleCopyNumber = () => {
    if (selectedPayment) {
      navigator.clipboard.writeText(selectedPayment.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied!', description: 'Payment number copied to clipboard.' });
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim() || !senderNumber.trim()) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please enter both your phone number and transaction ID.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPlan || !selectedPayment) {
      toast({ 
        title: 'Error', 
        description: 'Please select a plan and payment method.',
        variant: 'destructive'
      });
      return;
    }

    // Validate phone number format (Bangladesh)
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(senderNumber.replace(/\s/g, ''))) {
      toast({ 
        title: 'Invalid Phone Number', 
        description: 'Please enter a valid Bangladeshi phone number (01XXXXXXXXX).',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create transaction in database
      const result = await createTransaction(
        selectedPlan.id,
        selectedPayment.name,
        transactionId.trim(),
        selectedPlan.price,
        senderNumber.trim()
      );
      
      if (result) {
        const newOrderId = `ORD-${Date.now()}`;
        setOrderId(newOrderId);
        setStep('success');
        toast({ 
          title: 'Payment Submitted!', 
          description: `Your payment is pending verification. We will activate your subscription within 24 hours.`
        });
      } else {
        toast({ 
          title: 'Submission Failed', 
          description: 'Failed to submit payment. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast({ 
        title: 'Error', 
        description: 'An error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'payment') setStep('plans');
    else if (step === 'confirm') setStep('payment');
  };

  // Get current user subscription for comparison
  const currentPlanId = user?.subscriptionPlan || 'free';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to Subscribe</h1>
            <p className="text-muted-foreground mb-6">Create an account to access premium content</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {['plans', 'payment', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step === s || (s === 'plans' && step !== 'plans') || (s === 'payment' && step === 'confirm')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-16 h-1 mx-2 rounded ${
                    (s === 'plans' && step !== 'plans') || (s === 'payment' && step === 'confirm')
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Plan */}
            {step === 'plans' && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-display mb-4">Choose Your Plan</h1>
                  <p className="text-muted-foreground text-lg">
                    Select the plan that works best for you
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {subscriptionPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`relative overflow-hidden h-full ${
                        plan.popular ? 'ring-2 ring-primary' : ''
                      } ${currentPlanId === plan.id ? 'border-primary' : ''}`}>
                        {plan.popular && (
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                            POPULAR
                          </div>
                        )}
                        {currentPlanId === plan.id && (
                          <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                            CURRENT
                          </div>
                        )}
                        
                        <CardHeader className={`bg-gradient-to-r ${plan.color} text-white`}>
                          <div className="flex items-center gap-2">
                            {plan.id === 'premium' ? (
                              <Crown className="w-6 h-6" />
                            ) : plan.id === 'with-ads' ? (
                              <Tv className="w-6 h-6" />
                            ) : null}
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                          </div>
                          <div className="mt-4">
                            <span className="text-4xl font-bold">৳{plan.price}</span>
                            {plan.price > 0 && <span className="text-white/80">/month</span>}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6">
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {plan.hasAds && (
                              <li className="flex items-start gap-2 text-sm text-amber-500">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Contains advertisements</span>
                              </li>
                            )}
                          </ul>
                          
                          <Button
                            className="w-full"
                            variant={plan.popular ? 'default' : 'outline'}
                            disabled={currentPlanId === plan.id}
                            onClick={() => handleSelectPlan(plan)}
                          >
                            {currentPlanId === plan.id ? 'Current Plan' : 'Select Plan'}
                            {currentPlanId !== plan.id && <ArrowRight className="w-4 h-4 ml-2" />}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Payment Method */}
            {step === 'payment' && selectedPlan && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <Button variant="ghost" onClick={handleBack} className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Plans
                </Button>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-display mb-2">Select Payment Method</h2>
                  <p className="text-muted-foreground">
                    Pay ৳{selectedPlan.price} for {selectedPlan.name}
                  </p>
                </div>

                <div className="grid gap-4">
                  {paymentMethods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleSelectPayment(method)}
                      >
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className={`w-16 h-16 ${method.color} rounded-xl flex items-center justify-center text-3xl text-white`}>
                            {method.logo}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold">{method.name}</h3>
                            <p className="text-muted-foreground">Pay via {method.name} mobile banking</p>
                          </div>
                          <ArrowRight className="w-6 h-6 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm Transaction */}
            {step === 'confirm' && selectedPlan && selectedPayment && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto"
              >
                <Button variant="ghost" onClick={handleBack} className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Payment Methods
                </Button>

                <Card>
                  <CardHeader className={`${selectedPayment.color} text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{selectedPayment.logo}</div>
                      <div>
                        <CardTitle>Pay with {selectedPayment.name}</CardTitle>
                        <p className="text-white/80">Amount: ৳{selectedPlan.price}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6">
                    {/* Payment Instructions */}
                    <div className="bg-secondary rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Payment Instructions
                      </h4>
                      <ol className="space-y-2 text-sm">
                        {selectedPayment.instructions.map((instruction, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-medium text-primary">{i + 1}.</span>
                            {instruction.includes(selectedPayment.number) ? (
                              <span>
                                {instruction.split(selectedPayment.number)[0]}
                                <span className="font-mono font-bold text-primary">{selectedPayment.number}</span>
                                {instruction.split(selectedPayment.number)[1]}
                              </span>
                            ) : (
                              instruction
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Copy Number */}
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm">Send to:</span>
                      <span className="font-mono font-bold flex-1">{selectedPayment.number}</span>
                      <Button size="sm" variant="outline" onClick={handleCopyNumber}>
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <span className="font-medium">Amount to Send</span>
                      <span className="text-2xl font-bold text-amber-500">৳{selectedPlan.price}</span>
                    </div>

                    {/* Transaction Form */}
                    <div className="space-y-4 pt-4 border-t border-border">
                      <h4 className="font-semibold">Confirm Your Payment</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sender">Your {selectedPayment.name} Number</Label>
                        <Input
                          id="sender"
                          placeholder="01XXXXXXXXX"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          maxLength={11}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="txnId">Transaction ID (TrxID)</Label>
                        <Input
                          id="txnId"
                          placeholder="e.g., TXN123456789"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                          You will receive this ID in SMS after completing the payment
                        </p>
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleSubmitTransaction}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center"
              >
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                
                <h2 className="text-3xl font-display mb-4">Payment Submitted!</h2>
                
                <p className="text-muted-foreground mb-6">
                  Thank you for your payment. Our team will verify your transaction and activate your 
                  <span className="font-semibold text-foreground"> {selectedPlan?.name}</span> subscription within 24 hours.
                </p>

                <Card className="mb-6 text-left">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono font-medium">{orderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{selectedPlan?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-primary">৳{selectedPlan?.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium">{selectedPayment?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono">{transactionId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Clock className="w-3 h-3" />
                        Pending Verification
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go Home
                  </Button>
                  <Button onClick={() => navigate('/browse')}>
                    Start Watching
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subscription;
