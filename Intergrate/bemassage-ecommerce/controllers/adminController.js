const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

exports.getDashboard = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();

        // Get recent products
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate total revenue (example: sum of all product prices)
        const revenueResult = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' }
                }
            }
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            currentPage: 'dashboard',
            totalProducts,
            totalRevenue,
            recentProducts,
            isAdmin: true
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading dashboard');
        res.redirect('/admin');
    }
};

exports.getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const products = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/products', {
            title: 'Manage Products',
            currentPage: 'products',
            products,
            currentPage: page,
            totalPages,
            limit,
            isAdmin: true
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading products');
        res.redirect('/admin/products');
    }
};

exports.getAddProduct = (req, res) => {
    res.render('admin/add-product', {
        title: 'Add New Product',
        currentPage: 'add-product',
        isAdmin: true
    });
};

exports.postAddProduct = async (req, res) => {
    try {
        const { name, price, originalPrice, category, description, duration, featured } = req.body;

        let image = 'default.jpg';
        if (req.file) {
            image = req.file.filename;
        }

        const product = new Product({
            name,
            price: parseFloat(price),
            originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
            category,
            image,
            description,
            duration: parseInt(duration) || 60,
            featured: featured === 'on'
        });

        await product.save();
        req.flash('success_msg', 'Product added successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding product');
        res.redirect('/admin/products/add');
    }
};

exports.getEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }
        res.render('admin/edit-product', {
            title: 'Edit Product',
            currentPage: 'products',
            product,
            isAdmin: true
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading product');
        res.redirect('/admin/products');
    }
};

exports.postEditProduct = async (req, res) => {
    try {
        const { name, price, originalPrice, category, description, duration, featured } = req.body;

        const updateData = {
            name,
            price: parseFloat(price),
            originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
            category,
            description,
            duration: parseInt(duration) || 60,
            featured: featured === 'on'
        };

        if (req.file) {
            // Delete old image if exists and not default
            const product = await Product.findById(req.params.id);
            if (product.image && product.image !== 'default.jpg') {
                const oldImagePath = path.join(__dirname, '../public/images', product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.image = req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating product');
        res.redirect(`/admin/products/edit/${req.params.id}`);
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Delete image if exists and not default
        if (product.image && product.image !== 'default.jpg') {
            const imagePath = path.join(__dirname, '../public/images', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/admin/products');
    }
};