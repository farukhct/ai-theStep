import { PaymentCategory, PaymentMethod } from '../types';

export interface EpsPaymentChannel {
  id: PaymentMethod;
  name: string;
  shortName: string;
  category: PaymentCategory;
  categoryLabel: string;
  brandColor: string;
  bgTint: string;
  borderActive: string;
  description: string;
  gatewayFlow: 'card' | 'ibanking' | 'mfs' | 'bank_slip' | 'cod';
  supportsEmi?: boolean;
}

export const EPS_PLATFORM_INFO = {
  title: 'Easy Payment System (EPS)',
  subtitle: 'Secure Digital Payment Platform',
  headline: 'Every way your customers want to pay',
  tagline: 'EPS brings cards, internet banking, and mobile financial services together in one integrated checkout.',
  supportPhone: '+8801324722804',
  supportEmail: 'sadia.akhter@eps.com.bd',
  officeAddress: '38, Sonargaon Janapath Road, Sector-11, Uttara, Dhaka-1230, Bangladesh',
  url: 'https://www.eps.com.bd/payment-options'
};

export const EPS_PAYMENT_CHANNELS: EpsPaymentChannel[] = [
  // --- CARDS ---
  {
    id: 'visa',
    name: 'VISA',
    shortName: 'VISA',
    category: 'cards',
    categoryLabel: 'Cards',
    brandColor: '#1A1F71',
    bgTint: 'bg-blue-50/70',
    borderActive: 'border-[#1A1F71]',
    description: 'Local & International 3D Secure VISA Debit/Credit',
    gatewayFlow: 'card',
    supportsEmi: true
  },
  {
    id: 'mastercard',
    name: 'Master Card',
    shortName: 'Mastercard',
    category: 'cards',
    categoryLabel: 'Cards',
    brandColor: '#EB001B',
    bgTint: 'bg-orange-50/70',
    borderActive: 'border-[#EB001B]',
    description: '3D Secure Mastercard Credit & Debit Cards',
    gatewayFlow: 'card',
    supportsEmi: true
  },
  {
    id: 'amex',
    name: 'American Express',
    shortName: 'AMEX',
    category: 'cards',
    categoryLabel: 'Cards',
    brandColor: '#006FCF',
    bgTint: 'bg-sky-50/70',
    borderActive: 'border-[#006FCF]',
    description: 'City Bank AMEX & International SafeKey',
    gatewayFlow: 'card',
    supportsEmi: true
  },
  {
    id: 'dbbl_visa',
    name: 'Dutch Bangla VISA Card',
    shortName: 'DBBL VISA',
    category: 'cards',
    categoryLabel: 'Cards',
    brandColor: '#004B8D',
    bgTint: 'bg-indigo-50/70',
    borderActive: 'border-[#004B8D]',
    description: 'DBBL Nexus / VISA 2FA Protected Checkout',
    gatewayFlow: 'card',
    supportsEmi: true
  },
  {
    id: 'dbbl_master',
    name: 'Dutch Bangla Master Card',
    shortName: 'DBBL Master',
    category: 'cards',
    categoryLabel: 'Cards',
    brandColor: '#0B5345',
    bgTint: 'bg-teal-50/70',
    borderActive: 'border-[#0B5345]',
    description: 'DBBL Mastercard Instant Authorization',
    gatewayFlow: 'card',
    supportsEmi: true
  },

  // --- INTERNET BANKING ---
  {
    id: 'southeast_bank',
    name: 'Southeast Bank',
    shortName: 'Southeast Bank',
    category: 'internet_banking',
    categoryLabel: 'Internet Banking',
    brandColor: '#0D47A1',
    bgTint: 'bg-blue-50/70',
    borderActive: 'border-[#0D47A1]',
    description: 'Southeast Bank Direct iBanking Portal',
    gatewayFlow: 'ibanking'
  },
  {
    id: 'meghna_bank',
    name: 'Meghna Bank LTD',
    shortName: 'Meghna Bank',
    category: 'internet_banking',
    categoryLabel: 'Internet Banking',
    brandColor: '#00695C',
    bgTint: 'bg-teal-50/70',
    borderActive: 'border-[#00695C]',
    description: 'Meghna Bank Internet Banking Transfer',
    gatewayFlow: 'ibanking'
  },
  {
    id: 'islami_bank',
    name: 'Islami Bank',
    shortName: 'Islami Bank',
    category: 'internet_banking',
    categoryLabel: 'Internet Banking',
    brandColor: '#006A4E',
    bgTint: 'bg-emerald-50/70',
    borderActive: 'border-[#006A4E]',
    description: 'IBBL iBanking & CellFin Direct Authorization',
    gatewayFlow: 'ibanking'
  },
  {
    id: 'al_arafah_bank',
    name: 'Al-Arafah Islami Bank',
    shortName: 'Al-Arafah Bank',
    category: 'internet_banking',
    categoryLabel: 'Internet Banking',
    brandColor: '#1B5E20',
    bgTint: 'bg-green-50/70',
    borderActive: 'border-[#1B5E20]',
    description: 'AIBL iBanking Secure Account Debit',
    gatewayFlow: 'ibanking'
  },

  // --- MOBILE BANKING (MFS) ---
  {
    id: 'bkash',
    name: 'bKash',
    shortName: 'bKash',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#E2136E',
    bgTint: 'bg-pink-50/70',
    borderActive: 'border-[#E2136E]',
    description: 'Instant OTP & PIN tokenized bKash Pay',
    gatewayFlow: 'mfs'
  },
  {
    id: 'nagad',
    name: 'Nagad',
    shortName: 'Nagad',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#F7941D',
    bgTint: 'bg-amber-50/70',
    borderActive: 'border-[#F7941D]',
    description: 'Nagad Digital Financial Service Checkout',
    gatewayFlow: 'mfs'
  },
  {
    id: 'rocket',
    name: 'Rocket',
    shortName: 'Rocket',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#8C3494',
    bgTint: 'bg-purple-50/70',
    borderActive: 'border-[#8C3494]',
    description: 'DBBL Rocket Mobile Banking Checkout',
    gatewayFlow: 'mfs'
  },
  {
    id: 'ok_wallet',
    name: 'Ok Wallet',
    shortName: 'Ok Wallet',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#D81B60',
    bgTint: 'bg-rose-50/70',
    borderActive: 'border-[#D81B60]',
    description: 'ONE Bank OK Wallet Digital Payment',
    gatewayFlow: 'mfs'
  },
  {
    id: 'meghna_pay',
    name: 'Meghna pay',
    shortName: 'Meghna pay',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#00796B',
    bgTint: 'bg-teal-50/70',
    borderActive: 'border-[#00796B]',
    description: 'Meghna Bank Mobile Wallet Checkout',
    gatewayFlow: 'mfs'
  },
  {
    id: 'sheba_pay',
    name: 'Sheba pay',
    shortName: 'Sheba pay',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#283593',
    bgTint: 'bg-indigo-50/70',
    borderActive: 'border-[#283593]',
    description: 'Sheba Pay Digital Wallet Service',
    gatewayFlow: 'mfs'
  },
  {
    id: 'islamic_wallet',
    name: 'Islamic Wallet',
    shortName: 'Islamic Wallet',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#2E7D32',
    bgTint: 'bg-emerald-50/70',
    borderActive: 'border-[#2E7D32]',
    description: 'Al-Arafah Islamic Wallet Instant Pay',
    gatewayFlow: 'mfs'
  },
  {
    id: 'upay',
    name: 'Upay',
    shortName: 'Upay',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#0056A6',
    bgTint: 'bg-sky-50/70',
    borderActive: 'border-[#0056A6]',
    description: 'UCB Fintech Upay Mobile Wallet',
    gatewayFlow: 'mfs'
  },
  {
    id: 'tap',
    name: 'Tap',
    shortName: 'Tap',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#15803D',
    bgTint: 'bg-green-50/70',
    borderActive: 'border-[#15803D]',
    description: 'Trust Axiata Pay (tap) Digital Wallet',
    gatewayFlow: 'mfs'
  },
  {
    id: 'mcash',
    name: 'MCash',
    shortName: 'MCash',
    category: 'mobile_banking',
    categoryLabel: 'Mobile Banking',
    brandColor: '#0F766E',
    bgTint: 'bg-teal-50/70',
    borderActive: 'border-[#0F766E]',
    description: 'IBBL mCash Mobile Financial Service',
    gatewayFlow: 'mfs'
  },

  // --- OFFLINE / LEGACY ---
  {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    shortName: 'COD',
    category: 'cod',
    categoryLabel: 'Cash on Delivery',
    brandColor: '#047857',
    bgTint: 'bg-emerald-50/70',
    borderActive: 'border-emerald-700',
    description: 'Pay cash at doorstep upon parcel inspection',
    gatewayFlow: 'cod'
  },
  {
    id: 'bank_transfer',
    name: 'Corporate Bank Deposit',
    shortName: 'Bank Deposit',
    category: 'cod',
    categoryLabel: 'Offline / Corporate',
    brandColor: '#262626',
    bgTint: 'bg-neutral-100',
    borderActive: 'border-neutral-900',
    description: 'Upload deposit slip / routing reference',
    gatewayFlow: 'bank_slip'
  }
];

export const LEGACY_CHANNEL_MAP: Record<string, EpsPaymentChannel> = {
  sonali: {
    id: 'sonali',
    name: 'Sonali Payment Gateway',
    shortName: 'Sonali SPG',
    category: 'internet_banking',
    categoryLabel: 'Internet Banking',
    brandColor: '#008080',
    bgTint: 'bg-teal-50/70',
    borderActive: 'border-[#008080]',
    description: 'Sonali Bank e-Gateway',
    gatewayFlow: 'ibanking'
  },
  card: {
    id: 'card',
    name: 'Credit / Debit Card',
    shortName: 'Card',
    category: 'cards',
    categoryLabel: 'Cards',
    brandColor: '#171717',
    bgTint: 'bg-neutral-100',
    borderActive: 'border-neutral-900',
    description: 'VISA / Mastercard / AMEX',
    gatewayFlow: 'card',
    supportsEmi: true
  }
};

export function getPaymentChannelInfo(method: PaymentMethod): EpsPaymentChannel {
  const found = EPS_PAYMENT_CHANNELS.find((c) => c.id === method);
  if (found) return found;
  if (LEGACY_CHANNEL_MAP[method]) return LEGACY_CHANNEL_MAP[method];
  return EPS_PAYMENT_CHANNELS[0];
}

export function getPaymentChannelName(method: PaymentMethod | string): string {
  const found = EPS_PAYMENT_CHANNELS.find((c) => c.id === method);
  if (found) return found.name;
  if (LEGACY_CHANNEL_MAP[method]) return LEGACY_CHANNEL_MAP[method].name;
  return String(method).replace(/_/g, ' ').toUpperCase();
}
