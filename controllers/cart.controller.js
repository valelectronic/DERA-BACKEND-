
import Product from "../models/product.model.js";


// This file contains the controller functions for handling cart-related operations.
// It includes adding items to the cart, removing all items from the cart, updating item quantities, and retrieving cart products.
export const addToCart = async(req, res)=>{
    try {
		const { productId } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find((item) => item.id === productId);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
        
    }


// This function removes all items from the cart or a specific item based on the productId provided in the request body.
// It updates the user's cartItems array accordingly and saves the changes to the database.
export const removeAllFromCart = async(req,res)=>{
	try {
		const { productId } = req.body;
		const user = req.user;
		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter((item) => item.id !== productId);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

// This function updates the quantity of a specific item in the cart based on the productId provided in the request parameters.
// If the quantity is set to 0, it removes the item from the cart. Otherwise, it updates the quantity and saves the changes to the database.	

export const updateQuantity = async(req, res) =>{
    try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		// Check if the user is authenticated and has a cartItems array
		const existingItem = user.cartItems.find((item) => item.id === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const getCartProducts = async(req, res) =>{
	try {
		const products = await Product.find({ _id: { $in: req.user.cartItems } });

		// add quantity for each product
		const cartItems = products.map((product) => {
			const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
			return { ...product.toJSON(), quantity: item.quantity };
		});

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}