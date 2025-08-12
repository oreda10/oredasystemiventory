// js/products.js - COMPLETE VERSION WITH BULK DESCRIPTION EDIT & ALL FEATURES

// === PRODUCT MANAGEMENT ===

// Global variables for product management
let currentEditingImages = [];
let currentImageIndex = 0;

// === AUTO CURRENCY FORMATTING ===
function formatCurrencyInput(input) {
    // Remove non-numeric characters except dots
    let value = input.value.replace(/[^\d]/g, '');
    
    // Convert to number and format
    if (value) {
        const number = parseInt(value);
        input.value = formatNumber(number);
    }
}

function setupCurrencyInputs() {
    const currencyInputs = ['#productBuyPrice', '#productSellPrice', '#bulkBuyPrice', '#bulkSellPrice'];
    
    currencyInputs.forEach(selector => {
        const input = getElement(selector);
        if (input) {
            // Format on input
            input.addEventListener('input', () => formatCurrencyInput(input));
            
            // Format on focus out
            input.addEventListener('blur', () => formatCurrencyInput(input));
            
            // Store raw value for form submission
            input.addEventListener('focus', function() {
                // Convert formatted back to raw number for editing
                const rawValue = this.value.replace(/\./g, '');
                if (rawValue && !isNaN(rawValue)) {
                    this.value = rawValue;
                }
            });
        }
    });
}

// Get raw number from formatted currency input
function getRawCurrencyValue(selector) {
    const input = getElement(selector);
    if (!input) return 0;
    
    const value = input.value.replace(/\./g, '');
    return parseInt(value) || 0;
}

// === MAIN PRODUCT FUNCTIONS ===
function loadProducts() {
    const tbody = getElement('#productsTable tbody');
    if (!tbody) {
        createProductsPageStructure();
        return;
    }
    
    if (appData.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="package"></i></div>
                    <div class="empty-state-text">Belum ada produk</div>
                    <div class="empty-state-subtext">Tambahkan produk pertama Anda</div>
                </td>
            </tr>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    // Sort products based on selected option
    const sortValue = getElement('#sortProducts')?.value || 'newest';
    let sortedProducts = [...appData.products];
    
    switch(sortValue) {
        case 'newest':
            sortedProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-low':
            sortedProducts.sort((a, b) => a.sellPrice - b.sellPrice);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.sellPrice - a.sellPrice);
            break;
        case 'stock-low':
            sortedProducts.sort((a, b) => a.stock - b.stock);
            break;
        case 'stock-high':
            sortedProducts.sort((a, b) => b.stock - a.stock);
            break;
    }
    
    tbody.innerHTML = sortedProducts.map(product => {
        // Validate product data
        if (!product.id || !product.name) {
            return '';
        }
        
        const soldCount = appData.sales
            .filter(sale => String(sale.productId) === String(product.id) && sale.status === 'completed')
            .reduce((sum, sale) => sum + sale.quantity, 0);
        
        // Handle images with better validation
        let productImages = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImages = product.images.filter(img => 
                img && 
                img !== 'undefined' && 
                img !== 'null' && 
                typeof img === 'string' && 
                img.trim() !== ''
            );
        }
        
        if (productImages.length === 0) {
            productImages = [createPlaceholderImage(product.name || 'No Image', 400, 400)];
        }
        
        const mainImage = productImages[0];
        
        return `
            <tr data-product-id="${product.id}">
                <td class="checkbox-cell">
                    <input type="checkbox" class="product-checkbox" value="${product.id}" onchange="updateBulkActions()">
                </td>
                <td>
                    <div class="product-images-container">
                        <img src="${mainImage}" alt="${product.name}" class="product-image" onclick="previewProduct('${product.id}')" style="cursor: pointer;" onerror="this.src='${createPlaceholderImage('Error', 400, 400)}';">
                        ${productImages.length > 1 ? 
                            `<div class="product-thumbnails">
                                ${productImages.slice(1, 4).map(img => 
                                    `<img src="${img}" alt="${product.name}" class="product-thumbnail" onclick="previewProduct('${product.id}')" onerror="this.style.display='none';">`
                                ).join('')}
                                ${productImages.length > 4 ? 
                                    `<span class="more-images">+${productImages.length - 4}</span>` : ''
                                }
                            </div>` : ''
                        }
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${product.name}</div>
                    ${product.description ? 
                        `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 3px;">
                            ${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}
                        </div>` : ''
                    }
                </td>
                <td><span class="category-badge ${getCategoryBadgeClass(product.category)}">${product.category}</span></td>
                <td>
                    <span class="${getStockStatus(product.stock)}">${product.stock} (${getStockText(product.stock)})</span>
                    <div style="margin-top: 4px;">
                        <button class="btn-icon btn-icon-success" onclick="updateStock('${product.id}', 'add')" title="Tambah Stok">
                            <i data-lucide="plus"></i>
                        </button>
                        <button class="btn-icon btn-icon-warning" onclick="updateStock('${product.id}', 'subtract')" title="Kurangi Stok">
                            <i data-lucide="minus"></i>
                        </button>
                    </div>
                </td>
                <td>${formatCurrency(product.buyPrice)}</td>
                <td>${formatCurrency(product.sellPrice)}</td>
                <td><strong>${formatPercentage(calculateMargin(product.sellPrice, product.buyPrice))}</strong></td>
                <td><span style="color: var(--success-color); font-weight: 600;">${formatNumber(soldCount)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-icon-info" onclick="previewProduct('${product.id}')" title="Lihat Detail">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn-icon btn-icon-warning" onclick="editProduct('${product.id}')" title="Edit Produk">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger" onclick="deleteProductDirect('${product.id}')" title="Hapus Produk">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).filter(row => row !== '').join('');
    
    setTimeout(initializeIcons, 50);
}

function createProductsPageStructure() {
    const productsPage = getElement('#productsPage');
    if (!productsPage) return;
    
    productsPage.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <i data-lucide="package"></i>
                    Manajemen Produk
                </h1>
            </div>
            <div class="page-actions">
                <div class="filter-group" style="margin-right: 8px;">
                    <label>Kategori</label>
                    <select id="categoryFilter" onchange="filterProducts()">
                        <option value="">Semua Kategori</option>
                    </select>
                </div>
                <button class="btn btn-info" onclick="openStockHistory()">
                    <i data-lucide="file-text"></i>
                    Riwayat Stok
                </button>
                <button class="btn btn-primary" onclick="openProductModal()">
                    <i data-lucide="plus"></i>
                    Tambah Produk
                </button>
            </div>
        </div>
        
        <div class="filters">
            <div class="filter-row">
                <div class="search-box">
                    <input type="text" id="productSearch" placeholder="Cari produk..." onkeyup="filterProducts()">
                </div>
                <div class="filter-group">
                    <label>Urutkan:</label>
                    <select id="sortProducts" onchange="sortProducts()">
                        <option value="newest">Terbaru</option>
                        <option value="name">Nama A-Z</option>
                        <option value="name-desc">Nama Z-A</option>
                        <option value="price-low">Harga Terendah</option>
                        <option value="price-high">Harga Tertinggi</option>
                        <option value="stock-low">Stok Terendah</option>
                        <option value="stock-high">Stok Tertinggi</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- FIXED Bulk Actions - Icons matching action buttons -->
        <div class="bulk-actions" id="bulkActions" style="display: none;">
            <span id="selectedCount">0 produk dipilih</span>
            <button class="btn-icon btn-icon-warning" onclick="openBulkEditModal()" title="Edit Massal">
                <i data-lucide="edit"></i>
            </button>
            <button class="btn-icon btn-icon-danger" onclick="bulkDeleteProducts()" title="Hapus Terpilih">
                <i data-lucide="trash-2"></i>
            </button>
            <button class="btn-icon btn-icon-secondary" onclick="clearSelection()" title="Batal">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Daftar Produk</h3>
            </div>
            <table id="productsTable">
                <thead>
                    <tr>
                        <th class="checkbox-cell">
                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                        </th>
                        <th>Foto</th>
                        <th>Produk</th>
                        <th>Kategori</th>
                        <th>Stok</th>
                        <th>Harga Beli</th>
                        <th>Harga Jual</th>
                        <th>Margin</th>
                        <th>Terjual</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
    
    // Create modals
    createProductModals();
    
    // Initialize icons
    setTimeout(initializeIcons, 50);
    
    // Load products
    loadProducts();
}

// === FIXED DELETE FUNCTION ===
function deleteProductDirect(productId) {
    const product = appData.products.find(p => String(p.id) === String(productId));
    
    if (!product) {
        showConfirm(
            'Produk tidak ditemukan! Silakan refresh halaman dan coba lagi.',
            () => window.location.reload(),
            'Refresh',
            'Batal',
            'Error',
            'x-circle'
        );
        return;
    }
    
    showConfirm(
        `Yakin ingin menghapus produk "${product.name}"?\n\nSemua data penjualan terkait juga akan dihapus.`,
        async () => {
            try {
                const deleteBtn = getElement(`button[onclick*="deleteProductDirect('${productId}')"]`);
                if (deleteBtn) {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = '<i data-lucide="loader-2" class="loading-icon"></i>';
                    setTimeout(initializeIcons, 50);
                }
                
                const success = await window.deleteProduct(productId);
                
                if (success) {
                    appData.products = appData.products.filter(p => String(p.id) !== String(productId));
                    
                    const productRow = getElement(`tr[data-product-id="${productId}"]`);
                    if (productRow) {
                        productRow.style.transition = 'opacity 0.3s ease';
                        productRow.style.opacity = '0';
                        setTimeout(() => {
                            productRow.remove();
                        }, 300);
                    }
                    
                    updateDashboard();
                    loadCategoriesFromProducts();
                    
                    showConfirm(
                        'Produk berhasil dihapus!',
                        () => {
                            loadProducts();
                        },
                        'OK',
                        '',
                        'Sukses',
                        'check-circle'
                    );
                } else {
                    if (deleteBtn) {
                        deleteBtn.disabled = false;
                        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
                        setTimeout(initializeIcons, 50);
                    }
                    
                    showConfirm(
                        'Gagal menghapus produk. Silakan coba lagi.',
                        null,
                        'OK',
                        '',
                        'Error',
                        'x-circle'
                    );
                }
                
            } catch (error) {
                const deleteBtn = getElement(`button[onclick*="deleteProductDirect('${productId}')"]`);
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
                    setTimeout(initializeIcons, 50);
                }
                
                showConfirm(
                    'Error menghapus produk: ' + error.message,
                    null,
                    'OK',
                    '',
                    'Error',
                    'x-circle'
                );
            }
        },
        'Ya, Hapus',
        'Batal',
        'Konfirmasi Hapus',
        'trash-2'
    );
}

// === FIXED EDIT FUNCTION ===
function editProduct(id) {
    openProductModal(id);
}

// === FIXED PREVIEW FUNCTION WITH CAROUSEL ===
function previewProduct(productId) {
    const product = appData.products.find(p => String(p.id) === String(productId));
    
    if (!product) {
        showConfirm(
            'Produk tidak ditemukan! Silakan refresh halaman dan coba lagi.',
            () => window.location.reload(),
            'Refresh',
            'Batal',
            'Error',
            'x-circle'
        );
        return;
    }
    
    // Create preview modal if not exists
    let modal = getElement('#productPreviewModal');
    if (!modal) {
        createProductPreviewModal();
        modal = getElement('#productPreviewModal');
    }
    
    const soldCount = appData.sales
        .filter(sale => String(sale.productId) === String(product.id) && sale.status === 'completed')
        .reduce((sum, sale) => sum + sale.quantity, 0);
    
    const totalRevenue = appData.sales
        .filter(sale => String(sale.productId) === String(product.id) && sale.status === 'completed')
        .reduce((sum, sale) => sum + sale.total, 0);
    
    getElement('#previewProductName').textContent = product.name;
    
    let productImages = [];
    if (product.images && Array.isArray(product.images)) {
        productImages = product.images.filter(img => 
            img && img !== 'undefined' && img !== 'null' && typeof img === 'string' && img.trim() !== ''
        );
    }
    
    if (productImages.length === 0) {
        productImages = [createPlaceholderImage('No Image', 400, 400)];
    }
    
    // Reset carousel index
    currentImageIndex = 0;
    
    getElement('#productPreviewContent').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4 style="color: var(--text-primary); margin-bottom: 12px;">Galeri Foto</h4>
                ${productImages.length > 1 ? `
                    <div class="image-carousel">
                        <div class="carousel-main" style="position: relative; border-radius: 8px; overflow: hidden; background: var(--bg-tertiary); max-height: 400px;">
                            <button class="carousel-btn carousel-prev" onclick="changeImage(-1)" ${productImages.length <= 1 ? 'style="display:none"' : ''}>
                                <i data-lucide="chevron-left"></i>
                            </button>
                            <img id="carouselMainImage" src="${productImages[0]}" alt="${product.name}" 
                                 style="width: 100%; height: auto; max-height: 400px; object-fit: contain; display: block; cursor: zoom-in;" 
                                 onclick="showFullScreenImage('${productImages[0]}', '${product.name}')">
                            <button class="carousel-btn carousel-next" onclick="changeImage(1)" ${productImages.length <= 1 ? 'style="display:none"' : ''}>
                                <i data-lucide="chevron-right"></i>
                            </button>
                        </div>
                        <div class="carousel-thumbnails" style="display: flex; gap: 8px; justify-content: center; margin-top: 12px; flex-wrap: wrap;">
                            ${productImages.map((img, index) => 
                                `<img src="${img}" alt="${product.name}" 
                                     class="carousel-thumbnail ${index === 0 ? 'active' : ''}" 
                                     onclick="selectImage(${index})"
                                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 2px solid var(--border-color); cursor: pointer; transition: all 0.2s ease; opacity: ${index === 0 ? '1' : '0.7'};">`
                            ).join('')}
                        </div>
                        <div class="carousel-counter" style="text-align: center; margin-top: 8px;">
                            <span id="imageCounter" style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">1 / ${productImages.length}</span>
                        </div>
                        <div style="text-align: center; margin-top: 8px;">
                            <button class="btn btn-info btn-compact" onclick="showFullScreenImage(window.currentCarouselImages[currentImageIndex], '${product.name}')" title="Lihat Fullscreen">
                                <i data-lucide="maximize"></i>
                                Fullscreen
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="single-image-preview">
                        <img src="${productImages[0]}" alt="${product.name}" 
                             style="width: 100%; height: auto; max-height: 400px; object-fit: contain; border-radius: 8px; cursor: zoom-in;"
                             onclick="showFullScreenImage('${productImages[0]}', '${product.name}')">
                        <div style="text-align: center; margin-top: 12px;">
                            <button class="btn btn-info btn-compact" onclick="showFullScreenImage('${productImages[0]}', '${product.name}')" title="Lihat Fullscreen">
                                <i data-lucide="maximize"></i>
                                Fullscreen
                            </button>
                        </div>
                    </div>
                `}
            </div>
            <div>
                <h4 style="color: var(--text-primary); margin-bottom: 12px;">Detail Produk</h4>
                <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                    <div style="margin-bottom: 8px;"><strong>Kategori:</strong> <span class="category-badge ${getCategoryBadgeClass(product.category)}">${product.category}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Stok:</strong> <span class="${getStockStatus(product.stock)}">${product.stock}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Harga Beli:</strong> ${formatCurrency(product.buyPrice)}</div>
                    <div style="margin-bottom: 8px;"><strong>Harga Jual:</strong> ${formatCurrency(product.sellPrice)}</div>
                    <div style="margin-bottom: 8px;"><strong>Margin:</strong> ${formatPercentage(calculateMargin(product.sellPrice, product.buyPrice))}</div>
                    <div style="margin-bottom: 8px;"><strong>Total Terjual:</strong> ${formatNumber(soldCount)} item</div>
                    <div><strong>Total Revenue:</strong> ${formatCurrency(totalRevenue)}</div>
                </div>
                ${product.description ? 
                    `<div>
                        <h5 style="color: var(--text-primary); margin-bottom: 8px;">Deskripsi</h5>
                        <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; color: var(--text-secondary); line-height: 1.5; white-space: pre-line;">${product.description}</div>
                    </div>` : ''
                }
            </div>
        </div>
    `;
    
    // Store images for carousel functionality
    window.currentCarouselImages = productImages;
    
    modal.style.display = 'block';
    setTimeout(initializeIcons, 50);
}

// === CAROUSEL FUNCTIONS ===
function changeImage(direction) {
    if (!window.currentCarouselImages || window.currentCarouselImages.length <= 1) return;
    
    currentImageIndex += direction;
    
    if (currentImageIndex >= window.currentCarouselImages.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = window.currentCarouselImages.length - 1;
    }
    
    updateCarouselDisplay();
}

function selectImage(index) {
    if (!window.currentCarouselImages || index < 0 || index >= window.currentCarouselImages.length) return;
    
    currentImageIndex = index;
    updateCarouselDisplay();
}

function updateCarouselDisplay() {
    const mainImage = getElement('#carouselMainImage');
    const counter = getElement('#imageCounter');
    const thumbnails = getAllElements('.carousel-thumbnail');
    
    if (mainImage && window.currentCarouselImages) {
        mainImage.src = window.currentCarouselImages[currentImageIndex];
        // Update onclick for fullscreen
        mainImage.onclick = () => showFullScreenImage(window.currentCarouselImages[currentImageIndex], mainImage.alt);
    }
    
    if (counter && window.currentCarouselImages) {
        counter.textContent = `${currentImageIndex + 1} / ${window.currentCarouselImages.length}`;
    }
    
    // Update thumbnail active state
    thumbnails.forEach((thumb, index) => {
        const isActive = index === currentImageIndex;
        thumb.classList.toggle('active', isActive);
        thumb.style.opacity = isActive ? '1' : '0.7';
        thumb.style.borderColor = isActive ? 'var(--accent-color)' : 'var(--border-color)';
    });
}

// NEW: Show fullscreen image
function showFullScreenImage(imageSrc, productName) {
    // Create fullscreen modal
    const existingModal = getElement('#fullscreenImageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'fullscreenImageModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
        cursor: zoom-out;
    `;
    
    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; top: -50px; right: 0; z-index: 10;">
                <button onclick="closeFullScreenImage()" style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(0, 0, 0, 0.9)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.7)'">
                    ×
                </button>
            </div>
            <img src="${imageSrc}" alt="${productName}" style="
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            ">
            <div style="
                margin-top: 20px;
                color: white;
                text-align: center;
                font-weight: 600;
                font-size: 1.1rem;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            ">${productName}</div>
            <div style="
                margin-top: 8px;
                color: rgba(255, 255, 255, 0.7);
                text-align: center;
                font-size: 0.9rem;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            ">Klik di area hitam untuk menutup</div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeFullScreenImage();
        }
    };
    
    // Close on ESC key
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            closeFullScreenImage();
        }
    };
    
    // Store the handler for later removal
    window.currentEscHandler = handleEscKey;
    document.addEventListener('keydown', handleEscKey);
    
    document.body.appendChild(modal);
    
    // Smooth fade in
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '1';
    }, 10);
}

// NEW: Close fullscreen image
function closeFullScreenImage() {
    const modal = getElement('#fullscreenImageModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
        }, 300);
        
        // Remove ESC listener
        if (window.currentEscHandler) {
            document.removeEventListener('keydown', window.currentEscHandler);
            window.currentEscHandler = null;
        }
    }
}

function closeProductPreview() {
    const modal = getElement('#productPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Clean up
    window.currentCarouselImages = null;
    currentImageIndex = 0;
}

// === FIXED STOCK UPDATE ===
async function updateStock(productId, operation) {
    const product = appData.products.find(p => String(p.id) === String(productId));
    
    if (!product) {
        showConfirm(
            'Produk tidak ditemukan! Silakan refresh halaman dan coba lagi.',
            () => window.location.reload(),
            'Refresh',
            'Batal',
            'Error',
            'x-circle'
        );
        return;
    }

    const quantity = prompt(
        `Masukkan jumlah stok yang ingin ${operation === 'add' ? 'ditambah' : 'dikurangi'}:`, 
        '1'
    );
    
    if (quantity === null || quantity === '' || isNaN(quantity) || parseInt(quantity) <= 0) {
        return;
    }

    const qty = parseInt(quantity);
    let newStock;

    if (operation === 'add') {
        newStock = product.stock + qty;
    } else {
        if (qty > product.stock) {
            showConfirm('Stok tidak mencukupi untuk dikurangi!', null, 'OK');
            return;
        }
        newStock = product.stock - qty;
    }

    try {
        const note = `Manual ${operation === 'add' ? 'penambahan' : 'pengurangan'} stok oleh admin`;
        await window.updateProductStock(productId, newStock, note);
        
        // Update local data
        product.stock = newStock;
        
        // Reload products table
        loadProducts();
        updateDashboard();
        
        showConfirm(
            `Stok berhasil ${operation === 'add' ? 'ditambah' : 'dikurangi'}!`,
            null,
            'OK',
            '',
            'Sukses',
            'check-circle'
        );
    } catch (error) {
        showConfirm('Error mengupdate stok: ' + error.message, null, 'OK', '', 'Error', 'x-circle');
    }
}

// === PRODUCT FILTERING AND SORTING ===
function sortProducts() {
    loadProducts();
}

function filterProducts() {
    const search = getElement('#productSearch')?.value.toLowerCase() || '';
    const category = getElement('#categoryFilter')?.value || '';
    const rows = getAllElements('#productsTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const categoryCell = row.cells[3];
        const categoryText = categoryCell ? categoryCell.textContent.trim() : '';
        
        const matchesSearch = text.includes(search);
        const matchesCategory = !category || categoryText === category;
        
        row.style.display = (matchesSearch && matchesCategory) ? '' : 'none';
    });
}

// === BULK ACTIONS - ENHANCED VERSION ===
function toggleSelectAll() {
    const selectAll = getElement('#selectAll');
    const checkboxes = getAllElements('.product-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        if (selectAll.checked) {
            appData.selectedProducts.add(checkbox.value);
        } else {
            appData.selectedProducts.delete(checkbox.value);
        }
    });
    
    updateBulkActions();
}

function updateBulkActions() {
    const checkboxes = getAllElements('.product-checkbox:checked');
    const bulkActions = getElement('#bulkActions');
    const selectedCount = getElement('#selectedCount');
    
    appData.selectedProducts.clear();
    checkboxes.forEach(checkbox => {
        appData.selectedProducts.add(checkbox.value);
    });
    
    if (appData.selectedProducts.size > 0) {
        bulkActions.style.display = 'flex';
        bulkActions.classList.add('active');
        selectedCount.textContent = `${appData.selectedProducts.size} produk dipilih`;
        
        // FIXED: Update count in bulk edit modal if it's open
        const selectedProductCount = getElement('#selectedProductCount');
        if (selectedProductCount) {
            selectedProductCount.textContent = appData.selectedProducts.size;
        }
        
        setTimeout(() => {
            bulkActions.style.opacity = '1';
            bulkActions.style.transform = 'translateY(0)';
        }, 10);
    } else {
        bulkActions.classList.remove('active');
        bulkActions.style.opacity = '0';
        bulkActions.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            bulkActions.style.display = 'none';
        }, 300);
        
        // Clear count in modal too
        const selectedProductCount = getElement('#selectedProductCount');
        if (selectedProductCount) {
            selectedProductCount.textContent = '0';
        }
    }
    
    const selectAll = getElement('#selectAll');
    const allCheckboxes = getAllElements('.product-checkbox');
    if (selectAll && allCheckboxes.length > 0) {
        selectAll.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkboxes.length;
        selectAll.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
    }
}

function clearSelection() {
    appData.selectedProducts.clear();
    getAllElements('.product-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    const selectAll = getElement('#selectAll');
    if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }
    updateBulkActions();
}

// === ENHANCED BULK EDIT FUNCTIONS ===
function openBulkEditModal() {
    if (appData.selectedProducts.size === 0) {
        showNotification('Pilih produk terlebih dahulu!', 'warning');
        return;
    }
    
    updateCategorySelects();
    const modal = getElement('#bulkEditModal');
    if (modal) {
        // FIXED: Update selected count when opening modal
        const selectedProductCount = getElement('#selectedProductCount');
        if (selectedProductCount) {
            selectedProductCount.textContent = appData.selectedProducts.size;
        }
        
        modal.style.display = 'block';
        // Setup currency inputs for bulk edit
        setTimeout(() => {
            setupCurrencyInputs();
        }, 100);
    }
}

function closeBulkEditModal() {
    const modal = getElement('#bulkEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const form = getElement('#bulkEditForm');
    if (form) {
        form.reset();
    }
    
    // Reset description fields
    const descriptionAction = getElement('#bulkDescriptionAction');
    const descriptionField = getElement('#bulkDescription');
    const descriptionPreview = getElement('#descriptionPreview');
    
    if (descriptionAction) descriptionAction.value = '';
    if (descriptionField) {
        descriptionField.style.display = 'none';
        descriptionField.value = '';
        descriptionField.removeAttribute('required');
    }
    if (descriptionPreview) descriptionPreview.style.display = 'none';
}

// ENHANCED: Bulk edit with description support
async function saveBulkEdit(event) {
    event.preventDefault();
    
    const category = getElement('#bulkCategory').value;
    const stockChange = parseInt(getElement('#bulkStockChange').value) || 0;
    const buyPrice = getRawCurrencyValue('#bulkBuyPrice');
    const sellPrice = getRawCurrencyValue('#bulkSellPrice');
    const description = getElement('#bulkDescription').value.trim();
    const descriptionAction = getElement('#bulkDescriptionAction').value;
    
    if (!category && !stockChange && !buyPrice && !sellPrice && !description && !descriptionAction) {
        showConfirm('Tidak ada perubahan yang akan diterapkan!', null, 'OK');
        return;
    }
    
    // FIXED: Ensure we have selected products
    if (appData.selectedProducts.size === 0) {
        showConfirm('Tidak ada produk yang dipilih! Silakan pilih produk terlebih dahulu.', null, 'OK');
        return;
    }
    
    try {
        const updates = {
            category: category || null,
            stockChange: stockChange,
            buyPrice: buyPrice || null,
            sellPrice: sellPrice || null,
            description: description || null,
            descriptionAction: descriptionAction || null
        };
        
        // Store the count before async operation
        const selectedCount = appData.selectedProducts.size;
        const selectedArray = Array.from(appData.selectedProducts);
        
        await window.bulkUpdateProducts(selectedArray, updates);
        
        closeBulkEditModal();
        clearSelection();
        
        showConfirm(
            `Berhasil mengupdate ${selectedCount} produk!`,
            null,
            'OK',
            '',
            'Sukses',
            'check-circle'
        );
        
    } catch (error) {
        console.error('❌ Bulk edit error:', error);
        showConfirm(
            'Error mengupdate produk: ' + error.message,
            null,
            'OK',
            '',
            'Error',
            'x-circle'
        );
    }
}

// NEW: Toggle description field visibility based on action
function toggleDescriptionField() {
    const action = getElement('#bulkDescriptionAction').value;
    const textarea = getElement('#bulkDescription');
    const preview = getElement('#descriptionPreview');
    
    if (action && action !== '' && action !== 'clear') {
        textarea.style.display = 'block';
        textarea.setAttribute('required', 'true');
        textarea.focus();
    } else {
        textarea.style.display = 'none';
        textarea.removeAttribute('required');
        textarea.value = '';
    }
    
    // Hide preview when action changes
    preview.style.display = 'none';
}

// NEW: Preview description changes
function previewDescriptionChanges() {
    const action = getElement('#bulkDescriptionAction').value;
    const newText = getElement('#bulkDescription').value.trim();
    const preview = getElement('#descriptionPreview');
    const previewContent = getElement('#previewContent');
    
    if (!action || action === '') {
        showNotification('Pilih aksi deskripsi terlebih dahulu', 'warning');
        return;
    }
    
    if ((action === 'replace' || action === 'append' || action === 'prepend') && !newText) {
        showNotification('Masukkan teks deskripsi terlebih dahulu', 'warning');
        return;
    }
    
    // FIXED: Ensure we have selected products
    if (appData.selectedProducts.size === 0) {
        showNotification('Tidak ada produk yang dipilih', 'warning');
        return;
    }
    
    // Get selected products
    const selectedProducts = Array.from(appData.selectedProducts)
        .map(id => appData.products.find(p => String(p.id) === String(id)))
        .filter(p => p)
        .slice(0, 5); // Show only first 5 for preview
    
    if (selectedProducts.length === 0) {
        showNotification('Produk yang dipilih tidak ditemukan', 'warning');
        return;
    }
    
    let previewHTML = '';
    
    selectedProducts.forEach((product, index) => {
        const currentDesc = product.description || '';
        let newDesc = '';
        
        switch (action) {
            case 'replace':
                newDesc = newText;
                break;
            case 'append':
                newDesc = currentDesc ? `${currentDesc}\n${newText}` : newText;
                break;
            case 'prepend':
                newDesc = currentDesc ? `${newText}\n${currentDesc}` : newText;
                break;
            case 'clear':
                newDesc = '';
                break;
        }
        
        previewHTML += `
            <div style="border-bottom: 1px solid var(--border-color); padding: 8px 0; ${index === selectedProducts.length - 1 ? 'border-bottom: none;' : ''}">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${product.name}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.8rem;">
                    <div>
                        <div style="color: var(--text-secondary); margin-bottom: 2px;">Deskripsi Lama:</div>
                        <div style="background: var(--bg-secondary); padding: 6px; border-radius: 4px; min-height: 20px; color: var(--text-muted); white-space: pre-line;">
                            ${currentDesc || '<em style="opacity: 0.7;">Kosong</em>'}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); margin-bottom: 2px;">Deskripsi Baru:</div>
                        <div style="background: var(--bg-secondary); padding: 6px; border-radius: 4px; min-height: 20px; color: var(--text-primary); border-left: 3px solid var(--accent-color); white-space: pre-line;">
                            ${newDesc || '<em style="opacity: 0.7;">Kosong</em>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (appData.selectedProducts.size > 5) {
        previewHTML += `
            <div style="text-align: center; padding: 12px; color: var(--text-secondary); font-style: italic; background: var(--bg-secondary); border-radius: 6px; margin-top: 8px;">
                <i data-lucide="info" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                ... dan ${appData.selectedProducts.size - 5} produk lainnya akan mengalami perubahan yang sama
            </div>
        `;
    }
    
    previewContent.innerHTML = previewHTML;
    preview.style.display = 'block';
    
    // Reinitialize icons for the info icon
    setTimeout(initializeIcons, 50);
    
    showNotification(`Preview untuk ${appData.selectedProducts.size} produk berhasil dibuat`, 'success');
}

async function bulkDeleteProducts() {
    if (appData.selectedProducts.size === 0) {
        showConfirm('Tidak ada produk yang dipilih!', null, 'OK');
        return;
    }
    
    const selectedProductNames = Array.from(appData.selectedProducts)
        .map(id => {
            const product = appData.products.find(p => String(p.id) === String(id));
            return product ? product.name : 'Unknown';
        })
        .slice(0, 5);
    
    const productList = selectedProductNames.join('\n• ');
    const moreText = appData.selectedProducts.size > 5 ? `\n• ... dan ${appData.selectedProducts.size - 5} produk lainnya` : '';
    
    showConfirm(
        `Yakin ingin menghapus ${appData.selectedProducts.size} produk terpilih?\n\nProduk yang akan dihapus:\n• ${productList}${moreText}\n\nPeringatan: Semua data penjualan dan riwayat stok yang terkait akan ikut terhapus (cascade delete).`,
        async () => {
            try {
                const bulkDeleteBtn = getElement('button[onclick="bulkDeleteProducts()"]');
                if (bulkDeleteBtn) {
                    bulkDeleteBtn.disabled = true;
                    bulkDeleteBtn.innerHTML = '<i data-lucide="loader-2"></i> Menghapus...';
                    setTimeout(initializeIcons, 50);
                }
                
                const selectedCount = appData.selectedProducts.size;
                await window.bulkDeleteProducts(Array.from(appData.selectedProducts));
                clearSelection();
                
                showConfirm(
                    `Berhasil menghapus ${selectedCount} produk beserta semua data terkait!`,
                    null,
                    'OK',
                    '',
                    'Sukses',
                    'check-circle'
                );
                
            } catch (error) {
                const bulkDeleteBtn = getElement('button[onclick="bulkDeleteProducts()"]');
                if (bulkDeleteBtn) {
                    bulkDeleteBtn.disabled = false;
                    bulkDeleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
                }
                
                showConfirm(
                    'Error menghapus produk: ' + (error.message || 'Terjadi kesalahan yang tidak diketahui'),
                    null,
                    'OK',
                    '',
                    'Error',
                    'x-circle'
                );
                
                setTimeout(initializeIcons, 100);
            }
        },
        'Ya, Hapus Semua',
        'Batal',
        'Konfirmasi Hapus Massal (Cascade)',
        'trash-2'
    );
}

// === PRODUCT MODAL MANAGEMENT ===
function openProductModal(productId = null) {
    let modal = getElement('#productModal');
    if (!modal) {
        createProductModals();
        modal = getElement('#productModal');
    }
    
    const title = getElement('#productModalTitle');
    const form = getElement('#productForm');
    
    if (!form) {
        return;
    }
    
    updateCategorySelects();
    
    if (productId) {
        const product = appData.products.find(p => String(p.id) === String(productId));
        if (!product) {
            showConfirm(
                'Produk tidak ditemukan! Silakan refresh halaman dan coba lagi.',
                () => window.location.reload(),
                'Refresh',
                'Batal',
                'Error',
                'x-circle'
            );
            return;
        }
        
        title.textContent = 'Edit Produk';
        getElement('#productName').value = product.name;
        getElement('#productCategory').value = product.category || 'ATASAN';
        getElement('#productStock').value = product.stock;
        getElement('#productBuyPrice').value = formatNumber(product.buyPrice);
        getElement('#productSellPrice').value = formatNumber(product.sellPrice);
        getElement('#productDescription').value = product.description || '';
        form.dataset.editId = productId;
        
        let productImages = [];
        if (product.images && Array.isArray(product.images)) {
            productImages = product.images.filter(img => 
                img && img !== 'undefined' && img !== 'null' && typeof img === 'string' && img.trim() !== ''
            );
        }
        
        if (productImages.length > 0) {
            const preview = getElement('#imagePreview');
            preview.innerHTML = productImages.map((img, index) => `
                <div class="image-preview-item">
                    <img src="${img}" class="preview-image">
                    <button type="button" class="remove-image-btn" onclick="removeExistingImage(${index})">×</button>
                </div>
            `).join('');
            currentEditingImages = [...productImages];
        }
    } else {
        title.textContent = 'Tambah Produk';
        form.reset();
        getElement('#imagePreview').innerHTML = '';
        currentEditingImages = [];
        delete form.dataset.editId;
    }
    
    modal.style.display = 'block';
    setupImageUpload();
    setupCurrencyInputs();
}

function closeProductModal() {
    const modal = getElement('#productModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    getElement('#imagePreview').innerHTML = '';
    currentEditingImages = [];
    
    const form = getElement('#productForm');
    if (form) {
        form.reset();
        delete form.dataset.editId;
    }
}

// === PRODUCT FORM HANDLING ===
let isSubmitting = false;

async function handleProductSubmitDirect(event) {
    if (isSubmitting) {
        return false;
    }
    
    isSubmitting = true;
    
    const submitBtn = getElement('#submitProductBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        submitBtn.onclick = null;
    }
    
    const form = getElement('#productForm');
    if (!form) {
        isSubmitting = false;
        return false;
    }
    
    const fakeEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        target: form
    };
    
    try {
        await handleProductSubmit(fakeEvent);
    } catch (error) {
        console.error('Submit error:', error);
    } finally {
        isSubmitting = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan';
            submitBtn.onclick = () => handleProductSubmitDirect(event);
        }
    }
    
    return false;
}

async function handleProductSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const form = event.target;
    const editId = form.dataset.editId;
    
    try {
        const productData = {
            name: getElement('#productName').value.trim(),
            category: getElement('#productCategory').value,
            stock: parseInt(getElement('#productStock').value),
            buyPrice: getRawCurrencyValue('#productBuyPrice'),
            sellPrice: getRawCurrencyValue('#productSellPrice'),
            description: getElement('#productDescription').value.trim()
        };
        
        if (!validateProductData(productData)) {
            return;
        }
        
        const imageInput = getElement('#productImages');
        let finalImages = [];
        
        if (editId && currentEditingImages.length > 0) {
            finalImages = [...currentEditingImages];
        }
        
        if (imageInput.files && imageInput.files.length > 0) {
            const newImages = await processImageFiles(imageInput.files);
            finalImages = [...finalImages, ...newImages];
        }
        
        if (finalImages.length === 0 && !editId) {
            finalImages = [createPlaceholderImage('No Image', 400, 400)];
        }
        
        if (finalImages.length > 0) {
            productData.images = finalImages;
        }
        
        const result = await window.saveProduct(productData, editId);
        
        await window.loadProductsFromDB();
        
        closeProductModal();
        currentEditingImages = [];
        
        showConfirm(
            editId ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!',
            null,
            'OK',
            '',
            'Sukses',
            'check-circle'
        );
        
    } catch (error) {
        showConfirm(
            'Error menyimpan produk: ' + error.message,
            null,
            'OK',
            '',
            'Error',
            'x-circle'
        );
    }
}

function validateProductData(data) {
    if (!data.name) {
        showConfirm('Nama produk harus diisi!', null, 'OK');
        return false;
    }
    
    if (!data.category) {
        showConfirm('Kategori harus dipilih!', null, 'OK');
        return false;
    }
    
    if (!validateStock(data.stock)) {
        showConfirm('Stok harus berupa angka positif!', null, 'OK');
        return false;
    }
    
    if (!validatePrice(data.buyPrice)) {
        showConfirm('Harga beli harus berupa angka positif!', null, 'OK');
        return false;
    }
    
    if (!validatePrice(data.sellPrice)) {
        showConfirm('Harga jual harus berupa angka positif!', null, 'OK');
        return false;
    }
    
    if (data.sellPrice <= data.buyPrice) {
        showConfirm('Harga jual harus lebih tinggi dari harga beli!', null, 'OK');
        return false;
    }
    
    return true;
}

async function processImageFiles(files) {
    const validImages = [];
    
    for (const file of files) {
        if (!validateFileType(file)) {
            showConfirm(`File ${file.name} bukan format gambar yang valid!`, null, 'OK');
            continue;
        }
        
        if (!validateFileSize(file, APP_CONFIG.upload.maxFileSize / (1024 * 1024))) {
            showConfirm(`File ${file.name} terlalu besar! Maksimal ${APP_CONFIG.upload.maxFileSize / (1024 * 1024)}MB`, null, 'OK');
            continue;
        }
        
        try {
            const compressedFile = await compressImage(
                file, 
                APP_CONFIG.upload.maxImageWidth, 
                APP_CONFIG.upload.compressionQuality
            );
            const base64 = await imageToBase64(compressedFile);
            validImages.push(base64);
        } catch (error) {
            console.error('Error processing image:', error);
        }
    }
    
    return validImages;
}

// === IMAGE HANDLING ===
function setupImageUpload() {
    const uploadArea = getElement('.image-upload-area');
    const fileInput = getElement('#productImages');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.onclick = () => fileInput.click();
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });
    
    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        fileInput.files = files;
        previewImages();
    }, false);
    
    fileInput.addEventListener('change', previewImages);
}

function previewImages() {
    const input = getElement('#productImages');
    const preview = getElement('#imagePreview');
    
    if (!input.files || input.files.length === 0) return;
    
    let validFiles = [];
    let invalidFiles = [];
    
    Array.from(input.files).forEach(file => {
        if (validateFileSize(file, 2) && validateFileType(file)) {
            validFiles.push(file);
        } else {
            invalidFiles.push(file);
        }
    });
    
    if (invalidFiles.length > 0) {
        showConfirm(
            `${invalidFiles.length} file tidak valid. File yang valid akan tetap diupload.`,
            null,
            'OK'
        );
    }
    
    const existingImages = currentEditingImages.length > 0 ? 
        currentEditingImages.map((img, index) => `
            <div class="image-preview-item">
                <img src="${img}" class="preview-image">
                <button type="button" class="remove-image-btn" onclick="removeExistingImage(${index})">×</button>
            </div>
        `).join('') : '';
    
    let newImagePreviews = '';
    validFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            newImagePreviews += `
                <div class="image-preview-item">
                    <img src="${e.target.result}" class="preview-image">
                    <button type="button" class="remove-image-btn" onclick="removeNewImage(${index})">×</button>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            `;
            
            if (index === validFiles.length - 1) {
                preview.innerHTML = existingImages + newImagePreviews;
            }
        };
        reader.readAsDataURL(file);
    });
    
    if (validFiles.length === 0) {
        preview.innerHTML = existingImages;
    }
}

function removeExistingImage(index) {
    if (currentEditingImages.length > index) {
        currentEditingImages.splice(index, 1);
        
        const preview = getElement('#imagePreview');
        preview.innerHTML = currentEditingImages.map((img, i) => `
            <div class="image-preview-item">
                <img src="${img}" class="preview-image">
                <button type="button" class="remove-image-btn" onclick="removeExistingImage(${i})">×</button>
            </div>
        `).join('');
    }
}

function removeNewImage(index) {
    const input = getElement('#productImages');
    const dt = new DataTransfer();
    
    Array.from(input.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    
    input.files = dt.files;
    previewImages();
}

// === CREATE MODALS ===
function createProductModals() {
    const modalContainer = getElement('#modalContainer');
    if (!modalContainer) {
        return;
    }
    
    modalContainer.innerHTML += createProductModalHTML() + createProductPreviewModalHTML() + createBulkEditModalHTML();
    
    const bulkEditForm = getElement('#bulkEditForm');
    if (bulkEditForm) {
        bulkEditForm.addEventListener('submit', saveBulkEdit);
    }
}

function createProductPreviewModal() {
    const modalContainer = getElement('#modalContainer');
    if (!modalContainer) return;
    
    modalContainer.innerHTML += createProductPreviewModalHTML();
    setTimeout(initializeIcons, 50);
}

function createProductModalHTML() {
    return `
        <div id="productModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="productModalTitle">Tambah Produk</h3>
                    <button class="close-btn" onclick="closeProductModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form id="productForm">
                    <div class="filter-row">
                        <div class="form-group" style="flex: 2;">
                            <label>Nama Produk</label>
                            <input type="text" id="productName" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Kategori</label>
                            <div style="display: flex; gap: 6px;">
                                <select id="productCategory" required style="flex: 1;">
                                    <option value="">Pilih Kategori</option>
                                </select>
                                <button type="button" class="btn btn-secondary btn-compact" onclick="addNewCategory()" title="Tambah Kategori Baru">
                                    <i data-lucide="plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Stok Awal</label>
                            <input type="number" id="productStock" min="0" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Harga Beli (Rp)</label>
                            <input type="text" id="productBuyPrice" placeholder="20.000" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Harga Jual (Rp)</label>
                            <input type="text" id="productSellPrice" placeholder="30.000" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Foto Produk (Max 2MB per foto)</label>
                        <div class="image-upload-area">
                            <i data-lucide="upload"></i>
                            <p>Klik untuk upload atau drag & drop gambar</p>
                            <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">Maksimal 2MB per gambar</p>
                        </div>
                        <input type="file" id="productImages" accept="image/*" multiple style="display: none;">
                        <div id="imagePreview" class="image-preview-container"></div>
                    </div>
                    <div class="form-group">
                        <label>Deskripsi</label>
                        <textarea id="productDescription" rows="3"></textarea>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: end; margin-top: 20px;">
                        <button type="button" class="btn btn-secondary" onclick="closeProductModal()">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="handleProductSubmitDirect(event)" id="submitProductBtn">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function createProductPreviewModalHTML() {
    return `
        <div id="productPreviewModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="previewProductName">Detail Produk</h3>
                    <button class="close-btn" onclick="closeProductPreview()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div id="productPreviewContent"></div>
            </div>
        </div>
    `;
}

// ENHANCED: Bulk Edit Modal with Description Support
function createBulkEditModalHTML() {
    return `
        <div id="bulkEditModal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i data-lucide="edit"></i>
                        Edit Massal Produk
                    </h3>
                    <button class="close-btn" onclick="closeBulkEditModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form id="bulkEditForm">
                    <div class="alert alert-info">
                        <i data-lucide="info"></i>
                        <strong>Info:</strong> Kosongkan field yang tidak ingin diubah. Perubahan akan diterapkan ke <span id="selectedProductCount" style="color: var(--accent-color); font-weight: 700;">0</span> produk yang dipilih.
                    </div>
                    
                    <!-- Basic Fields -->
                    <div class="filter-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Kategori Baru</label>
                            <select id="bulkCategory">
                                <option value="">Tidak Diubah</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Tambah/Kurang Stok</label>
                            <input type="number" id="bulkStockChange" placeholder="Contoh: +10 atau -5">
                        </div>
                    </div>
                    
                    <!-- Price Fields -->
                    <div class="filter-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Harga Beli Baru (Rp)</label>
                            <input type="text" id="bulkBuyPrice" placeholder="Kosongkan jika tidak diubah">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Harga Jual Baru (Rp)</label>
                            <input type="text" id="bulkSellPrice" placeholder="Kosongkan jika tidak diubah">
                        </div>
                    </div>
                    
                    <!-- NEW: Description Section -->
                    <div class="form-group">
                        <label>
                            <i data-lucide="file-text"></i>
                            Edit Deskripsi Massal
                        </label>
                        <div class="filter-row description-controls" style="align-items: center; margin-bottom: 8px;">
                            <select id="bulkDescriptionAction" onchange="toggleDescriptionField()">
                                <option value="">Tidak Diubah</option>
                                <option value="replace">Ganti Semua Deskripsi</option>
                                <option value="append">Tambah di Akhir</option>
                                <option value="prepend">Tambah di Awal</option>
                                <option value="clear">Hapus Semua Deskripsi</option>
                            </select>
                            <button type="button" class="btn btn-info btn-compact" onclick="previewDescriptionChanges()" title="Preview Perubahan">
                                <i data-lucide="eye"></i>
                                Preview
                            </button>
                        </div>
                        <textarea 
                            id="bulkDescription" 
                            rows="3" 
                            placeholder="Masukkan teks deskripsi..."
                            style="display: none;"
                        ></textarea>
                        <div id="descriptionPreview" style="display: none; background: var(--bg-tertiary); padding: 12px; border-radius: 6px; margin-top: 8px; max-height: 400px; overflow-y: auto;">
                            <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                                <i data-lucide="eye"></i>
                                Preview Perubahan Deskripsi:
                            </div>
                            <div id="previewContent"></div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px; justify-content: end; margin-top: 20px;">
                        <button type="button" class="btn btn-secondary" onclick="closeBulkEditModal()">
                            <i data-lucide="x"></i>
                            Batal
                        </button>
                        <button type="submit" class="btn btn-warning">
                            <i data-lucide="save"></i>
                            Terapkan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// === CATEGORY MANAGEMENT ===
async function addNewCategory() {
    const categoryName = prompt('Masukkan nama kategori baru:');
    if (categoryName && categoryName.trim()) {
        const newCategory = categoryName.trim().toUpperCase();
        if (!appData.categories.includes(newCategory)) {
            appData.categories.push(newCategory);
            appData.categories.sort();
            updateCategorySelects();
            getElement('#productCategory').value = newCategory;
            
            showConfirm(
                `Kategori "${newCategory}" berhasil ditambahkan!`,
                null,
                'OK',
                '',
                'Sukses',
                'check-circle'
            );
        } else {
            showConfirm('Kategori sudah ada!', null, 'OK');
        }
    }
}

// Helper functions
function updateCategorySelects() {
    const selects = ['productCategory', 'bulkCategory', 'categoryFilter'];
    selects.forEach(selectId => {
        const select = getElement(`#${selectId}`);
        if (select) {
            const currentValue = select.value;
            const isRequired = select.hasAttribute('required');
            
            select.innerHTML = isRequired ? 
                '<option value="">Pilih Kategori</option>' : 
                '<option value="">Semua Kategori</option>';
            
            if (selectId === 'bulkCategory') {
                select.innerHTML = '<option value="">Tidak Diubah</option>';
            }
            
            appData.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
            
            if (currentValue && appData.categories.includes(currentValue)) {
                select.value = currentValue;
            }
        }
    });
}

function loadCategoriesFromProducts() {
    const existingCategories = new Set(appData.categories);
    appData.products.forEach(product => {
        if (product.category) {
            existingCategories.add(product.category);
        }
    });
    appData.categories = Array.from(existingCategories).sort();
    updateCategorySelects();
}

function loadProductOptions() {
    const select = getElement('#saleProductId');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Pilih Produk</option>' + 
            appData.products
                .filter(product => product.stock > 0)
                .map(product => 
                    `<option value="${product.id}">${product.name} (Stok: ${product.stock})</option>`
                ).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    }
}

// Make functions globally available
window.loadProducts = loadProducts;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProductDirect = deleteProductDirect;
window.updateStock = updateStock;
window.previewProduct = previewProduct;
window.closeProductPreview = closeProductPreview;
window.bulkDeleteProducts = bulkDeleteProducts;
window.addNewCategory = addNewCategory;
window.toggleSelectAll = toggleSelectAll;
window.updateBulkActions = updateBulkActions;
window.clearSelection = clearSelection;
window.openBulkEditModal = openBulkEditModal;
window.closeBulkEditModal = closeBulkEditModal;
window.sortProducts = sortProducts;
window.filterProducts = filterProducts;
window.handleProductSubmitDirect = handleProductSubmitDirect;
window.removeExistingImage = removeExistingImage;
window.removeNewImage = removeNewImage;
window.loadCategoriesFromProducts = loadCategoriesFromProducts;
window.loadProductOptions = loadProductOptions;
window.changeImage = changeImage;
window.selectImage = selectImage;
window.toggleDescriptionField = toggleDescriptionField;
window.previewDescriptionChanges = previewDescriptionChanges;
window.showFullScreenImage = showFullScreenImage;
window.closeFullScreenImage = closeFullScreenImage;