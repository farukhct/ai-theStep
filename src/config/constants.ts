import { Product, Supplier, Expense, Order } from '../types';

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

export const GARMENT_CATEGORIES = [
  { id: 'all', name: 'All Garments', nameBn: 'সকল পোশাক', icon: 'Sparkles' },
  { id: 't-shirts', name: 'T-Shirts & Polos', nameBn: 'টি-শার্ট ও পোলো', icon: 'Shirt' },
  { id: 'shirts', name: 'Formal & Casual Shirts', nameBn: 'ফরমাল ও ক্যাজুয়াল শার্ট', icon: 'FolderGit2' },
  { id: 'pants', name: 'Trousers & Chinos', nameBn: 'ট্রাউজার ও চিনোস', icon: 'Footprints' },
  { id: 'jeans', name: 'Denim Jeans', nameBn: 'ডেনিম জিন্স', icon: 'Layers' },
  { id: 'jackets', name: 'Jackets & Hoodies', nameBn: 'জ্যাকেট ও হুডি', icon: 'Wind' },
  { id: 'sweaters', name: 'Knitwear & Sweaters', nameBn: 'সোয়েটার ও নিটওয়্যার', icon: 'CloudRain' },
  { id: 'panjabi', name: 'Traditional & Festive', nameBn: 'পাঞ্জাবি ও উৎসব', icon: 'Crown' },
  { id: 'sportswear', name: 'Activewear & Gym', nameBn: 'অ্যাক্টিভওয়্যার ও জিম', icon: 'Zap' },
  { id: 'women', name: 'Women’s Collection', nameBn: 'নারীদের কালেকশন', icon: 'Heart' },
  { id: 'kids', name: 'Kids Clothing', nameBn: 'শিশুদের পোশাক', icon: 'Smile' },
  { id: 'accessories', name: 'Belts & Essentials', nameBn: 'অ্যাক্সেসরিজ', icon: 'Watch' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'AURA Heavyweight Oversized Cotton T-Shirt',
    slug: 'aura-heavyweight-oversized-cotton-t-shirt',
    sku: 'TSH-HVY-001',
    category: 't-shirts',
    subcategory: 'Oversized Tees',
    brand: 'AURA Atelier',
    description: 'Crafted from 240 GSM ultra-combed ring-spun Bangladeshi cotton. Features a relaxed drop-shoulder cut, reinforced ribbed crewneck collar, and twin-needle hemline. Pre-shrunk to retain structural silhouette across repeated washes.',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80'
    ],
    fabric: '100% Combed Ring-Spun Cotton',
    material: 'Single Jersey Compact Yarn',
    gsm: 240,
    weight: '320g',
    regularPrice: 1250,
    discountedPrice: 950,
    availableQuantity: 84,
    minimumStockLevel: 15,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    rating: 4.9,
    reviewsCount: 38,
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-11-10T14:30:00.000Z',
    variants: [
      { id: 'var-101', sku: 'TSH-BLK-M', size: 'M', color: 'Midnight Jet Black', colorHex: '#18181b', purchasePrice: 420, regularPrice: 1250, discountedPrice: 950, stock: 24, reservedStock: 2, minStockAlert: 5 },
      { id: 'var-102', sku: 'TSH-BLK-L', size: 'L', color: 'Midnight Jet Black', colorHex: '#18181b', purchasePrice: 420, regularPrice: 1250, discountedPrice: 950, stock: 20, reservedStock: 1, minStockAlert: 5 },
      { id: 'var-103', sku: 'TSH-BLK-XL', size: 'XL', color: 'Midnight Jet Black', colorHex: '#18181b', purchasePrice: 430, regularPrice: 1250, discountedPrice: 950, stock: 12, reservedStock: 0, minStockAlert: 4 },
      { id: 'var-104', sku: 'TSH-OAT-M', size: 'M', color: 'Warm Oatmeal Stone', colorHex: '#e4d5b7', purchasePrice: 420, regularPrice: 1250, discountedPrice: 950, stock: 15, reservedStock: 1, minStockAlert: 5 },
      { id: 'var-105', sku: 'TSH-OAT-L', size: 'L', color: 'Warm Oatmeal Stone', colorHex: '#e4d5b7', purchasePrice: 420, regularPrice: 1250, discountedPrice: 950, stock: 13, reservedStock: 0, minStockAlert: 5 }
    ]
  },
  {
    id: 'prod-002',
    name: 'Executive Egyptian Giza Cotton Oxford Shirt',
    slug: 'executive-egyptian-giza-cotton-oxford-shirt',
    sku: 'SHT-GIZ-002',
    category: 'shirts',
    subcategory: 'Formal Shirts',
    brand: 'AURA Sartorial',
    description: 'Precision-tailored from long-staple 80s 2-ply Egyptian Giza cotton with an easy-iron silky finish. Semi-spread Italian collar with removable collar stays, mother-of-pearl buttons, and rounded French cuffs.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
    ],
    fabric: '100% Giza Long-Staple Cotton',
    material: 'Pinpoint Oxford Weave',
    gsm: 140,
    weight: '260g',
    regularPrice: 2450,
    discountedPrice: 1950,
    availableQuantity: 42,
    minimumStockLevel: 10,
    status: 'active',
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    rating: 4.8,
    reviewsCount: 29,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-11-08T11:20:00.000Z',
    variants: [
      { id: 'var-201', sku: 'SHT-BLU-15H', size: 'M', color: 'Sky Azure Blue', colorHex: '#93c5fd', purchasePrice: 950, regularPrice: 2450, discountedPrice: 1950, stock: 14, reservedStock: 2, minStockAlert: 4 },
      { id: 'var-202', sku: 'SHT-BLU-16', size: 'L', color: 'Sky Azure Blue', colorHex: '#93c5fd', purchasePrice: 950, regularPrice: 2450, discountedPrice: 1950, stock: 16, reservedStock: 1, minStockAlert: 4 },
      { id: 'var-203', sku: 'SHT-WHT-15H', size: 'M', color: 'Crisp Snow White', colorHex: '#f8fafc', purchasePrice: 950, regularPrice: 2450, discountedPrice: 1950, stock: 12, reservedStock: 0, minStockAlert: 3 }
    ]
  },
  {
    id: 'prod-003',
    name: 'Selvedge Raw Denim Relaxed Tapered Jeans',
    slug: 'selvedge-raw-denim-relaxed-tapered-jeans',
    sku: 'JNS-SLV-003',
    category: 'jeans',
    subcategory: 'Selvedge Denim',
    brand: 'AURA Denim Lab',
    description: '14.5oz shuttle-loom red-line selvedge denim woven in Narayanganj mills. Pure natural indigo dip with zero synthetic bleach. Solid brass hardware, copper rivets, and vegetable-tanned leather back patch.',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80'
    ],
    fabric: '100% Ring-Spun Cotton',
    material: '14.5oz Shuttle Selvedge Denim',
    gsm: 410,
    weight: '680g',
    regularPrice: 3200,
    discountedPrice: 2650,
    availableQuantity: 35,
    minimumStockLevel: 8,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    rating: 5.0,
    reviewsCount: 19,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-11-11T16:00:00.000Z',
    variants: [
      { id: 'var-301', sku: 'JNS-IND-30', size: 'S', color: 'Deep Indigo Raw', colorHex: '#1e3a8a', purchasePrice: 1250, regularPrice: 3200, discountedPrice: 2650, stock: 10, reservedStock: 1, minStockAlert: 3 },
      { id: 'var-302', sku: 'JNS-IND-32', size: 'M', color: 'Deep Indigo Raw', colorHex: '#1e3a8a', purchasePrice: 1250, regularPrice: 3200, discountedPrice: 2650, stock: 15, reservedStock: 2, minStockAlert: 4 },
      { id: 'var-303', sku: 'JNS-IND-34', size: 'L', color: 'Deep Indigo Raw', colorHex: '#1e3a8a', purchasePrice: 1250, regularPrice: 3200, discountedPrice: 2650, stock: 10, reservedStock: 0, minStockAlert: 3 }
    ]
  },
  {
    id: 'prod-004',
    name: 'Tailored Smart Stretch Cotton Chino Trousers',
    slug: 'tailored-smart-stretch-cotton-chino-trousers',
    sku: 'PNT-CHN-004',
    category: 'pants',
    subcategory: 'Chino Trousers',
    brand: 'AURA Sartorial',
    description: 'High-density cotton twill infused with 3% elastane for unrestricted stretch. Mid-rise with clean tailored leg taper, interior contrast piping, and hidden pocket for smartphones.',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80'
    ],
    fabric: '97% Combed Cotton, 3% Spandex',
    material: 'High-Count Peach Finish Twill',
    gsm: 260,
    weight: '440g',
    regularPrice: 2200,
    discountedPrice: 1750,
    availableQuantity: 48,
    minimumStockLevel: 10,
    status: 'active',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    rating: 4.7,
    reviewsCount: 42,
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-11-05T13:40:00.000Z',
    variants: [
      { id: 'var-401', sku: 'CHN-KHK-32', size: 'M', color: 'British Khaki', colorHex: '#c2b280', purchasePrice: 820, regularPrice: 2200, discountedPrice: 1750, stock: 18, reservedStock: 1, minStockAlert: 4 },
      { id: 'var-402', sku: 'CHN-KHK-34', size: 'L', color: 'British Khaki', colorHex: '#c2b280', purchasePrice: 820, regularPrice: 2200, discountedPrice: 1750, stock: 16, reservedStock: 0, minStockAlert: 4 },
      { id: 'var-403', sku: 'CHN-NVY-32', size: 'M', color: 'Deep Royal Navy', colorHex: '#0f172a', purchasePrice: 820, regularPrice: 2200, discountedPrice: 1750, stock: 14, reservedStock: 1, minStockAlert: 3 }
    ]
  },
  {
    id: 'prod-005',
    name: 'Minimalist Tech-Fleece Zip Hoodie',
    slug: 'minimalist-tech-fleece-zip-hoodie',
    sku: 'JKT-HOD-005',
    category: 'jackets',
    subcategory: 'Hoodies',
    brand: 'AURA Motion',
    description: 'Constructed from thermal double-sided cotton spacer fleece. Features taped YKK reverse-coil matte black zippers, ergonomic raglan sleeves, and contoured storm hood with integrated drawcord.',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80'
    ],
    fabric: '80% Organic Cotton, 20% Recycled Polyester',
    material: 'Double-Faced Tech Spacer Knit',
    gsm: 340,
    weight: '590g',
    regularPrice: 2800,
    discountedPrice: 2350,
    availableQuantity: 28,
    minimumStockLevel: 6,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    rating: 4.9,
    reviewsCount: 16,
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-11-12T05:10:00.000Z',
    variants: [
      { id: 'var-501', sku: 'HOD-CHR-M', size: 'M', color: 'Charcoal Heather', colorHex: '#334155', purchasePrice: 1100, regularPrice: 2800, discountedPrice: 2350, stock: 12, reservedStock: 1, minStockAlert: 3 },
      { id: 'var-502', sku: 'HOD-CHR-L', size: 'L', color: 'Charcoal Heather', colorHex: '#334155', purchasePrice: 1100, regularPrice: 2800, discountedPrice: 2350, stock: 10, reservedStock: 0, minStockAlert: 3 },
      { id: 'var-503', sku: 'HOD-CHR-XL', size: 'XL', color: 'Charcoal Heather', colorHex: '#334155', purchasePrice: 1120, regularPrice: 2800, discountedPrice: 2350, stock: 6, reservedStock: 0, minStockAlert: 2 }
    ]
  },
  {
    id: 'prod-006',
    name: 'Artisan Jacquard Festive Panjabi',
    slug: 'artisan-jacquard-festive-panjabi',
    sku: 'TRD-PNJ-006',
    category: 'panjabi',
    subcategory: 'Designer Panjabi',
    brand: 'AURA Heritage',
    description: 'Woven on computerized jacquard looms using premium viscose-cotton blend with subtle self-embossed geometric motifs. Mandarin collar with antique brass snap buttons and functional side inseam pockets.',
    images: [
      'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&auto=format&fit=crop&q=80'
    ],
    fabric: '65% Cotton, 35% Viscose Jacquard',
    material: 'Textured Jacquard Self-Weave',
    gsm: 175,
    weight: '340g',
    regularPrice: 3450,
    discountedPrice: 2850,
    availableQuantity: 22,
    minimumStockLevel: 5,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    rating: 5.0,
    reviewsCount: 24,
    createdAt: '2026-10-18T14:00:00.000Z',
    updatedAt: '2026-11-09T18:00:00.000Z',
    variants: [
      { id: 'var-601', sku: 'PNJ-MRN-40', size: 'M', color: 'Imperial Maroon', colorHex: '#881337', purchasePrice: 1350, regularPrice: 3450, discountedPrice: 2850, stock: 10, reservedStock: 1, minStockAlert: 2 },
      { id: 'var-602', sku: 'PNJ-MRN-42', size: 'L', color: 'Imperial Maroon', colorHex: '#881337', purchasePrice: 1350, regularPrice: 3450, discountedPrice: 2850, stock: 8, reservedStock: 0, minStockAlert: 2 },
      { id: 'var-603', sku: 'PNJ-MRN-44', size: 'XL', color: 'Imperial Maroon', colorHex: '#881337', purchasePrice: 1380, regularPrice: 3450, discountedPrice: 2850, stock: 4, reservedStock: 0, minStockAlert: 2 }
    ]
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Beximco Composite Textiles Ltd',
    contactPerson: 'Engr. Maksudul Alam',
    phoneNumber: '+8801711234567',
    email: 'sales@beximco-textiles.com',
    companyName: 'Beximco Group Bangladesh',
    address: 'Kashimpur, Gazipur, Dhaka',
    bankInfo: 'Dutch-Bangla Bank, A/C: 110.120.4568',
    status: 'active'
  },
  {
    id: 'sup-002',
    name: 'Robin Knitwear Narayanganj',
    contactPerson: 'Tanvir Hossain',
    phoneNumber: '+8801819345678',
    email: 'procure@robinknit.bd',
    companyName: 'Robin Fashion Mills Ltd',
    address: 'Godnail, Narayanganj Sadar',
    bankInfo: 'BRAC Bank Ltd, A/C: 1501.2039.4820',
    status: 'active'
  },
  {
    id: 'sup-003',
    name: 'Auko-Tex Sustainable Fabrics',
    contactPerson: 'Shamsul Huda',
    phoneNumber: '+8801912987654',
    email: 'info@aukotex.com',
    companyName: 'Auko-Tex Group',
    address: 'Konabari, Gazipur',
    bankInfo: 'City Bank Ltd, A/C: 220.334.8871',
    status: 'active'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    category: 'packaging',
    description: 'Custom matte black garment boxes & anti-humidity poly bags (500 units)',
    amount: 14500,
    date: '2026-11-01',
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'PKG-2026-88',
    createdBy: 'Faruk (Superadmin)'
  },
  {
    id: 'exp-002',
    category: 'delivery_courier',
    description: 'Pathao Courier & Steadfast bulk delivery fulfillment settlements',
    amount: 22800,
    date: '2026-11-04',
    paymentMethod: 'bKash Merchant',
    referenceNumber: 'STDF-NOV-11',
    createdBy: 'Faruk (Superadmin)'
  },
  {
    id: 'exp-003',
    category: 'marketing',
    description: 'Winter Collection photography shoot & studio model charges',
    amount: 18000,
    date: '2026-11-06',
    paymentMethod: 'City Bank Card',
    referenceNumber: 'STD-SHOOT-09',
    createdBy: 'Store Manager'
  },
  {
    id: 'exp-004',
    category: 'payment_gateway_fees',
    description: 'bKash and Nagad payment gateway 1.5% transaction settlement fees',
    amount: 4650,
    date: '2026-11-10',
    paymentMethod: 'Auto Deduction',
    referenceNumber: 'BK-GW-NOV',
    createdBy: 'System Gateway'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-8891',
    orderNumber: 'AURA-26-8891',
    customerId: 'cust-101',
    customerName: 'Tanvir Ahmed',
    contactNumber: '+8801712998877',
    email: 'tanvir.ahmed@gmail.com',
    shippingAddress: {
      fullName: 'Tanvir Ahmed',
      phone: '+8801712998877',
      email: 'tanvir.ahmed@gmail.com',
      division: 'Dhaka',
      district: 'Dhaka City',
      upazila: 'Gulshan-2',
      detailedAddress: 'House 42, Road 113, Gulshan-2, Dhaka',
      postcode: '1212',
      deliveryNotes: 'Please ring bell before 6 PM'
    },
    billingAddress: {
      fullName: 'Tanvir Ahmed',
      phone: '+8801712998877',
      email: 'tanvir.ahmed@gmail.com',
      division: 'Dhaka',
      district: 'Dhaka City',
      upazila: 'Gulshan-2',
      detailedAddress: 'House 42, Road 113, Gulshan-2, Dhaka',
      postcode: '1212'
    },
    items: [
      {
        productId: 'prod-001',
        variantId: 'var-101',
        variantSku: 'TSH-BLK-M',
        name: 'AURA Heavyweight Oversized Cotton T-Shirt',
        size: 'M',
        color: 'Midnight Jet Black',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        price: 950,
        purchasePrice: 420,
        quantity: 2,
        total: 1900
      },
      {
        productId: 'prod-004',
        variantId: 'var-401',
        variantSku: 'CHN-KHK-32',
        name: 'Tailored Smart Stretch Cotton Chino Trousers',
        size: 'M',
        color: 'British Khaki',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
        price: 1750,
        purchasePrice: 820,
        quantity: 1,
        total: 1750
      }
    ],
    subtotal: 3650,
    discount: 250,
    shippingFee: 0, // Free over 2500
    tax: 0,
    grandTotal: 3400,
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    orderStatus: 'processing',
    transactionId: 'BKASH-TX-99812401',
    trackingNumber: 'PTH-BD-88912',
    orderDate: '2026-11-11T14:20:00.000Z',
    remarks: 'bKash instant merchant payment verified',
    statusHistory: [
      { status: 'pending_payment', timestamp: '2026-11-11T14:18:00.000Z', updatedBy: 'System' },
      { status: 'paid', timestamp: '2026-11-11T14:20:00.000Z', updatedBy: 'bKash Gateway' },
      { status: 'confirmed', timestamp: '2026-11-11T14:25:00.000Z', updatedBy: 'Faruk (Superadmin)' },
      { status: 'processing', timestamp: '2026-11-11T16:00:00.000Z', updatedBy: 'Order Fulfillment' }
    ]
  },
  {
    id: 'ord-8892',
    orderNumber: 'AURA-26-8892',
    customerId: 'cust-102',
    customerName: 'Samira Rahman',
    contactNumber: '+8801811445566',
    email: 'samira.rahman@northsouth.edu',
    shippingAddress: {
      fullName: 'Samira Rahman',
      phone: '+8801811445566',
      email: 'samira.rahman@northsouth.edu',
      division: 'Chittagong',
      district: 'Chittagong City',
      upazila: 'Panchlaish',
      detailedAddress: 'Flat 4B, Green Hill Heights, Nasirabad, Chittagong',
      postcode: '4000'
    },
    billingAddress: {
      fullName: 'Samira Rahman',
      phone: '+8801811445566',
      email: 'samira.rahman@northsouth.edu',
      division: 'Chittagong',
      district: 'Chittagong City',
      upazila: 'Panchlaish',
      detailedAddress: 'Flat 4B, Green Hill Heights, Nasirabad, Chittagong',
      postcode: '4000'
    },
    items: [
      {
        productId: 'prod-006',
        variantId: 'var-601',
        variantSku: 'PNJ-MRN-40',
        name: 'Artisan Jacquard Festive Panjabi',
        size: 'M',
        color: 'Imperial Maroon',
        image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&auto=format&fit=crop&q=80',
        price: 2850,
        purchasePrice: 1350,
        quantity: 1,
        total: 2850
      }
    ],
    subtotal: 2850,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    grandTotal: 2850,
    paymentMethod: 'nagad',
    paymentStatus: 'paid',
    orderStatus: 'shipped',
    transactionId: 'NAGAD-TX-773412',
    trackingNumber: 'STDF-CTG-44910',
    orderDate: '2026-11-10T10:15:00.000Z',
    remarks: 'Nagad online payment confirmed',
    statusHistory: [
      { status: 'paid', timestamp: '2026-11-10T10:15:00.000Z', updatedBy: 'Nagad Gateway' },
      { status: 'confirmed', timestamp: '2026-11-10T11:00:00.000Z', updatedBy: 'Admin' },
      { status: 'packed', timestamp: '2026-11-10T15:30:00.000Z', updatedBy: 'Warehouse' },
      { status: 'shipped', timestamp: '2026-11-11T09:00:00.000Z', updatedBy: 'Courier Dispatch' }
    ]
  }
];

export const INITIAL_COUPONS = [
  {
    id: 'coup-01',
    code: 'AURA10',
    discountType: 'percentage' as const,
    discountValue: 10,
    minOrderAmount: 1500,
    maxDiscount: 500,
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    usageCount: 47,
    isActive: true
  },
  {
    id: 'coup-02',
    code: 'EID250',
    discountType: 'fixed' as const,
    discountValue: 250,
    minOrderAmount: 2000,
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usageCount: 89,
    isActive: true
  }
];
