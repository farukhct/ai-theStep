import { Router, type NextFunction, type Response } from 'express';
import { z } from 'zod';
import { CommerceStore } from '../data/commerceStore.ts';
import { SecurityStore } from '../data/securityStore.ts';
import {
  createAuthMiddleware,
  extractAccessToken,
  getClientIp,
  getUserAgent,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';
import { verifyJwt } from '../security/crypto.ts';
import type { OrderStatus, PaymentMethod } from '../../src/types/index.ts';

const PaymentMethodEnum = z.enum([
  'bkash',
  'nagad',
  'rocket',
  'ok_wallet',
  'meghna_pay',
  'sheba_pay',
  'islamic_wallet',
  'upay',
  'tap',
  'mcash',
  'visa',
  'mastercard',
  'amex',
  'dbbl_visa',
  'dbbl_master',
  'card',
  'southeast_bank',
  'meghna_bank',
  'islami_bank',
  'al_arafah_bank',
  'sonali',
  'bank_transfer',
  'cod'
]);

const CartItemSchema = z.object({
  productId: z.string().min(1).max(128),
  productName: z.string().min(1).max(200),
  variantId: z.string().min(1).max(128),
  variantSku: z.string().min(1).max(128),
  size: z.string().min(1).max(64),
  color: z.string().min(1).max(100),
  image: z.string().max(500_000).optional().default(''),
  regularPrice: z.number().nonnegative(),
  discountedPrice: z.number().positive(),
  purchasePrice: z.number().nonnegative().optional().default(0),
  quantity: z.number().int().min(1).max(100),
  maxStock: z.number().int().nonnegative().optional().default(999),
  freeDelivery: z.boolean().optional()
});

const AddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(24),
  altPhone: z.string().trim().max(24).optional(),
  email: z.string().trim().max(200).optional().default('customer@thesteps.com.bd'),
  division: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  upazila: z.string().trim().min(2).max(80),
  detailedAddress: z.string().trim().min(4).max(400),
  postcode: z.string().trim().max(20).optional(),
  deliveryNotes: z.string().trim().max(300).optional()
});

export interface CommerceRoutesOptions {
  exposeDebugTokens?: boolean;
}

export function createCommerceRoutes(
  securityStore: SecurityStore,
  commerceStore: CommerceStore,
  options: CommerceRoutesOptions = {}
): Router {
  const router = Router();
  const { authenticateUser, authenticateAdmin, requirePermission } = createAuthMiddleware(securityStore);
  const exposeOtp = options.exposeDebugTokens ?? process.env.NODE_ENV !== 'production';

  const attachOptionalUser = (req: AuthContextRequest, _res: Response, next: NextFunction): void => {
    const token = extractAccessToken(req);
    const claims = verifyJwt(token);
    if (claims && claims.type === 'access') {
      const session = securityStore.findSessionById(claims.sid);
      const user = session && !session.revokedAt ? securityStore.findUserById(claims.sub) : undefined;
      if (user && user.status === 'active') {
        req.authUser = user;
        req.authSession = session;
        req.authRoles = securityStore.getUserRoles(user.id);
        req.authPermissions = securityStore.getEffectivePermissions(user.id);
      }
    }
    next();
  };

  // Validate voucher against server rules
  router.post('/coupons/validate', validateCsrfToken, (req, res) => {
    const parsed = z
      .object({
        code: z.string().trim().min(2).max(40),
        subtotal: z.number().nonnegative()
      })
      .safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid voucher validation payload.' });
      return;
    }

    const result = commerceStore.validateCoupon(parsed.data.code, parsed.data.subtotal);
    if (!result.valid) {
      res.status(400).json({ error: 'INVALID_COUPON', message: result.error || 'Voucher is invalid.' });
      return;
    }
    res.json({ valid: true, coupon: result.coupon, discount: result.discount });
  });

  // Initiate EPS payment session (computes authoritative payable total & creates invoice SD-26-...)
  router.post('/payments/initiate', validateCsrfToken, attachOptionalUser, (req: AuthContextRequest, res) => {
    const schema = z.object({
      paymentMethod: PaymentMethodEnum,
      items: z.array(CartItemSchema).min(1).max(50),
      division: z.string().trim().min(2).max(60).default('Dhaka'),
      couponCode: z.string().trim().max(40).optional(),
      customerName: z.string().trim().min(2).max(120),
      contactNumber: z.string().trim().min(10).max(24),
      email: z.string().trim().max(200).optional().default('customer@thesteps.com.bd'),
      emiPlan: z.enum(['full', '3m', '6m', '12m']).optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid payment initiation details.',
        details: parsed.error.flatten()
      });
      return;
    }

    try {
      const session = commerceStore.initiatePaymentSession({
        userId: req.authUser?.id || 'guest-cust',
        paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        items: parsed.data.items,
        division: parsed.data.division,
        couponCode: parsed.data.couponCode,
        customerName: parsed.data.customerName,
        contactNumber: parsed.data.contactNumber,
        email: parsed.data.email,
        emiPlan: parsed.data.emiPlan
      });

      res.status(201).json({
        paymentSessionId: session.id,
        orderNumber: session.orderNumber,
        paymentMethod: session.paymentMethod,
        gatewayFlow: session.gatewayFlow,
        subtotal: session.subtotal,
        discount: session.discount,
        shippingFee: session.shippingFee,
        amount: session.amount,
        emiPlan: session.emiPlan,
        expiresAt: session.expiresAt,
        ...(exposeOtp ? { debugOtp: session.otpCode } : {})
      });
    } catch (err: any) {
      res.status(err.status || 400).json({
        error: err.code || 'PAYMENT_INITIATION_FAILED',
        message: err.message || 'Unable to initiate payment session.'
      });
    }
  });

  // Resend 6-digit verification OTP for active payment session
  router.post('/payments/resend-otp', validateCsrfToken, (req, res) => {
    const parsed = z.object({ paymentSessionId: z.string().min(5).max(100) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid payment session identifier.' });
      return;
    }
    try {
      const session = commerceStore.resendPaymentOtp(parsed.data.paymentSessionId);
      res.json({
        paymentSessionId: session.id,
        resent: true,
        ...(exposeOtp ? { debugOtp: session.otpCode } : {})
      });
    } catch (err: any) {
      res.status(err.status || 400).json({
        error: err.code || 'OTP_RESEND_FAILED',
        message: err.message || 'Could not resend OTP.'
      });
    }
  });

  // Authorize EPS payment session (MFS / Luhn Card + 3DS / iBanking / Corporate Bank Slip)
  router.post('/payments/authorize', validateCsrfToken, (req, res) => {
    const schema = z.object({
      paymentSessionId: z.string().min(5).max(100),
      paymentMethod: PaymentMethodEnum,
      walletNumber: z.string().max(24).optional(),
      acceptedTos: z.boolean().optional(),
      otp: z.string().max(12).optional(),
      pin: z.string().max(12).optional(),
      cardHolder: z.string().max(120).optional(),
      cardNumber: z.string().max(32).optional(),
      cardExpiry: z.string().max(10).optional(),
      cardCvv: z.string().max(6).optional(),
      emiPlan: z.enum(['full', '3m', '6m', '12m']).optional(),
      bankUserId: z.string().max(100).optional(),
      bankPass: z.string().max(100).optional(),
      bankRef: z.string().max(100).optional(),
      slipAttached: z.boolean().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid payment authorization payload.' });
      return;
    }

    try {
      const { session, paymentStatus } = commerceStore.authorizePaymentSession({
        sessionId: parsed.data.paymentSessionId,
        paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        walletNumber: parsed.data.walletNumber,
        acceptedTos: parsed.data.acceptedTos,
        otp: parsed.data.otp,
        pin: parsed.data.pin,
        cardHolder: parsed.data.cardHolder,
        cardNumber: parsed.data.cardNumber,
        cardExpiry: parsed.data.cardExpiry,
        cardCvv: parsed.data.cardCvv,
        emiPlan: parsed.data.emiPlan,
        bankUserId: parsed.data.bankUserId,
        bankPass: parsed.data.bankPass,
        bankRef: parsed.data.bankRef,
        slipAttached: parsed.data.slipAttached
      });

      res.json({
        paymentSessionId: session.id,
        orderNumber: session.orderNumber,
        transactionId: session.transactionId,
        paymentStatus,
        amount: session.amount,
        emiPlan: session.emiPlan,
        authorizedAt: session.authorizedAt
      });
    } catch (err: any) {
      res.status(err.status || 400).json({
        error: err.code || 'PAYMENT_AUTHORIZATION_FAILED',
        message: err.message || 'Payment authorization declined.'
      });
    }
  });

  // Cancel active EPS payment session cleanly
  router.post('/payments/cancel', validateCsrfToken, (req, res) => {
    const parsed = z.object({ paymentSessionId: z.string().min(5).max(100) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid payment session identifier.' });
      return;
    }
    const cancelled = commerceStore.cancelPaymentSession(parsed.data.paymentSessionId);
    res.json({ cancelled: Boolean(cancelled), status: cancelled?.status || 'not_found' });
  });

  // Create order (verifies EPS session or COD, recomputes totals, deducts stock idempotently)
  router.post('/orders', validateCsrfToken, attachOptionalUser, (req: AuthContextRequest, res) => {
    const schema = z.object({
      customerName: z.string().trim().min(2).max(120),
      contactNumber: z.string().trim().min(10).max(24),
      email: z.string().trim().max(200).optional().default('customer@thesteps.com.bd'),
      shippingAddress: AddressSchema,
      billingAddress: AddressSchema,
      items: z.array(CartItemSchema).min(1).max(50),
      couponCode: z.string().trim().max(40).optional(),
      paymentMethod: PaymentMethodEnum,
      paymentSessionId: z.string().max(100).optional(),
      transactionId: z.string().max(100).optional(),
      remarks: z.string().max(400).optional(),
      idempotencyKey: z.string().max(120).optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid order details.',
        details: parsed.error.flatten()
      });
      return;
    }

    try {
      const order = commerceStore.createOrder({
        userId: req.authUser?.id || 'guest-cust',
        customerName: parsed.data.customerName,
        contactNumber: parsed.data.contactNumber,
        email: parsed.data.email,
        shippingAddress: parsed.data.shippingAddress,
        billingAddress: parsed.data.billingAddress,
        items: parsed.data.items,
        couponCode: parsed.data.couponCode,
        paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        paymentSessionId: parsed.data.paymentSessionId,
        transactionId: parsed.data.transactionId,
        remarks: parsed.data.remarks,
        idempotencyKey: parsed.data.idempotencyKey
      });

      securityStore.recordAuditLog({
        userId: req.authUser?.id || null,
        action: 'ORDER_CREATED',
        module: 'Checkout',
        targetRecordId: order.orderNumber,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success',
        additionalContext: `Order ${order.orderNumber} placed (${order.paymentMethod}, ${order.paymentStatus}) total ৳${order.grandTotal}`
      });

      res.status(201).json({ order });
    } catch (err: any) {
      res.status(err.status || 400).json({
        error: err.code || 'ORDER_CREATION_FAILED',
        message: err.message || 'Unable to create order.'
      });
    }
  });

  // Get authenticated user's order history
  router.get('/orders/mine', authenticateUser, (req: AuthContextRequest, res) => {
    const orders = commerceStore.listOrdersForUser(
      req.authUser!.id,
      req.authUser!.email,
      req.authUser!.phoneNumber
    );
    res.json({ orders });
  });

  // Public order tracking lookup
  router.get('/orders/track/:query', (req, res) => {
    const rawQuery = String(req.params.query || '');
    const order = commerceStore.trackOrder(rawQuery);
    if (!order) {
      res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'No matching order found.' });
      return;
    }
    res.json({ order });
  });

  // Admin status update
  router.patch(
    '/orders/:id/status',
    validateCsrfToken,
    authenticateAdmin,
    requirePermission('orders.manage'),
    (req: AuthContextRequest, res) => {
      const parsed = z
        .object({
          status: z.enum([
            'pending_payment',
            'paid',
            'confirmed',
            'processing',
            'packed',
            'shipped',
            'delivered',
            'cancelled',
            'returned',
            'refunded'
          ]),
          note: z.string().max(300).optional()
        })
        .safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid order status.' });
        return;
      }

      try {
        const order = commerceStore.updateOrderStatus(
          req.params.id,
          parsed.data.status as OrderStatus,
          req.authUser!.fullName || req.authUser!.email,
          parsed.data.note
        );
        res.json({ order });
      } catch (err: any) {
        res.status(err.status || 400).json({ error: err.code || 'ORDER_UPDATE_FAILED', message: err.message });
      }
    }
  );

  // Cancel order (owner or admin with orders.manage)
  router.post('/orders/:id/cancel', validateCsrfToken, attachOptionalUser, (req: AuthContextRequest, res) => {
    const parsed = z
      .object({
        reason: z.string().trim().min(2).max(300).default('Cancelled by requester')
      })
      .safeParse(req.body || {});

    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid cancellation request.' });
      return;
    }

    const order = commerceStore.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'Order not found.' });
      return;
    }

    const isAdminUpdater = Boolean(
      req.authSession?.isAdminSession && req.authPermissions?.includes('orders.manage')
    );
    const isOrderOwner = Boolean(
      req.authUser &&
        (order.customerId === req.authUser.id ||
          order.email.toLowerCase() === req.authUser.email.toLowerCase())
    );

    if (!isAdminUpdater && !isOrderOwner && order.customerId !== 'guest-cust') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You are not authorized to cancel this order.'
      });
      return;
    }

    try {
      const cancelled = commerceStore.cancelOrder(
        order.id,
        parsed.data.reason,
        req.authUser?.fullName || req.authUser?.email || 'Customer'
      );
      res.json({ order: cancelled });
    } catch (err: any) {
      res.status(err.status || 400).json({ error: err.code || 'CANCEL_FAILED', message: err.message });
    }
  });

  return router;
}
