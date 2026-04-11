// Subscription plans for the platform
export interface SubscriptionPlan {
  id: string;
  name: string;
  nameBn: string;
  price: number;
  interval: 'free' | 'monthly' | 'yearly';
  features: string[];
  featuresBn: string[];
  hasAds: boolean;
  popular?: boolean;
  color: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  color: string;
  number: string;
  instructions: string[];
}

export interface Transaction {
  id: string;
  oderId: string;
  planId: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  userId: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameBn: 'ফ্রি',
    price: 0,
    interval: 'free',
    hasAds: false,
    color: 'from-gray-500 to-gray-600',
    features: [
      'Access to free content only',
      'Standard quality (480p)',
      'Watch on 1 device',
      'Limited library',
    ],
    featuresBn: [
      'শুধুমাত্র ফ্রি কন্টেন্ট',
      'স্ট্যান্ডার্ড কোয়ালিটি (৪৮০p)',
      '১টি ডিভাইসে দেখুন',
      'সীমিত লাইব্রেরি',
    ],
  },
  {
    id: 'with-ads',
    name: 'Basic (With Ads)',
    nameBn: 'বেসিক (বিজ্ঞাপন সহ)',
    price: 99,
    interval: 'monthly',
    hasAds: true,
    color: 'from-blue-500 to-blue-600',
    features: [
      'Access to all content',
      'HD quality (720p)',
      'Watch on 2 devices',
      'Contains advertisements',
      'Download for offline',
    ],
    featuresBn: [
      'সব কন্টেন্ট দেখুন',
      'HD কোয়ালিটি (৭২০p)',
      '২টি ডিভাইসে দেখুন',
      'বিজ্ঞাপন থাকবে',
      'অফলাইনে ডাউনলোড',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    nameBn: 'প্রিমিয়াম',
    price: 299,
    interval: 'monthly',
    hasAds: false,
    popular: true,
    color: 'from-amber-500 to-yellow-500',
    features: [
      'Access to all content',
      'Ultra HD quality (4K)',
      'Watch on 4 devices',
      'No advertisements',
      'Download for offline',
      'Early access to new releases',
      'Exclusive content',
    ],
    featuresBn: [
      'সব কন্টেন্ট দেখুন',
      'Ultra HD কোয়ালিটি (4K)',
      '৪টি ডিভাইসে দেখুন',
      'কোনো বিজ্ঞাপন নেই',
      'অফলাইনে ডাউনলোড',
      'নতুন রিলিজে আগে প্রবেশ',
      'এক্সক্লুসিভ কন্টেন্ট',
    ],
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'bkash',
    name: 'bKash',
    logo: '🅱️',
    color: 'bg-pink-600',
    number: '01XXXXXXXXX',
    instructions: [
      'Open bKash App or dial *247#',
      'Select "Send Money"',
      'Enter the number: 01XXXXXXXXX',
      'Enter the amount',
      'Enter your PIN and confirm',
      'Copy the Transaction ID',
    ],
  },
  {
    id: 'nagad',
    name: 'Nagad',
    logo: '🟠',
    color: 'bg-orange-500',
    number: '01XXXXXXXXX',
    instructions: [
      'Open Nagad App or dial *167#',
      'Select "Send Money"',
      'Enter the number: 01XXXXXXXXX',
      'Enter the amount',
      'Enter your PIN and confirm',
      'Copy the Transaction ID',
    ],
  },
  {
    id: 'rocket',
    name: 'Rocket',
    logo: '🚀',
    color: 'bg-purple-600',
    number: '01XXXXXXXXX',
    instructions: [
      'Open Rocket App or dial *322#',
      'Select "Send Money"',
      'Enter the number: 01XXXXXXXXX',
      'Enter the amount',
      'Enter your PIN and confirm',
      'Copy the Transaction ID',
    ],
  },
];
