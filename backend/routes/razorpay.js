import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/razorpayController.js';

const router = express.Router();

// Webhook — raw body, no auth
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected
router.use(authenticateToken);
router.post('/create-order', requireRole('donor'), createOrder);
router.post('/verify',       requireRole('donor'), verifyPayment);

export default router;
