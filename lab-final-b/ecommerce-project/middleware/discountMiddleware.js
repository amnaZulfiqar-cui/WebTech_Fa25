/**
 * Discount middleware for applying coupon codes
 */
const applyDiscount = (req, res, next) => {
    // Get coupon code from query or body
    const coupon = (req.query.coupon || req.body.coupon || '').toUpperCase().trim();

    // If no coupon provided or coupon is empty, clear any existing discount
    if (!coupon) {
        if (req.session.discountApplied) {
            delete req.session.discountApplied;
            delete req.session.discountCode;
            delete req.session.discountAmount;
            delete req.session.discountValue;
        }
        return next();
    }

    // Define valid coupons and their discounts
    const validCoupons = {
        'SAVE10': 0.10,      // 10% off
        'WELCOME15': 0.15,   // 15% off for new customers
        'FREESHIP': 'free-shipping', // Free shipping
        'HOLIDAY25': 0.25    // 25% off for holidays
    };

    // Check if coupon is valid
    if (validCoupons.hasOwnProperty(coupon)) {
        const discount = validCoupons[coupon];

        // Apply discount based on type
        if (typeof discount === 'number') {
            // Percentage discount
            req.session.discountApplied = true;
            req.session.discountCode = coupon;
            req.session.discountAmount = discount; // Percentage as decimal
            req.session.discountType = 'percentage';

            // Calculate discount value
            if (req.session.cart && req.session.cart.length > 0) {
                const subtotal = req.session.cart.reduce((sum, item) =>
                    sum + (item.price * item.quantity), 0);
                req.session.discountValue = subtotal * discount;
            }
        } else if (discount === 'free-shipping') {
            // Free shipping discount
            req.session.discountApplied = true;
            req.session.discountCode = coupon;
            req.session.discountType = 'free-shipping';
            req.session.discountValue = 5.99; // Example shipping cost
        }

        req.session.couponMessage = `Coupon "${coupon}" applied successfully!`;
    } else {
        // Invalid coupon
        if (req.session.discountApplied) {
            delete req.session.discountApplied;
            delete req.session.discountCode;
            delete req.session.discountAmount;
            delete req.session.discountValue;
            delete req.session.discountType;
        }

        req.session.couponMessage = `Invalid coupon code: "${coupon}". Please try again.`;
    }

    // Calculate cart totals for response locals
    if (req.session.cart && req.session.cart.length > 0) {
        const subtotal = req.session.cart.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0);

        let discount = 0;
        let shipping = 5.99; // Default shipping cost

        if (req.session.discountApplied) {
            if (req.session.discountType === 'percentage') {
                discount = subtotal * req.session.discountAmount;
            } else if (req.session.discountType === 'free-shipping') {
                discount = req.session.discountValue;
                shipping = 0;
            }
        }

        const total = subtotal + shipping - discount;

        // Make available in views
        res.locals.cartSubtotal = subtotal;
        res.locals.cartShipping = shipping;
        res.locals.cartDiscount = discount;
        res.locals.cartTotal = total;
        res.locals.discountCode = req.session.discountCode;
        res.locals.couponMessage = req.session.couponMessage;
    }

    next();
};

/**
 * Middleware to validate discount before order placement
 */
const validateDiscount = (req, res, next) => {
    if (req.session.discountApplied) {
        // Check if discount is still valid (e.g., hasn't expired)
        // This is where you could add expiration checks, usage limits, etc.
        const coupon = req.session.discountCode;

        // Example: Check if coupon is expired (hardcoded for demo)
        const expiredCoupons = ['HOLIDAY2023']; // Example expired coupon
        if (expiredCoupons.includes(coupon)) {
            delete req.session.discountApplied;
            delete req.session.discountCode;
            delete req.session.discountAmount;
            delete req.session.discountValue;
            delete req.session.discountType;

            req.session.couponMessage = `Coupon "${coupon}" has expired.`;
        }
    }

    next();
};

module.exports = {
    applyDiscount,
    validateDiscount
};