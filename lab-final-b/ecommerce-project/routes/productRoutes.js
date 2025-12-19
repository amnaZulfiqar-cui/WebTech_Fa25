const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /products - Display all products
router.get('/products', async (req, res) => {
    try {
        const { category, search, sort, minPrice, maxPrice } = req.query;

        // Build query
        let query = {};

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Build sort options
        let sortOption = {};
        switch (sort) {
            case 'price-low':
                sortOption = { price: 1 };
                break;
            case 'price-high':
                sortOption = { price: -1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'name':
                sortOption = { name: 1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        // Get products
        const products = await Product.find(query)
            .sort(sortOption)
            .limit(50);

        // Get unique categories for filter
        const categories = await Product.distinct('category');

        // Get featured products
        const featuredProducts = await Product.find({ featured: true }).limit(3);

        res.render('products/index', {
            title: 'All Products',
            products,
            categories,
            featuredProducts,
            currentCategory: category,
            currentSearch: search,
            currentSort: sort,
            currentMinPrice: minPrice,
            currentMaxPrice: maxPrice,
            cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            error: 'Failed to load products. Please try again later.'
        });
    }
});

// GET /products/:id - Display single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).render('404', {
                title: 'Product Not Found',
                message: 'The product you are looking for does not exist.'
            });
        }

        // Get related products (same category)
        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            category: product.category
        }).limit(4);

        res.render('products/show', {
            title: product.name,
            product,
            relatedProducts,
            cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
        });

    } catch (error) {
        console.error('Error fetching product:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).render('404', {
                title: 'Product Not Found',
                message: 'Invalid product ID.'
            });
        }

        res.status(500).render('error', {
            title: 'Server Error',
            error: 'Failed to load product details. Please try again later.'
        });
    }
});

// POST /products/:id/review - Add review to product
router.post('/products/:id/review', async (req, res) => {
    try {
        const { rating, comment, name } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Add review (you would need to add reviews field to Product schema)
        // product.reviews.push({
        //     rating: parseInt(rating),
        //     comment,
        //     name: name || 'Anonymous',
        //     date: new Date()
        // });

        // await product.save();

        req.flash('success', 'Review added successfully!');
        res.redirect(`/products/${req.params.id}`);

    } catch (error) {
        console.error('Error adding review:', error);
        req.flash('error', 'Failed to add review.');
        res.redirect(`/products/${req.params.id}`);
    }
});

// GET /categories/:category - Get products by category
router.get('/categories/:category', async (req, res) => {
    try {
        const products = await Product.findByCategory(req.params.category);

        res.render('products/category', {
            title: `${req.params.category} Products`,
            category: req.params.category,
            products,
            cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
        });

    } catch (error) {
        console.error('Error fetching category products:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            error: 'Failed to load category products.'
        });
    }
});

module.exports = router;