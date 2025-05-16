import crypto from 'crypto';
import dotenv from 'dotenv';
import Order from '../models/order.model.js';
import Coupon from '../models/coupon.model.js';
import axios from 'axios';

dotenv.config();

export const payStackWebhook = async (req, res) => {
  try {
    const payStackSignature = req.headers['x-payStack-signature'];
    const eventBody = JSON.stringify(req.body);

    // Generate hash using the secret key to validate the webhook
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(eventBody)
      .digest('hex');

    if (hash !== payStackSignature) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Check if the event is a charge success event
    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const email = event.data.email;
      const amount = event.data.amount / 100; // Convert to Naira

      const order = await Order.findOne({ paymentReference: reference });
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Update the order status to paid
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        status: event.data.status,
        email: email,
        amount: amount,
        transactionId: event.data.id, // Correct Paystack transaction ID
      };
      order.transactionDate = new Date(event.data.createdAt);
      order.orderStatus = 'processing'; // Set the order status to processing or any other status you prefer
      await order.save();

      console.log(`Order ${order._id} has been paid`);
    } else {
      console.log(`❗ Order not found for payment reference: ${reference}`);
    }

    // Optionally send an email to the user using Nodemailer or any other email service
    return res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Invalid or empty products array" });
        }

        let totalAmount = 0;

        const lineItems = products.map((product) => {
            const amount = Math.round(product.price * 100); // Convert price to kobo (Paystack works with kobo)
            totalAmount += amount * product.quantity;

            return {
                price_data: {
                    currency: "NGN",
                    product_data: {
                        name: product.name,
                        images: [product.image], // Assuming product has an image field
                    },
                    unit_amount: amount, // Price per item in kobo
                },
                quantity: product.quantity, // Quantity of the product
            };
        });

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
            if (coupon) {
                const discountAmount = Math.round((totalAmount * coupon.discountPercentage) / 100);
                totalAmount -= discountAmount; // Apply discount to the total
            }
        }

        // Paystack checkout creation
        const paystackData = {
            email: req.user.email, // Customer email
            amount: totalAmount, // Total amount after coupon (in kobo)
            reference: `order_${new Date().getTime()}`, // Unique reference for the transaction
            callback_url: `${process.env.CLIENT_URL}/purchase-success`, // URL where Paystack will send the user after payment
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                ),
            },
        };

        // Send request to Paystack API to create a payment page
        const paystackResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            paystackData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const paymentLink = paystackResponse.data.data.authorization_url;

        // After successful checkout, create the order
        const newOrder = new Order({
            user: req.user._id,
            products: products.map((product) => ({
                product: product._id,
                quantity: product.quantity,
                price: product.price,
            })),
            totalAmount: totalAmount / 100, // Convert back to Naira
            paystackReference: paystackResponse.data.data.reference,
        });

        await newOrder.save();

        res.status(200).json({ paymentLink }); // Return the Paystack payment link to the frontend

    } catch (error) {
        console.error("Error processing checkout:", error);
        res.status(500).json({ message: "Error processing checkout", error: error.message });
    }
};