const Product = require('../models/Product');

exports.getHomePage = async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true }).limit(3);
        res.render('pages/index', {
            title: 'Home',
            showSubheader: false,
            featuredProducts,
            isAdmin: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getTreatmentsPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const category = req.query.category || '';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 1000;
        const sort = req.query.sort || 'name';

        let query = {
            price: { $gte: minPrice, $lte: maxPrice }
        };

        if (category) {
            query.category = category;
        }

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const categories = await Product.distinct('category');

        res.render('pages/treatments', {
            title: 'Treatments',
            showSubheader: true,
            subheaderTitle: 'TREATMENTS',
            products,
            categories,
            currentPage: page,
            totalPages,
            limit,
            category,
            minPrice,
            maxPrice,
            sort,
            isAdmin: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getCheckoutPage = (req, res) => {
    const { treatment, price } = req.query;
    res.render('pages/checkout', {
        title: 'Checkout',
        showSubheader: true,
        subheaderTitle: 'CHECKOUT',
        treatment: treatment || 'Selected Treatment',
        price: price || 'XX.XX',
        pageScript: '/js/checkout_script.js',
        isAdmin: false
    });
};

exports.postCheckout = (req, res) => {
    // Process checkout logic here
    req.flash('success_msg', 'Booking confirmed successfully!');
    res.redirect('/booking');
};

exports.getBookingPage = (req, res) => {
    res.render('pages/booking', {
        title: 'Booking Confirmed',
        showSubheader: false,
        isAdmin: false
    });
};

exports.getAboutPage = (req, res) => {
    res.render('pages/about', {
        title: 'About Us',
        showSubheader: true,
        subheaderTitle: 'ABOUT US',
        isAdmin: false
    });
};