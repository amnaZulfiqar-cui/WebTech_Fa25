const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { applyDiscount, validateDiscount } = require('../middleware/discountMiddleware');

// Apply discount middleware to order routes
router.use(applyDiscount);
router.use(validateDiscount);

// GET /order/preview - Order preview page
router.get('/preview', (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        req.flash('error', 'Your cart is empty. Add some products first.');
        return res.redirect('/products');
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const tax = subtotal * 0.08; // 8% tax

    // Apply discount if any
    let discount = 0;
    let discountCode = '';

    if (req.session.discountApplied) {
        discount = req.session.discountValue || 0;
        discountCode = req.session.discountCode || '';
    }

    const total = Math.max(0, subtotal + shipping + tax - discount);

    res.render('orders/preview', {
        title: 'Order Preview',
        cart,
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        discountCode,
        couponMessage: req.session.couponMessage || '',
        cartCount: cart.reduce((total, item) => total + item.quantity, 0)
    });
});

// POST /order/place - Place order
router.post('/place', async (req, res) => {
    try {
        const cart = req.session.cart;
        const {
            email,
            name,
            street,
            city,
            state,
            zipCode,
            country,
            paymentMethod,
            notes
        } = req.body;

        // Validation
        if (!cart || cart.length === 0) {
            req.flash('error', 'Your cart is empty.');
            return res.redirect('/cart');
        }

        if (!email || !email.includes('@')) {
            req.flash('error', 'Please enter a valid email address.');
            return res.redirect('/order/preview');
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;

        // Apply discount
        let discount = 0;
        let discountCode = '';

        if (req.session.discountApplied) {
            discount = req.session.discountValue || 0;
            discountCode = req.session.discountCode || '';
        }

        const total = Math.max(0, subtotal + shipping + tax - discount);

        // Prepare order items
        const orderItems = [];
        for (const cartItem of cart) {
            const product = await Product.findById(cartItem.productId);

            if (!product) {
                req.flash('error', `Product "${cartItem.name}" is no longer available.`);
                return res.redirect('/cart');
            }

            if (product.stock < cartItem.quantity) {
                req.flash('error', `Insufficient stock for "${product.name}". Only ${product.stock} available.`);
                return res.redirect('/cart');
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                subtotal: product.price * cartItem.quantity
            });

            // Update product stock
            product.stock -= cartItem.quantity;
            await product.save();
        }

        // Create order
        const order = new Order({
            customerEmail: email.toLowerCase(),
            customerName: name || '',
            items: orderItems,
            subtotal,
            shipping,
            tax,
            discount,
            discountCode,
            total,
            paymentMethod: paymentMethod || 'Credit Card',
            shippingAddress: {
                street: street || '',
                city: city || '',
                state: state || '',
                zipCode: zipCode || '',
                country: country || ''
            },
            notes: notes || '',
            status: 'Placed'
        });

        await order.save();

        // Clear cart and discount from session
        req.session.cart = [];
        delete req.session.discountApplied;
        delete req.session.discountCode;
        delete req.session.discountValue;
        delete req.session.discountType;
        delete req.session.couponMessage;

        // Set success message
        req.session.orderSuccess = {
            orderId: order.orderId,
            total: order.total,
            email: order.customerEmail
        };

        // Redirect to success page
        res.redirect(`/order/success/${order._id}`);

    } catch (error) {
        console.error('Error placing order:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            req.flash('error', messages.join(', '));
            return res.redirect('/order/preview');
        }

        req.flash('error', 'Failed to place order. Please try again.');
        res.redirect('/order/preview');
    }
});

// GET /order/success/:id - Order success page
router.get('/success/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/');
        }

        // Clear success message from session
        const successData = req.session.orderSuccess;
        delete req.session.orderSuccess;

        res.render('orders/success', {
            title: 'Order Confirmed',
            order,
            successData,
            cartCount: 0 // Cart is empty after order
        });

    } catch (error) {
        console.error('Error loading order success:', error);
        req.flash('error', 'Failed to load order confirmation.');
        res.redirect('/');
    }
});

// GET /order/my-orders - Order history page
router.get('/my-orders', (req, res) => {
    res.render('orders/history', {
        title: 'My Orders',
        email: '',
        orders: null,
        error: null,
        cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
    });
});

// POST /order/my-orders - Search orders by email
router.post('/my-orders', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.render('orders/history', {
                title: 'My Orders',
                email: '',
                orders: null,
                error: 'Please enter a valid email address.',
                cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
            });
        }

        const orders = await Order.findByEmail(email);

        res.render('orders/history', {
            title: 'My Orders',
            email,
            orders,
            error: orders.length === 0 ? `No orders found for email: ${email}` : null,
            cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.render('orders/history', {
            title: 'My Orders',
            email: req.body.email || '',
            orders: null,
            error: 'Failed to fetch orders. Please try again.',
            cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
        });
    }
});

// GET /order/:id - View specific order details
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.productId');

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/order/my-orders');
        }

        res.render('orders/details', {
            title: `Order ${order.orderId}`,
            order,
            cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0
        });

    } catch (error) {
        console.error('Error fetching order:', error);

        if (error.kind === 'ObjectId') {
            req.flash('error', 'Invalid order ID.');
            return res.redirect('/order/my-orders');
        }

        req.flash('error', 'Failed to load order details.');
        res.redirect('/order/my-orders');
    }
});

// POST /order/:id/cancel - Cancel order
router.post('/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/order/my-orders');
        }

        // Only allow cancellation if order is still placed
        if (order.status !== 'Placed') {
            req.flash('error', 'Cannot cancel order. Order is already being processed.');
            return res.redirect(`/order/${order._id}`);
        }

        order.status = 'Cancelled';
        await order.save();

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        req.flash('success', 'Order cancelled successfully.');
        res.redirect(`/order/${order._id}`);

    } catch (error) {
        console.error('Error cancelling order:', error);
        req.flash('error', 'Failed to cancel order.');
        res.redirect(`/order/${req.params.id}`);
    }
});

module.exports = router;