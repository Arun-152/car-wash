const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private (Customer)
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Verify booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Amount in paise (multiply by 100)
    const options = {
      amount: booking.totalAmount * 100, 
      currency: "INR",
      receipt: `receipt_order_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Create pending payment record
    const payment = await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: booking.totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: order.id
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify
// @access  Private (Customer)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is authentic
      // Update Payment Record
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          transactionId: razorpay_payment_id
        }
      );

      // Update Booking Record
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid'
      });

      return res.json({ message: "Payment verified successfully", success: true });
    } else {
      // Invalid signature
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: 'failed' }
      );
      
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'failed'
      });

      return res.status(400).json({ message: "Invalid payment signature", success: false });
    }
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
