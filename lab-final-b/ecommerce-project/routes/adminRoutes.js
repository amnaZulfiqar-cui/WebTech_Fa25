const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Admin dashboard - view all orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('items.productId');

        res.render('admin/orders', {
            title: 'Admin - All Orders',
            orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Update order status
router.post('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Validate status transition
        const validTransitions = {
            'Placed': ['Processing'],
            'Processing': ['Delivered'],
            'Delivered': [] // No further transitions
        };

        if (!validTransitions[order.status].includes(status)) {
            return res.status(400).send('Invalid status transition');
        }

        order.status = status;
        order.updatedAt = Date.now();
        await order.save();

        res.redirect('/admin/orders');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Order details
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('admin/order-details', {
            title: `Order ${order.orderId}`,
            order
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;