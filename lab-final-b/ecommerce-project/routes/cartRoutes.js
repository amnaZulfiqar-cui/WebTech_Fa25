const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Initialize cart middleware for this router
router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});

// GET /cart - View cart
router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5.99 : 0; // Free shipping over $50 could be added
    const tax = subtotal * 0.08; // 8% tax example
    const total = subtotal + shipping + tax;

    res.render('cart/index', {
        title: 'Shopping Cart',
        cart,
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        cartCount: cart.reduce((total, item) => total + item.quantity, 0),
        isEmpty: cart.length === 0
    });
});

// POST /cart/add/:id - Add item to cart
router.post('/add/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/products');
        }

        if (product.stock < 1) {
            req.flash('error', 'This product is out of stock.');
            return res.redirect(`/products/${product._id}`);
        }

        const quantity = parseInt(req.body.quantity) || 1;

        if (quantity < 1) {
            req.flash('error', 'Quantity must be at least 1.');
            return res.redirect(`/products/${product._id}`);
        }

        if (product.stock < quantity) {
            req.flash('error', `Only ${product.stock} items available in stock.`);
            return res.redirect(`/products/${product._id}`);
        }

        const cart = req.session.cart;
        const existingItemIndex = cart.findIndex(item =>
            item.productId.toString() === product._id.toString()
        );

        if (existingItemIndex > -1) {
            // Update existing item quantity
            const newQuantity = cart[existingItemIndex].quantity + quantity;

            if (newQuantity > product.stock) {
                req.flash('error', `Cannot add more than ${product.stock} items.`);
                return res.redirect(`/products/${product._id}`);
            }

            cart[existingItemIndex].quantity = newQuantity;
            req.flash('success', `Updated quantity for ${product.name}.`);
        } else {
            // Add new item to cart
            cart.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                maxStock: product.stock
            });
            req.flash('success', `${product.name} added to cart.`);
        }

        req.session.cart = cart;
        res.redirect('/cart');

    } catch (error) {
        console.error('Error adding to cart:', error);

        if (error.kind === 'ObjectId') {
            req.flash('error', 'Invalid product ID.');
            return res.redirect('/products');
        }

        req.flash('error', 'Failed to add item to cart.');
        res.redirect('/products');
    }
});

// POST /cart/update/:id - Update cart item quantity
router.post('/update/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const newQuantity = parseInt(req.body.quantity);

        if (!newQuantity || newQuantity < 1) {
            req.flash('error', 'Quantity must be at least 1.');
            return res.redirect('/cart');
        }

        // Check product stock
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/cart');
        }

        if (newQuantity > product.stock) {
            req.flash('error', `Only ${product.stock} items available in stock.`);
            return res.redirect('/cart');
        }

        const cart = req.session.cart;
        const itemIndex = cart.findIndex(item =>
            item.productId.toString() === productId.toString()
        );

        if (itemIndex === -1) {
            req.flash('error', 'Item not found in cart.');
            return res.redirect('/cart');
        }

        cart[itemIndex].quantity = newQuantity;
        req.session.cart = cart;

        req.flash('success', 'Cart updated successfully.');
        res.redirect('/cart');

    } catch (error) {
        console.error('Error updating cart:', error);
        req.flash('error', 'Failed to update cart.');
        res.redirect('/cart');
    }
});

// GET /cart/remove/:id - Remove item from cart
router.get('/remove/:id', (req, res) => {
    const cart = req.session.cart;
    const itemIndex = cart.findIndex(item =>
        item.productId.toString() === req.params.id.toString()
    );

    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        req.session.cart = cart;

        req.flash('success', `${removedItem.name} removed from cart.`);
    } else {
        req.flash('error', 'Item not found in cart.');
    }

    res.redirect('/cart');
});

// POST /cart/clear - Clear entire cart
router.post('/clear', (req, res) => {
    req.session.cart = [];
    req.flash('success', 'Cart cleared successfully.');
    res.redirect('/cart');
});

// GET /cart/checkout - Redirect to order preview
router.get('/checkout', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        req.flash('error', 'Your cart is empty.');
        return res.redirect('/cart');
    }

    res.redirect('/order/preview');
});

// GET /cart/count - API endpoint to get cart count (for AJAX)
router.get('/count', (req, res) => {
    const count = req.session.cart ?
        req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;

    res.json({ count });
});

// GET /cart/total - API endpoint to get cart total (for AJAX)
router.get('/total', (req, res) => {
    const cart = req.session.cart || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    res.json({
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
    });
});

module.exports = router;