const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProducts, getLowStock, getBrands, uploadImage } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.post('/upload', upload.single('image'), uploadImage);
router.get('/search', searchProducts);
router.get('/low-stock', getLowStock);
router.get('/brands', getBrands);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
