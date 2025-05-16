import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    }, 
	// for the payment method we will use paystack
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paymentReference: {
      type: String,
      unique: true,
    },
	paymentResult: {
		status: {
		  type: String,
		  enum: ['success', 'failure'],
		},
		email: {
		  type: String,
		  required: true,
		},
		amount: {
		  type: Number,
		  required: true,
		  min: 0,
		},
		transactionId: { // To track the Paystack or other gateway transaction ID
		  type: String,
		},
	  },
	  // Additional fields to store payment processing information
	  transactionDate: {
		type: Date,
	  },
	      // Optional: Add a field for tracking order fulfillment
		  orderStatus: {
			type: String,
			enum: ['pending', 'processing', 'completed', 'shipped', 'cancelled'],
			default: 'pending',
		  },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
