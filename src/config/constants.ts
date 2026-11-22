import { Product, Supplier, Expense, Order, Coupon, ProductBid } from '../types';
import { MEDIA_ASSETS } from './mediaAssets';
import { COUPONS_SEED, ORDERS_SEED, PRODUCTS_SEED } from './commerceSeed';

export const BD_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh'
] as const;

export const BD_DISTRICTS_MAP: Record<string, string[]> = {
  Dhaka: ['Dhaka City', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj', 'Munshiganj', 'Narsingdi'],
  Chittagong: ['Chittagong City', "Cox's Bazar", 'Comilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Chandpur'],
  Sylhet: ['Sylhet City', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rajshahi: ['Rajshahi City', 'Bogra', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Chapai Nawabganj'],
  Khulna: ['Khulna City', 'Jessore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Jhenaidah'],
  Barisal: ['Barisal City', 'Patuakhali', 'Bhola', 'Pirojpur', 'Jhalokati', 'Barguna'],
  Rangpur: ['Rangpur City', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Thakurgaon'],
  Mymensingh: ['Mymensingh City', 'Jamalpur', 'Netrokona', 'Sherpur']
};

export const THESTEPS_CONTACT = {
  brand: 'TheSteps',
  tagline: 'The Ultimate Online Shopping BD Experience',
  address: 'Horogram Bazar, Rajpara, Rajshahi · Dhaka Hub: Uttara Sector-11',
  phone: '01326052866',
  phoneHours: '01326052866 (9am-6pm)',
  email: 'support@thesteps.com.bd'
};

export const POPULAR_SEARCH_KEYWORDS = [
  { label: 'smart watch', hot: true },
  { label: 'earbuds', hot: true },
  { label: 'serum', hot: false },
  { label: 'panjabi', hot: false },
  { label: 'keyboard', hot: false },
  { label: 'office chair', hot: false },
  { label: 'air purifier', hot: false },
  { label: 'power bank', hot: false }
];

// Exact thesteps.com.bd product department taxonomy
export const GARMENT_CATEGORIES = [
  { id: 'all', name: 'All Products', nameBn: 'সকল পণ্য', icon: 'LayoutGrid' },
  { id: 'mobile-gadgets', name: 'Mobile & Gadgets', nameBn: 'মোবাইল ও গ্যাজেট', icon: 'Smartphone' },
  { id: 'audio-headphones', name: 'Audio & Headphones', nameBn: 'অডিও ও হেডফোন', icon: 'Headphones' },
  { id: 'computer-office', name: 'Computer & Office', nameBn: 'কম্পিউটার ও অফিস', icon: 'Laptop' },
  { id: 'home-appliances', name: 'Home Appliances', nameBn: 'হোম অ্যাপ্লায়েন্স', icon: 'Wind' },
  { id: 'health-beauty', name: 'Health & Beauty', nameBn: 'স্বাস্থ্য ও সৌন্দর্য', icon: 'Sparkles' },
  { id: 'fashion', name: 'Fashion', nameBn: 'ফ্যাশন', icon: 'Shirt' },
  { id: 'furniture-decor', name: 'Furniture & Decor', nameBn: 'ফার্নিচার ও ডেকোর', icon: 'Armchair' },
  { id: 'household-kitchenware', name: 'Household & Kitchenware', nameBn: 'গৃহস্থালী ও কিচেন', icon: 'Home' },
  { id: 'electronics-accessories', name: 'Electronics Accessories', nameBn: 'ইলেকট্রনিক্স এক্সেসরিজ', icon: 'Cpu' },
  { id: 'baby-kids', name: 'Baby & Kids', nameBn: 'বেবি ও কিডস', icon: 'Smile' },
  { id: 'daily-needs', name: 'Daily Needs', nameBn: 'নিত্যপণ্য', icon: 'ShoppingBasket' },
  { id: 'sports-fitness', name: 'Sports & Fitness', nameBn: 'স্পোর্টস ও ফিটনেস', icon: 'Dumbbell' }
];

const PRODUCT_IMAGES_MAP: Record<string, string[]> = {
  'prod-001': [MEDIA_ASSETS.prodSmartwatchPro, MEDIA_ASSETS.heroTheStepsCampaign],
  'prod-002': [MEDIA_ASSETS.prodEarbudsAnc, MEDIA_ASSETS.heroTheStepsCampaign],
  'prod-003': [MEDIA_ASSETS.prodSkincareSerum],
  'prod-004': [MEDIA_ASSETS.prodMechanicalKeyboard],
  'prod-005': [MEDIA_ASSETS.prodErgoChair],
  'prod-006': [MEDIA_ASSETS.prodHomeAppliance],
  'prod-007': [MEDIA_ASSETS.prodMensPanjabi],
  'prod-008': [MEDIA_ASSETS.heroTheStepsCampaign, MEDIA_ASSETS.prodEarbudsAnc]
};

export const INITIAL_PRODUCTS: Product[] = PRODUCTS_SEED.map((product) => ({
  ...product,
  images: PRODUCT_IMAGES_MAP[product.id] || product.images
}));

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Motion View & Tech Imports BD',
    contactPerson: 'Engr. Maksudul Alam',
    phoneNumber: '+8801711234567',
    email: 'b2b@motionview-bd.com',
    companyName: 'Motion View Distribution Ltd',
    address: 'Gulshan Avenue, Dhaka-1212',
    bankInfo: 'Dutch-Bangla Bank, A/C: 110.120.4568',
    status: 'active'
  },
  {
    id: 'sup-002',
    name: 'Rajshahi Direct Logistics & Retail',
    contactPerson: 'Tanvir Hossain',
    phoneNumber: '+8801326052866',
    email: 'supply@thesteps.com.bd',
    companyName: 'TheSteps Fulfillment Hub',
    address: 'Horogram Bazar, Rajpara, Rajshahi',
    bankInfo: 'BRAC Bank Ltd, A/C: 1501.2039.4820',
    status: 'active'
  },
  {
    id: 'sup-003',
    name: 'Regal & K-Beauty Official Distributors',
    contactPerson: 'Shamsul Huda',
    phoneNumber: '+8801912987654',
    email: 'trade@regal-bd.com',
    companyName: 'RFL & Cosmetics Imports BD',
    address: 'Badda Link Road, Dhaka-1212',
    bankInfo: 'City Bank Ltd, A/C: 220.334.8871',
    status: 'active'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    category: 'packaging',
    description: 'TheSteps branded corrugated shipping boxes & bubble wraps (1,000 units)',
    amount: 16500,
    date: '2026-11-01',
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'SD-PKG-88',
    createdBy: 'Faruk (Superadmin)'
  },
  {
    id: 'exp-002',
    category: 'delivery_courier',
    description: 'Steadfast & Pathao 64-district COD fulfillment settlements',
    amount: 24500,
    date: '2026-11-04',
    paymentMethod: 'bKash Merchant',
    referenceNumber: 'STDF-NOV-11',
    createdBy: 'Faruk (Superadmin)'
  },
  {
    id: 'exp-003',
    category: 'marketing',
    description: 'Flash Deal & 11.11 Campaign digital promotion',
    amount: 18000,
    date: '2026-11-06',
    paymentMethod: 'City Bank Card',
    referenceNumber: 'SD-CMP-09',
    createdBy: 'Store Manager'
  },
  {
    id: 'exp-004',
    category: 'payment_gateway_fees',
    description: 'EPS & MFS (bKash/Nagad/VISA) settlement fees',
    amount: 4650,
    date: '2026-11-10',
    paymentMethod: 'Auto Deduction',
    referenceNumber: 'EPS-GW-NOV',
    createdBy: 'System Gateway'
  }
];

export const INITIAL_ORDERS: Order[] = ORDERS_SEED.map((order) => ({
  ...order,
  items: order.items.map((item) => ({
    ...item,
    image: PRODUCT_IMAGES_MAP[item.productId]?.[0] || item.image
  }))
}));

export const INITIAL_COUPONS: Coupon[] = COUPONS_SEED;

export const INITIAL_BIDS: ProductBid[] = [
  {
    id: 'bid-101',
    productId: 'prod-001',
    productName: 'Amazfit Active Titanium AMOLED Smart Watch (GPS + BT Calling)',
    productImage: MEDIA_ASSETS.prodSmartwatchPro,
    originalPrice: 6490,
    bidAmount: 6050,
    quantity: 1,
    customerId: 'cust-demo-01',
    customerName: 'Arif Khan',
    customerPhone: '+8801712345678',
    note: 'Can pick up or pay immediately via bKash',
    status: 'pending',
    createdAt: '2026-11-12T08:30:00.000Z'
  }
];
