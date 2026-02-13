const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all products (public access)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    
    // Return products with their database image URLs
    // Let the frontend handle image path resolution
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all products (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    
    // Return products with their database image URLs
    // Let the frontend handle image path resolution
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new product (admin only)
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice)) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    // Prefer uploaded file, otherwise use provided image_url (if any)
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    } else if (image_url) {
      imagePath = image_url;
    }

    const result = await pool.query(
      'INSERT INTO products (name, price, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, numericPrice, description || null, imagePath]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (admin only)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, image_url } = req.body;

    console.log('Update request - ID:', id);
    console.log('Update request - Body:', { name, price, description, image_url });
    console.log('Update request - File:', req.file ? req.file.filename : 'No file');

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice)) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    // Get current product to check for existing image
    const currentProduct = await pool.query(
      'SELECT image_url FROM products WHERE id = $1',
      [id]
    );

    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let imagePath = currentProduct.rows[0].image_url;
    console.log('Current image path:', imagePath);

    // If new image uploaded, update path and delete old image
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      console.log('New image path:', imagePath);

      // Delete old image if it exists
      if (currentProduct.rows[0].image_url) {
        const oldImagePath = path.join(__dirname, '../uploads', path.basename(currentProduct.rows[0].image_url));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Deleted old image:', oldImagePath);
        }
      }
    } else if (typeof image_url !== 'undefined') {
      // If image_url is provided in body, use it (allows switching to external URLs)
      imagePath = image_url || null;
      console.log('Using image_url from body:', imagePath);
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, description = $3, image_url = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, numericPrice, description || null, imagePath, id]
    );

    console.log('Updated product:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete request - Product ID:', id);

    // Get product to delete associated image
    const product = await pool.query(
      'SELECT image_url FROM products WHERE id = $1',
      [id]
    );

    console.log('Product found:', product.rows);

    if (product.rows.length === 0) {
      console.log('Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete image file if it exists
    if (product.rows[0].image_url) {
      const imagePath = path.join(__dirname, '../uploads', path.basename(product.rows[0].image_url));
      console.log('Attempting to delete image:', imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Image deleted successfully');
      } else {
        console.log('Image file not found:', imagePath);
      }
    }

    // Delete product from database
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    console.log('Product deleted from database');

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
