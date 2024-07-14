const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const router = express.Router();

router.get('/:priceId', async (req, res) => {
  const { priceId } = req.params;

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const productDetails = {
      name: price.product.name,
      description: price.product.description,
      price: price.unit_amount,
      currency: price.currency,
    };
    res.json(productDetails);
  } catch (err) {
    console.error('Error fetching product details:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
