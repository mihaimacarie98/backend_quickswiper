const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

router.post('/create', auth, async (req, res) => {
  const { paymentMethodId, priceId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.stripeCustomerId || user.stripeCustomerId.trim() === '') {
      return res.status(400).json({ msg: 'User does not have a valid Stripe customer ID' });
    }

    // Attach the payment method to the Stripe customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set the default payment method on the customer
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Retrieve the price and product details
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });

    // Create a new subscription
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    const newSubscription = new Subscription({
      userId: user.id,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      priceId: price.id,
      price: price.unit_amount / 100, // Convert to dollars
      currency: price.currency,
      productName: price.product.name, // Include product name
      productDescription: price.product.description, // Include product description
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      canceled_at_period_end: subscription.cancel_at_period_end,
    });

    await newSubscription.save();
    res.json(newSubscription);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

// Route for fetching all subscriptions for the user
router.get('/subscriptions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const subscriptions = await Subscription.find({ userId: user._id });

    // Update the subscription status from Stripe
    for (let subscription of subscriptions) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      subscription.status = stripeSubscription.status;
      subscription.current_period_start = stripeSubscription.current_period_start;
      subscription.current_period_end = stripeSubscription.current_period_end;
      subscription.canceled_at_period_end = stripeSubscription.cancel_at_period_end;
      await subscription.save();
    }

    res.json(subscriptions.map(sub => ({
      ...sub._doc,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
    })));
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

// Route for cancelling a subscription
router.post('/cancel', auth, async (req, res) => {
  const { subscriptionId } = req.body;

  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    // Cancel the subscription at period end in Stripe
    const canceledSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update the subscription status in the database
    subscription.status = canceledSubscription.status;
    subscription.canceled_at_period_end = true;
    subscription.canceled_at = new Date(canceledSubscription.cancel_at * 1000); // Convert timestamp to Date
    await subscription.save();

    res.json({ msg: 'Subscription will be canceled at the end of the period', subscription });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

// router.get('/confirm-ideal-payment', async (req, res) => {
//   const { payment_intent_id, priceId } = req.query;
//   try {
//     const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

//     if (paymentIntent.status === 'succeeded') {
//       // Assuming you have a way to get the user based on the paymentIntent or a session
//       const user = await User.findById(paymentIntent.metadata.userId);
//       if (!user) {
//         return res.status(404).json({ msg: 'User not found' });
//       }

//       // Attach the payment method to the Stripe customer
//     await stripe.paymentMethods.attach(paymentIntent.payment_method, {
//       customer: user.stripeCustomerId,
//     });

//     // Set the default payment method on the customer
//     await stripe.customers.update(user.stripeCustomerId, {
//       invoice_settings: { default_payment_method: paymentIntent.payment_method },
//     });
//        // Retrieve the price and product details
//     const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });

//     // Create a new subscription
//     const subscription = await stripe.subscriptions.create({
//       customer: user.stripeCustomerId,
//       items: [{ price: priceId }],
//       expand: ['latest_invoice.payment_intent'],
//     });
    
//     const newSubscription = new Subscription({
//       userId: user.id,
//       stripeCustomerId: user.stripeCustomerId,
//       stripeSubscriptionId: subscription.id,
//       priceId: price.id,
//       price: price.unit_amount / 100, // Convert to dollars
//       currency: price.currency,
//       productName: price.product.name, // Include product name
//       productDescription: price.product.description, // Include product description
//       status: subscription.status,
//       current_period_start: subscription.current_period_start,
//       current_period_end: subscription.current_period_end,
//       canceled_at_period_end: subscription.cancel_at_period_end,
//     });
//       await newSubscription.save();
//       res.redirect('https://client.quickswiper.com/subscriptions'); // Redirect to subscriptions page after confirming payment
//     } else {
//       res.redirect('https://client.quickswiper.com/checkout?error=payment_failed');
//     }
//   } catch (err) {
//     console.error('Server error:', err.message);
//     res.status(500).send('Server error');
//   }
// });
module.exports = router;
