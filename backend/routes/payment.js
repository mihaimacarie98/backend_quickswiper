const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);;
require('dotenv').config();
const router = express.Router();

router.post('/fetch-price-details', async (req, res) => {
    const { priceId } = req.body;

    try {
      const price = await stripe.prices.retrieve(priceId);
      const product = await stripe.products.retrieve(price.product);
  
      res.json({
        name: product.name,
        description: product.description,
        price: price.unit_amount,
        currency: price.currency,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

router.post('/create-payment-intent', async (req, res) => {
    const { priceId } = req.body;

    try {
      const price = await stripe.prices.retrieve(priceId);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price.unit_amount,
        currency: price.currency,
        payment_method_types: ['card'],
      });
  
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

module.exports = router;