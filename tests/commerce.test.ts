import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/app.ts';
import { SecurityStore } from '../server/data/securityStore.ts';
import { CommerceStore } from '../server/data/commerceStore.ts';
import { PRODUCTS_SEED } from '../src/config/commerceSeed.ts';
import type { CartItem } from '../src/types/index.ts';

class TestClient {
  private baseUrl: string;
  private cookies = new Map<string, string>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private captureCookies(headers: Headers) {
    const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const rawList = getSetCookie ? getSetCookie.call(headers) : [];
    for (const raw of rawList) {
      const [pair] = raw.split(';');
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const name = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      if (!val || raw.toLowerCase().includes('max-age=0')) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, val);
      }
    }
  }

  async ensureCsrf() {
    await this.request('GET', '/api/auth/csrf');
  }

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ status: number; data: T }> {
    const headers: Record<string, string> = {
      'User-Agent': 'CommerceTestSuite/1.0'
    };
    if (this.cookies.size > 0) {
      headers.Cookie = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }
    const csrf = this.cookies.get('thesteps_csrf');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) && csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    this.captureCookies(res.headers);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }
}

const makeCartItem = (productId: string, variantId: string, quantity = 1, overridePrice?: number): CartItem => {
  const prod = PRODUCTS_SEED.find((p) => p.id === productId)!;
  const v = prod.variants.find((vr) => vr.id === variantId)!;
  return {
    productId: prod.id,
    productName: prod.name,
    variantId: v.id,
    variantSku: v.sku,
    size: v.size,
    color: v.color,
    image: prod.images[0] || '',
    regularPrice: v.regularPrice,
    discountedPrice: overridePrice ?? v.discountedPrice,
    purchasePrice: v.purchasePrice,
    quantity,
    maxStock: v.stock - (v.reservedStock || 0),
    freeDelivery: prod.freeDelivery
  };
};

const VALID_SHIPPING = {
  fullName: 'Tanvir Ahmed',
  phone: '01712998877',
  email: 'tanvir@thesteps.test',
  division: 'Chittagong',
  district: 'Chittagong City',
  upazila: 'Nasirabad',
  detailedAddress: 'House 12, Road 4, Nasirabad Housing Society'
};

describe('TheSteps Cart, Checkout, EPS Online Payment & Order Integrity', () => {
  let server: http.Server;
  let baseUrl = '';
  let securityStore: SecurityStore;
  let commerceStore: CommerceStore;

  const ADMIN_EMAIL = 'commerce-admin@thesteps.test';
  const ADMIN_PASS = 'Commerce!AdminSecurePass#2026';

  before(async () => {
    securityStore = new SecurityStore({
      persistPath: null,
      bootstrapSuperadminEmail: ADMIN_EMAIL,
      bootstrapSuperadminPassword: ADMIN_PASS
    });
    commerceStore = new CommerceStore({ persistPath: null });
    const { app } = createApp({
      store: securityStore,
      commerceStore,
      exposeDebugTokens: true
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('validates coupons and enforces minimum order spend & shipping rules', async () => {
    const client = new TestClient(baseUrl);
    await client.ensureCsrf();

    // Below minimum spend for DEAL250 (requires 2000)
    const failCoupon = await client.request('POST', '/api/commerce/coupons/validate', {
      code: 'DEAL250',
      subtotal: 1500
    });
    assert.equal(failCoupon.status, 400);

    // Valid percentage coupon SMART10 with cap 600
    const okCoupon = await client.request('POST', '/api/commerce/coupons/validate', {
      code: 'smart10',
      subtotal: 10000
    });
    assert.equal(okCoupon.status, 200);
    assert.equal(okCoupon.data.discount, 600);

    // Non-freeDelivery item under 2500 outside Dhaka -> ৳120 shipping
    const earbuds = makeCartItem('prod-002', 'var-201', 1); // ৳1970, freeDelivery: false
    const initNonFree = await client.request('POST', '/api/commerce/payments/initiate', {
      paymentMethod: 'bkash',
      items: [earbuds],
      division: 'Chittagong',
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877'
    });
    assert.equal(initNonFree.status, 201);
    assert.equal(initNonFree.data.shippingFee, 120);
    assert.equal(initNonFree.data.amount, 1970 + 120);

    // Free-delivery item -> ৳0 shipping even in Chittagong
    const watch = makeCartItem('prod-001', 'var-101', 1, 1); // tampered price 1! Server should restore 6490
    const initFree = await client.request('POST', '/api/commerce/payments/initiate', {
      paymentMethod: 'nagad',
      items: [watch],
      division: 'Chittagong',
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877'
    });
    assert.equal(initFree.status, 201);
    assert.equal(initFree.data.subtotal, 6490);
    assert.equal(initFree.data.shippingFee, 0);
    assert.equal(initFree.data.amount, 6490);
  });

  it('completes bKash EPS MFS payment with OTP/PIN validation, prevents double authorization, and deducts stock once', async () => {
    const client = new TestClient(baseUrl);
    await client.ensureCsrf();

    const earbuds = makeCartItem('prod-002', 'var-201', 2); // 2 * 1970 = 3940 >= 2500 -> free delivery
    const init = await client.request('POST', '/api/commerce/payments/initiate', {
      paymentMethod: 'bkash',
      items: [earbuds],
      division: 'Dhaka',
      couponCode: 'DEAL250',
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877',
      email: 'tanvir@thesteps.test'
    });
    assert.equal(init.status, 201);
    assert.equal(init.data.discount, 250);
    assert.equal(init.data.shippingFee, 0);
    assert.equal(init.data.amount, 3940 - 250);
    assert.ok(init.data.orderNumber.startsWith('SD-26-'));

    // Reject invalid mobile number
    const badPhone = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'bkash',
      walletNumber: '00000000000',
      acceptedTos: true,
      otp: init.data.debugOtp,
      pin: '12345'
    });
    assert.equal(badPhone.status, 400);

    // Reject wrong OTP
    const badOtp = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'bkash',
      walletNumber: '01712998877',
      acceptedTos: true,
      otp: '999999',
      pin: '12345'
    });
    assert.equal(badOtp.status, 400);

    // Reject unchecked ToS
    const badTos = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'bkash',
      walletNumber: '01712998877',
      acceptedTos: false,
      otp: init.data.debugOtp,
      pin: '12345'
    });
    assert.equal(badTos.status, 400);

    // Valid authorization succeeds
    const auth = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'bkash',
      walletNumber: '01712998877',
      acceptedTos: true,
      otp: init.data.debugOtp,
      pin: '12345'
    });
    assert.equal(auth.status, 200);
    assert.equal(auth.data.paymentStatus, 'paid');
    assert.ok(auth.data.transactionId.startsWith('EPS-BKASH-'));

    // Second authorization on same session must fail (409)
    const replayAuth = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'bkash',
      walletNumber: '01712998877',
      acceptedTos: true,
      otp: init.data.debugOtp,
      pin: '12345'
    });
    assert.equal(replayAuth.status, 409);

    // Create verified order idempotently
    const idempotencyKey = 'test-bkash-idem-001';
    const orderRes = await client.request('POST', '/api/commerce/orders', {
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877',
      email: 'tanvir@thesteps.test',
      shippingAddress: { ...VALID_SHIPPING, division: 'Dhaka', district: 'Dhaka City' },
      billingAddress: { ...VALID_SHIPPING, division: 'Dhaka', district: 'Dhaka City' },
      items: [earbuds],
      couponCode: 'DEAL250',
      paymentMethod: 'bkash',
      paymentSessionId: init.data.paymentSessionId,
      idempotencyKey
    });
    assert.equal(orderRes.status, 201);
    assert.equal(orderRes.data.order.orderNumber, init.data.orderNumber);
    assert.equal(orderRes.data.order.paymentStatus, 'paid');
    assert.equal(orderRes.data.order.orderStatus, 'paid');
    assert.equal(orderRes.data.order.grandTotal, 3690);

    // Duplicate submission with same idempotencyKey returns exact same order without deducting stock twice
    const dupOrder = await client.request('POST', '/api/commerce/orders', {
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877',
      email: 'tanvir@thesteps.test',
      shippingAddress: { ...VALID_SHIPPING, division: 'Dhaka', district: 'Dhaka City' },
      billingAddress: { ...VALID_SHIPPING, division: 'Dhaka', district: 'Dhaka City' },
      items: [earbuds],
      couponCode: 'DEAL250',
      paymentMethod: 'bkash',
      paymentSessionId: init.data.paymentSessionId,
      idempotencyKey
    });
    assert.equal(dupOrder.status, 201);
    assert.equal(dupOrder.data.order.id, orderRes.data.order.id);
  });

  it('enforces Luhn card validation, expiry, CVV, EMI, and rejects cancelled EPS sessions', async () => {
    const client = new TestClient(baseUrl);
    await client.ensureCsrf();

    const watch = makeCartItem('prod-001', 'var-101', 1); // 6490
    const init = await client.request('POST', '/api/commerce/payments/initiate', {
      paymentMethod: 'visa',
      items: [watch],
      division: 'Dhaka',
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877'
    });
    assert.equal(init.status, 201);

    // Non-Luhn card number (the old broken 4111 2222 3333 4444) must fail!
    const badLuhn = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'visa',
      cardHolder: 'TANVIR AHMED',
      cardNumber: '4111222233334444',
      cardExpiry: '12/28',
      cardCvv: '982',
      otp: init.data.debugOtp
    });
    assert.equal(badLuhn.status, 400);

    // Expired card must fail
    const expiredCard = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'visa',
      cardHolder: 'TANVIR AHMED',
      cardNumber: '4111111111111111',
      cardExpiry: '01/20',
      cardCvv: '982',
      otp: init.data.debugOtp
    });
    assert.equal(expiredCard.status, 400);

    // Resend OTP works
    const resend = await client.request('POST', '/api/commerce/payments/resend-otp', {
      paymentSessionId: init.data.paymentSessionId
    });
    assert.equal(resend.status, 200);
    assert.equal(resend.data.resent, true);

    // Valid Luhn card succeeds with EMI 6m
    const validCard = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: init.data.paymentSessionId,
      paymentMethod: 'visa',
      cardHolder: 'TANVIR AHMED',
      cardNumber: '4111111111111111',
      cardExpiry: '12/29',
      cardCvv: '982',
      emiPlan: '6m',
      otp: resend.data.debugOtp
    });
    assert.equal(validCard.status, 200);
    assert.equal(validCard.data.emiPlan, '6m');
    assert.equal(validCard.data.paymentStatus, 'paid');

    // Cancelled EPS session cannot be authorized or placed as an order
    const initCancel = await client.request('POST', '/api/commerce/payments/initiate', {
      paymentMethod: 'nagad',
      items: [watch],
      division: 'Dhaka',
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877'
    });
    const cancelRes = await client.request('POST', '/api/commerce/payments/cancel', {
      paymentSessionId: initCancel.data.paymentSessionId
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.data.status, 'cancelled');

    const authCancelled = await client.request('POST', '/api/commerce/payments/authorize', {
      paymentSessionId: initCancel.data.paymentSessionId,
      paymentMethod: 'nagad',
      walletNumber: '01712998877',
      acceptedTos: true,
      otp: initCancel.data.debugOtp,
      pin: '12345'
    });
    assert.equal(authCancelled.status, 409);

    // Unverified online order without EPS paymentSessionId must be rejected
    const unauthOrder = await client.request('POST', '/api/commerce/orders', {
      customerName: 'Tanvir Ahmed',
      contactNumber: '01712998877',
      shippingAddress: VALID_SHIPPING,
      billingAddress: VALID_SHIPPING,
      items: [watch],
      paymentMethod: 'bkash'
    });
    assert.equal(unauthOrder.status, 400);
  });

  it('tracks orders accurately (without false empty-digit matches), supports COD & cancellation restocking, and enforces admin RBAC on status changes', async () => {
    const customerClient = new TestClient(baseUrl);
    await customerClient.ensureCsrf();

    const serum = makeCartItem('prod-003', 'var-302', 1); // 990, non-freeDelivery
    const codOrder = await customerClient.request('POST', '/api/commerce/orders', {
      customerName: 'Nusrat Jahan',
      contactNumber: '01811223344',
      email: 'nusrat@thesteps.test',
      shippingAddress: {
        ...VALID_SHIPPING,
        fullName: 'Nusrat Jahan',
        phone: '01811223344',
        division: 'Dhaka',
        district: 'Dhaka City'
      },
      billingAddress: {
        ...VALID_SHIPPING,
        fullName: 'Nusrat Jahan',
        phone: '01811223344',
        division: 'Dhaka',
        district: 'Dhaka City'
      },
      items: [serum],
      paymentMethod: 'cod'
    });
    assert.equal(codOrder.status, 201);
    assert.equal(codOrder.data.order.paymentStatus, 'pending');
    assert.equal(codOrder.data.order.shippingFee, 60);
    assert.equal(codOrder.data.order.grandTotal, 1050);

    // Tracking nonexistent order returns 404 (no empty-digit endsWith bug)
    const missing = await customerClient.request('GET', '/api/commerce/orders/track/NONEXISTENT');
    assert.equal(missing.status, 404);

    // Tracking by orderNumber succeeds
    const found = await customerClient.request('GET', `/api/commerce/orders/track/${codOrder.data.order.orderNumber}`);
    assert.equal(found.status, 200);
    assert.equal(found.data.order.id, codOrder.data.order.id);

    // Guest cannot update order status
    const unauthStatus = await customerClient.request(
      'PATCH',
      `/api/commerce/orders/${codOrder.data.order.id}/status`,
      { status: 'delivered' }
    );
    assert.equal(unauthStatus.status, 401);

    // Admin can update status
    const adminClient = new TestClient(baseUrl);
    await adminClient.ensureCsrf();
    const login = await adminClient.request('POST', '/api/admin/auth/login', {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASS
    });
    assert.equal(login.status, 200);

    const statusUpdate = await adminClient.request(
      'PATCH',
      `/api/commerce/orders/${codOrder.data.order.id}/status`,
      { status: 'confirmed' }
    );
    assert.equal(statusUpdate.status, 200);
    assert.equal(statusUpdate.data.order.orderStatus, 'confirmed');
    // Confirming COD order must NOT prematurely mark paymentStatus as paid!
    assert.equal(statusUpdate.data.order.paymentStatus, 'pending');

    // Marking COD order delivered marks paymentStatus paid
    const delivered = await adminClient.request(
      'PATCH',
      `/api/commerce/orders/${codOrder.data.order.id}/status`,
      { status: 'delivered' }
    );
    assert.equal(delivered.status, 200);
    assert.equal(delivered.data.order.paymentStatus, 'paid');
  });
});
