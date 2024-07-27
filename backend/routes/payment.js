const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
require('dotenv').config();
const router = express.Router();

// Route for fetching price details
router.post('/fetch-price-details', async (req, res) => {
  const { priceId } = req.body;

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    res.json({
      name: price.product.name,
      description: price.product.description,
      price: price.unit_amount,
      currency: price.currency,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-payment-intent', auth, async (req, res) => {
  const { priceId, paymentMethodType, paymentMethodId} = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const price = await stripe.prices.retrieve(priceId);
    let paymentIntentDetails = {
      amount: price.unit_amount,
      currency: price.currency,
      payment_method_types: [paymentMethodType],
      customer: user.stripeCustomerId,
      metadata: {
        userId: req.user.id, // Include user ID in metadata
        paymentMethodId: paymentMethodId
      }
    }
    if (paymentMethodType === 'card' && paymentMethodType ==='ideal') {
      paymentIntentDetails.setup_future_usage = 'off_session';
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentDetails);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

router.post('/create-setup-intent', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.stripeCustomerId || user.stripeCustomerId.trim() === '') {
      return res.status(400).json({ msg: 'User does not have a valid Stripe customer ID' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['sepa_debit'],
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
