const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stripeCustomerId: {
    type: String,
    required: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
  },
  priceId: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productDescription: {
    type: String,
  },
  status: {
    type: String,
    required: true,
  },
  current_period_start: {
    type: Number, // Storing as Unix timestamp
    required: true,
  },
  current_period_end: {
    type: Number, // Storing as Unix timestamp
    required: true,
  },
  canceled_at_period_end: {
    type: Boolean,
    default: false,
  },
  canceled_at: {
    type: Date,
  },
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
