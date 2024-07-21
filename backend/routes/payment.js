const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);;
const User = require('../models/User');
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
  
  // Route for creating a payment intent
  router.post('/create-payment-intent', auth, async (req, res) => {
    const { priceId } = req.body;
  
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      if (!user.stripeCustomerId || user.stripeCustomerId.trim() === '') {
        return res.status(400).json({ msg: 'User does not have a valid Stripe customer ID' });
      }
  
      const price = await stripe.prices.retrieve(priceId);
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price.unit_amount,
        currency: price.currency,
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
      });
  
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error('Server error:', err.message);
      res.status(500).send('Server error');
    }
  });

module.exports = router;