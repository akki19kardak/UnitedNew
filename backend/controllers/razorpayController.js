import Razorpay from 'razorpay';
import crypto from 'crypto';
import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/razorpay/create-order ──────────────────────────
export const createOrder = async (req, res) => {
  try {
    const { campaignId, amount, donorMessage, isAnonymous } = req.body;

    if (!campaignId || !amount || amount < 1) {
      return res.status(400).json({ message: 'campaignId and amount are required' });
    }

    // ✅ Fetch campaign from MongoDB
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status !== 'active') return res.status(400).json({ message: 'Campaign is not active' });

    const amountPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        campaignId,
        donorId: req.user.uid,
        donorMessage: donorMessage || '',
        isAnonymous: isAnonymous ? 'true' : 'false',
      },
    });

    // ✅ Save pending donation to MongoDB
    const donation = await Donation.create({
      donorId: req.user.uid,
      donorName: isAnonymous ? 'Anonymous' : `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      donorEmail: req.user.email,
      isAnonymous: isAnonymous || false,
      donorMessage: donorMessage || '',
      campaignId,
      ngoId: campaign.ngoId || '',
      amount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      razorpayOrderId: order.id,
      status: 'pending',
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donationId: donation._id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// ── POST /api/razorpay/verify ────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: invalid signature' });
    }

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        status: 'completed',
        transactionId: razorpay_payment_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    if (!donation) return res.status(404).json({ message: 'Donation record not found' });

    // ✅ Update campaign currentAmount in MongoDB
    await Campaign.findByIdAndUpdate(donation.campaignId, {
      $inc: { currentAmount: donation.amount }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      transactionId: razorpay_payment_id,
      donationId: donation._id,
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// ── POST /api/razorpay/webhook ───────────────────────────────
export const handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body; // raw Buffer

    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { event, payload } = JSON.parse(body.toString());
    const payment = payload.payment.entity;

    const donation = await Donation.findOne({ razorpayOrderId: payment.order_id });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (event === 'payment.captured' && donation.status !== 'completed') {
      await Donation.findByIdAndUpdate(donation._id, {
        status: 'completed',
        transactionId: payment.id,
        razorpayPaymentId: payment.id,
      });

      // ✅ MongoDB atomic increment
      await Campaign.findByIdAndUpdate(donation.campaignId, {
        $inc: { currentAmount: donation.amount }
      });
    }

    if (event === 'payment.failed') {
      await Donation.findByIdAndUpdate(donation._id, { status: 'failed' });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
