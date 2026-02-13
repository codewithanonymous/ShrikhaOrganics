document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login';
        return;
    }

    // Global variables
    let currentEditProduct = null;

    // DOM elements
    const adminName = document.getElementById('adminName');
    const logoutBtn = document.getElementById('logoutBtn');
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Product form elements
    const addProductBtn = document.getElementById('addProductBtn');
    const addProductForm = document.getElementById('addProductForm');
    const productForm = document.getElementById('productForm');
    const productId = document.getElementById('productId');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productDescription = document.getElementById('productDescription');
    const productImageUrl = document.getElementById('productImageUrl');
    const productImage = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const productCountEl = document.getElementById('productCount');
    const productsTableBody = document.getElementById('productsTableBody');

    // Confirm delete dialog elements
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmOkBtn = document.getElementById('confirmOkBtn');

    let pendingDeleteProductId = null;

    // Initialize
    init();

    function init() {
        // Set admin name (be robust to invalid JSON in localStorage)
        let adminUser = {};
        const rawAdminUser = localStorage.getItem('adminUser');
        if (rawAdminUser) {
            try {
                adminUser = JSON.parse(rawAdminUser);
            } catch (e) {
                console.warn('Invalid adminUser JSON in localStorage, resetting.', e);
                localStorage.removeItem('adminUser');
            }
        }
        adminName.textContent = adminUser && adminUser.name ? adminUser.name : 'Admin';

        // Event listeners
        logoutBtn.addEventListener('click', logout);
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        addProductBtn.addEventListener('click', showAddProductForm);
        productForm.addEventListener('submit', handleProductSubmit);
        cancelProductBtn.addEventListener('click', hideProductForm);
        productImage.addEventListener('change', handleImagePreview);
        
        // Clear image URL button
        const clearImageUrlBtn = document.getElementById('clearImageUrlBtn');
        if (clearImageUrlBtn) {
            clearImageUrlBtn.addEventListener('click', () => {
                if (productImageUrl) {
                    productImageUrl.value = '';
                }
            });
        }

        // Delegate edit/delete clicks from the products table body
        if (productsTableBody) {
            productsTableBody.addEventListener('click', handleProductsTableClick);
        }

        // Confirm dialog buttons
        if (confirmCancelBtn) {
            confirmCancelBtn.addEventListener('click', hideConfirmDialog);
        }
        if (confirmOkBtn) {
            confirmOkBtn.addEventListener('click', confirmDelete);
        }

        // Load initial data
        loadProducts();
    }

    function logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin-login';
    }

    function switchTab(tabName) {
        // Update nav tabs
        navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab contents
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Load data based on tab
        if (tabName === 'products') {
            loadProducts();
        } else if (tabName === 'users') {
            loadUsers();
        }
    }

    // Product Management Functions
    async function loadProducts() {
        try {
            showLoading();
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const products = await response.json();
                displayProducts(products);
            } else {
                showError('Failed to load products');
            }
        } catch (error) {
            console.error('Load products error:', error);
            showError('Network error');
        } finally {
            hideLoading();
        }
    }

    function getProductImageSrc(imageUrl) {
        if (!imageUrl) return null;

        // Absolute or data URLs – use as-is
        if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) {
            return imageUrl;
        }

        // Starts with /uploads – use relative path
        if (imageUrl.startsWith('/uploads/')) {
            return imageUrl;
        }

        // Bare filename – assume it lives in /uploads
        return `/uploads/${imageUrl}`;
    }

    function displayProducts(products) {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    ${(() => {
                        const src = getProductImageSrc(product.image_url);
                        return src
                            ? `<img src="${src}" alt="${product.name}" class="product-image">`
                            : '<div class="product-image" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>';
                    })()}
                </td>
                <td>${product.name}</td>
                <td>₹${Number(product.price).toFixed(2)}</td>
                <td>${product.description || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" data-action="edit" data-product-id="${product.id}">Edit</button>
                        <button class="btn-delete" data-action="delete" data-product-id="${product.id}">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (productCountEl) {
            productCountEl.textContent = products.length;
        }
    }

    function showAddProductForm() {
        currentEditProduct = null;
        productForm.reset();
        productId.value = '';
        imagePreview.innerHTML = '';
        if (productImageUrl) {
            productImageUrl.value = '';
        }
        addProductForm.style.display = 'block';
        saveProductBtn.textContent = 'Save Product';
    }

    function handleProductsTableClick(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-product-id');
        if (!id) return;

        if (action === 'edit') {
            editProduct(parseInt(id, 10));
        } else if (action === 'delete') {
            showConfirmDialog(parseInt(id, 10));
        }
    }

    async function editProduct(id) {
        try {
            showLoading();
            const response = await fetch(`/api/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const products = await response.json();
                const product = products.find(p => p.id === id);
                
                if (product) {
                    currentEditProduct = product;
                    productId.value = product.id;
                    productName.value = product.name;
                    productPrice.value = product.price;
                    productDescription.value = product.description || '';

                    // Don't pre-fill image URL to avoid confusion
                    if (productImageUrl) {
                        productImageUrl.value = '';
                    }
                    
                    if (product.image_url) {
                        const src = getProductImageSrc(product.image_url);
                        imagePreview.innerHTML = `<img src="${src}" alt="Preview">`;
                    } else {
                        imagePreview.innerHTML = '';
                    }
                    
                    addProductForm.style.display = 'block';
                    saveProductBtn.textContent = 'Update Product';
                }
            }
        } catch (error) {
            console.error('Edit product error:', error);
            showError('Failed to load product');
        } finally {
            hideLoading();
        }
    }

    function showConfirmDialog(id) {
        pendingDeleteProductId = id;
        if (confirmMessage) {
            confirmMessage.textContent = 'Are you sure you want to delete this product? This action cannot be undone.';
        }
        if (confirmDialog) {
            confirmDialog.style.display = 'flex';
        }
    }

    function hideConfirmDialog() {
        pendingDeleteProductId = null;
        if (confirmDialog) {
            confirmDialog.style.display = 'none';
        }
    }

    async function confirmDelete() {
        if (!pendingDeleteProductId) {
            hideConfirmDialog();
            return;
        }

        const id = pendingDeleteProductId;
        console.log('Attempting to delete product:', id);

        try {
            showLoading();
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Delete response status:', response.status);
            console.log('Delete response ok:', response.ok);

            if (response.ok) {
                hideConfirmDialog();
                await loadProducts();
                showSuccess('Product deleted successfully');
                console.log('Product deleted successfully');
            } else {
                const data = await response.json();
                console.log('Delete error response:', data);
                showError(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Delete product error:', error);
            showError('Network error');
        } finally {
            hideLoading();
        }
    }

    async function handleProductSubmit(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', productName.value);
        formData.append('price', productPrice.value);
        formData.append('description', productDescription.value);
        
        // If new image is uploaded, send only the image
        if (productImage.files[0]) {
            formData.append('image', productImage.files[0]);
            console.log('Uploading new image:', productImage.files[0].name);
        } else if (productImageUrl && productImageUrl.value.trim()) {
            formData.append('image_url', productImageUrl.value.trim());
            console.log('Using image URL:', productImageUrl.value.trim());
        } else {
            console.log('No image provided');
        }

        try {
            showLoading();
            
            const url = currentEditProduct ? 
                `/api/products/${currentEditProduct.id}` : 
                '/api/products';
            
            const method = currentEditProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                hideProductForm();
                loadProducts();
                showSuccess(currentEditProduct ? 'Product updated successfully' : 'Product added successfully');
            } else {
                const data = await response.json();
                showError(data.error || 'Failed to save product');
            }
        } catch (error) {
            console.error('Save product error:', error);
            showError('Network error');
        } finally {
            hideLoading();
        }
    }

    function hideProductForm() {
        addProductForm.style.display = 'none';
        productForm.reset();
        imagePreview.innerHTML = '';
        if (productImageUrl) {
            productImageUrl.value = '';
        }
        currentEditProduct = null;
    }

    function handleImagePreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    // User Management Functions
    async function loadUsers() {
        try {
            showLoading();
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const users = await response.json();
                displayUsers(users);
            } else {
                showError('Failed to load users');
            }
        } catch (error) {
            console.error('Load users error:', error);
            showError('Network error');
        } finally {
            hideLoading();
        }
    }

    function displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            const createdDate = new Date(user.created_at).toLocaleDateString();
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span style="background: ${user.role === 'admin' ? '#4CAF50' : '#2196F3'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${user.role}</span></td>
                <td>${createdDate}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Utility Functions
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showError(message) {
        // Simple error notification (you can enhance this)
        alert('Error: ' + message);
    }

    function showSuccess(message) {
        // Simple success notification (you can enhance this)
        alert('Success: ' + message);
    }
});

// Make functions globally accessible for inline onclick handlers
window.editProduct = function(id) {
    document.dispatchEvent(new CustomEvent('editProduct', { detail: id }));
};

window.deleteProduct = function(id) {
    document.dispatchEvent(new CustomEvent('deleteProduct', { detail: id }));
};

// Listen for custom events
document.addEventListener('editProduct', function(e) {
    // This will be handled by the main admin.js
});

document.addEventListener('deleteProduct', function(e) {
    // This will be handled by the main admin.js
});
