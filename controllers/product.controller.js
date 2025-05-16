import Product from "../models/product.model.js"; // Import the Product model
import {redis} from "../lib/redis.js"
import cloudinary from "../lib/cloudinary.js"; // Import Cloudinary for image upload


// Controller to get all products from the database
// This function is called when the admin wants to view all products in the database
// It first checks if the products are cached in Redis, if not, it fetches them from MongoDB and caches them
export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({}); // find all products
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


// Controller to get featured products from the database
// This function is called to get products that are marked as featured
// It first checks if the featured products are cached in Redis, if not, it fetches them from MongoDB and caches them
export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featuredProducts"); // Check if featured products are cached

		if(featuredProducts) {
			featuredProducts = JSON.parse(featuredProducts); // Parse the cached data
		}

		// if not in redis, fetch from mongodb
		// .lean is used to get a plain javascript object instead of a mongoose document
		featuredProducts = await Product.find({ isFeatured: true }).lean();
		if(!featuredProducts) {
			return res.status(404).json({ message: "No featured products found" });
		}

		// store in redis for future quick access
		await redis.set("featuredProducts", JSON.stringify(featuredProducts), "EX", 60 * 60); // Cache for 1 hour


	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}


//for creating a new product and uploading image to cloudinary
// This function is called when a new product is created in the database
// It first checks if the image is provided, then uploads it to Cloudinary, and finally creates a new product in the database
export const createProduct = async (req, res) => {
	try {
		const { name, price, description, image,category } = req.body; // Destructure the request body


		let cloudinaryResponse = null;

		if (image) {
			// Upload image to Cloudinary if provided
			cloudinaryResponse = await cloudinary.uploader.upload(image, {
				folder: "products", // Specify the folder in Cloudinary
			});
		}

		// Create a new product instance
		const newProduct = new Product({
			name,
			price,
			description,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "", // Use the secure URL from Cloudinary response
			category,
		});

		await newProduct.save(); // Save the product to the database

		res.status(201).json({ message: "Product created successfully", product: newProduct });
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


// Controller to delete a product by ID
// This function is called when a product is deleted from the database
// It first checks if the product exists, then deletes the image from Cloudinary if it exists, and finally deletes the product from the database
export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];// Extract the public ID from the image URL
			// Delete the image from Cloudinary using the public ID
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloudinary");
			} catch (error) {
				console.log("error deleting image from cloudinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Controller to get recommended products from the database
// This function is called to get a random sample of 4 products from the database
export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Controller to get products by category from the database
// This function is called to get products that belong to a specific category
export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Function to update the featured products cache in Redis
// This function is called after toggling the featured status of a product
// to ensure that the cache is always up-to-date with the latest featured products
// This function is called after toggling the featured status of a product
export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Function to update the featured products cache in Redis
// This function is called after toggling the featured status of a product
// to ensure that the cache is always up-to-date with the latest featured products
// This function is called after toggling the featured status of a product
async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}



// Function to edit a product by ID
// This function is called when a product is edited in the database
// It first checks if the product exists, then updates the image in Cloudinary if it exists, and finally updates the product in the database
export const editProduct = async (req, res)=>{
	try {
		const {id} = req.params;
		const {name, price, description, image, category} = req.body; // Destructure the request body
		
		//fetch the existing product from the database
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		//if a new image is provided, upload it to cloudinary and update the product image
		if(image && image !== product.image) {
			// Delete the old image from Cloudinary if it exists
			if (product.image) {
				const publicId = product.image.split("/").pop().split(".")[0]; // Extract the public ID from the image URL
				try {
					await cloudinary.uploader.destroy(`products/${publicId}`); // Delete the old image from Cloudinary
					console.log("deleted old image from cloudinary");
				} catch (error) {
					console.log("error deleting old image from cloudinary", error);
				}
			}

			// Upload the new image to Cloudinary
			const cloudinaryResponse = await cloudinary.uploader.upload(image, {
				folder: "products", // Specify the folder in Cloudinary
			});
			product.image = cloudinaryResponse.secure_url; // Update the product image with the new URL
		}
		// Update the product fields with the new values
		product.name = name || product.name; // Update the product name if provided, otherwise keep the existing name
		product.price = price || product.price; // Update the product price if provided, otherwise keep the existing price	
		product.description = description || product.description; // Update the product description if provided, otherwise keep the existing description
		product.category = category || product.category; // Update the product category if provided, otherwise keep the existing category

		const updatedProduct = await product.save(); // Save the updated product to the database

		//if the product is featured, update the cache
		await updateFeaturedProductsCache(); // Update the featured products cache in Redis
		res.json({ message: "Product updated successfully", product: updatedProduct }); // Send the updated product as a response

	} catch (error) {
		console.log("Error in editProduct controller", error.message); // Log the error message
		res.status(500).json({ message: "Server error", error: error.message }); // Send a server error response
		
	}
}