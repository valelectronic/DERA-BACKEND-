import axios from "axios";

// POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ status: "failed", message: "Missing payment reference" });
  }

  try {
    const response = await axios.post(
  "https://api.paystack.co/transaction/initialize",
  {
    email: customerDetails.email,
    amount: totalAmount,
    callback_url: "http://localhost:3000/purchase-success",
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  }
);

    const data = response.data.data;

    if (data.status === "success") {
      return res.status(200).json({ status: "success", data });
    } else {
      return res.status(400).json({ status: "failed", message: "Payment was not successful" });
    }
  } catch (error) {
    console.error("Paystack verification error:", error.message);
    return res.status(500).json({ status: "error", message: "Verification failed" });
  }
};
