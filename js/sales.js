// js/sales.js - ENHANCED VERSION WITH SOURCE SORTING

// === SALES MANAGEMENT ===

// === SOLD PRODUCTS MANAGEMENT WITH SOURCE FILTERING ===
function loadSoldProducts() {
    createSoldProductsPageStructure();
    
    const tbody = getElement('#soldProductsTable tbody');
    if (!tbody) {
        console.error('Sold products table body not found');
        return;
    }
    
    // Get completed sales
    const completedSales = appData.sales.filter(sale => sale.status === 'completed');
    
    if (completedSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="shopping-cart"></i></div>
                    <div class="empty-state-text">Belum ada penjualan</div>
                    <div class="empty-state-subtext">Catat penjualan pertama Anda</div>
                </td>
            </tr>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    // Apply filters and sorting
    let filteredSales = applySoldProductsFilters(completedSales);
    filteredSales = applySoldProductsSorting(filteredSales);
    
    // Update summary stats
    updateSoldProductsSummary(filteredSales);
    
    // Render table
    tbody.innerHTML = filteredSales.map(sale => {
        const product = findProductById(sale.productId);
        const productName = product ? product.name : 'Produk Dihapus';
        
        return `
            <tr data-sale-id="${sale.id}">
                <td>${formatDate(sale.date)}</td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${productName}</div>
                    ${product && product.category ? 
                        `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                            <span class="category-badge ${getCategoryBadgeClass(product.category)}">${product.category}</span>
                        </div>` : ''
                    }
                </td>
                <td style="text-align: center; font-weight: 600;">${formatNumber(sale.quantity)}</td>
                <td>${formatCurrency(sale.sellPrice)}</td>
                <td style="font-weight: 600; color: var(--success-color);">${formatCurrency(sale.total)}</td>
                <td style="font-weight: 600; color: var(--warning-color);">${formatCurrency(sale.profit)}</td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 3px;">${sale.customerName}</div>
                    <span class="source-badge ${getSourceBadgeClass(sale.source)}">${getSourceText(sale.source)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-icon-danger" onclick="cancelSaleConfirm('${sale.id}')" title="Batalkan Penjualan">
                            <i data-lucide="x-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    setTimeout(initializeIcons, 50);
}

function createSoldProductsPageStructure() {
    const soldProductsPage = getElement('#sold-productsPage');
    if (!soldProductsPage || soldProductsPage.innerHTML.trim()) return;
    
    soldProductsPage.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <i data-lucide="shopping-cart"></i>
                    Produk Terjual
                </h1>
            </div>
            <div class="page-actions">
                <button class="btn btn-success" onclick="openSalesModal()">
                    <i data-lucide="plus"></i>
                    Catat Penjualan
                </button>
            </div>
        </div>

        <!-- Enhanced Filters with Source Sorting -->
        <div class="filters">
            <div class="filter-row">
                <div class="search-box">
                    <input type="text" id="soldProductSearch" placeholder="Cari produk atau pelanggan..." onkeyup="filterSoldProducts()">
                </div>
                <div class="filter-group">
                    <label>Sumber:</label>
                    <select id="sourceFilter" onchange="filterSoldProducts()">
                        <option value="">Semua Sumber</option>
                        <option value="offline">Toko Offline</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok Shop</option>
                        <option value="shopee">Shopee</option>
                        <option value="website">Website</option>
                        <option value="whatsapp">WhatsApp</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Periode:</label>
                    <select id="soldProductsPeriodFilter" onchange="filterSoldProducts()">
                        <option value="">Semua Waktu</option>
                        <option value="today">Hari Ini</option>
                        <option value="7">7 Hari Terakhir</option>
                        <option value="30">30 Hari Terakhir</option>
                        <option value="90">3 Bulan Terakhir</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Urutkan:</label>
                    <select id="soldProductsSort" onchange="sortSoldProducts()">
                        <option value="newest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                        <option value="highest-value">Nilai Tertinggi</option>
                        <option value="lowest-value">Nilai Terendah</option>
                        <option value="highest-profit">Profit Tertinggi</option>
                        <option value="customer-name">Nama Pelanggan A-Z</option>
                        <option value="product-name">Nama Produk A-Z</option>
                        <option value="source">Sumber A-Z</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Summary Stats -->
        <div class="summary-stats" id="soldProductsSummary">
            <div class="summary-item">
                <div class="summary-label">Total Penjualan</div>
                <div class="summary-value success" id="summaryTotalSales">Rp 0</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Keuntungan</div>
                <div class="summary-value warning" id="summaryTotalProfit">Rp 0</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Item</div>
                <div class="summary-value info" id="summaryTotalItems">0</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Transaksi</div>
                <div class="summary-value primary" id="summaryTotalTransactions">0</div>
            </div>
        </div>



        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Daftar Penjualan</h3>
                <button class="btn btn-info btn-compact" onclick="exportSoldProducts()" title="Export ke Excel">
                    <i data-lucide="download"></i>
                    Export
                </button>
            </div>
            <table id="soldProductsTable">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Produk</th>
                        <th>Qty</th>
                        <th>Harga Satuan</th>
                        <th>Total</th>
                        <th>Keuntungan</th>
                        <th>Pelanggan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
    
    setTimeout(initializeIcons, 50);
}

// === FILTERING AND SORTING FUNCTIONS ===
function getSoldProductsDateRange(period) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    let startDate = new Date(now);
    
    switch(period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '7':
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '30':
            startDate.setDate(startDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '90':
            startDate.setDate(startDate.getDate() - 89);
            startDate.setHours(0, 0, 0, 0);
            break;
        default:
            // Semua waktu - set ke tanggal yang sangat lama
            startDate = new Date('2000-01-01');
            break;
    }
    
    console.log(`📅 Date range for period "${period}":`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });
    
    return { startDate, endDate };
}

function applySoldProductsFilters(sales) {
    const search = getElement('#soldProductSearch')?.value.toLowerCase() || '';
    const sourceFilter = getElement('#sourceFilter')?.value || '';
    const periodFilter = getElement('#soldProductsPeriodFilter')?.value || '';
    
    console.log('🔧 Applying filters:', { search, sourceFilter, periodFilter });
    console.log('📊 Input sales count:', sales.length);
    
    const filteredSales = sales.filter(sale => {
        // Search filter
        const product = findProductById(sale.productId);
        const productName = product ? product.name.toLowerCase() : '';
        const customerName = sale.customerName.toLowerCase();
        const searchMatch = !search || 
            productName.includes(search) || 
            customerName.includes(search) ||
            getSourceText(sale.source).toLowerCase().includes(search);
        
        // Source filter
        const sourceMatch = !sourceFilter || sale.source === sourceFilter;
        
        // Period filter
        let periodMatch = true;
        if (periodFilter) {
            const saleDate = new Date(sale.date);
            const { startDate, endDate } = getSoldProductsDateRange(periodFilter);
            periodMatch = saleDate >= startDate && saleDate <= endDate;
            
            // Debug individual sale date check
            if (!periodMatch) {
                console.log(`❌ Sale filtered out: ${sale.customerName} - ${saleDate.toISOString()} not in range`);
            }
        }
        
        return searchMatch && sourceMatch && periodMatch;
    });
    
    console.log('✅ Filtered sales count:', filteredSales.length);
    return filteredSales;
}

function applySoldProductsSorting(sales) {
    const sortValue = getElement('#soldProductsSort')?.value || 'newest';
    
    return [...sales].sort((a, b) => {
        switch(sortValue) {
            case 'newest':
                return new Date(b.date) - new Date(a.date);
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'highest-value':
                return b.total - a.total;
            case 'lowest-value':
                return a.total - b.total;
            case 'highest-profit':
                return b.profit - a.profit;
            case 'customer-name':
                return a.customerName.localeCompare(b.customerName);
            case 'product-name':
                const productA = findProductById(a.productId);
                const productB = findProductById(b.productId);
                const nameA = productA ? productA.name : 'Z';
                const nameB = productB ? productB.name : 'Z';
                return nameA.localeCompare(nameB);
            case 'source':
                return getSourceText(a.source).localeCompare(getSourceText(b.source));
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
}

function filterSoldProducts() {
    console.log('🔍 Filtering sold products...');
    const periodValue = getElement('#soldProductsPeriodFilter')?.value || '';
    const sourceValue = getElement('#sourceFilter')?.value || '';
    const searchValue = getElement('#soldProductSearch')?.value || '';
    
    console.log('📅 Period:', periodValue, '🏪 Source:', sourceValue, '🔎 Search:', searchValue);
    
    loadSoldProducts();
}

function sortSoldProducts() {
    loadSoldProducts();
}

// === SUMMARY STATS UPDATE ===
function updateSoldProductsSummary(filteredSales) {
    const totalSales = sum(filteredSales, 'total');
    const totalProfit = sum(filteredSales, 'profit');
    const totalItems = sum(filteredSales, 'quantity');
    const totalTransactions = filteredSales.length;
    
    updateElement('#summaryTotalSales', formatCurrency(totalSales));
    updateElement('#summaryTotalProfit', formatCurrency(totalProfit));
    updateElement('#summaryTotalItems', formatNumber(totalItems));
    updateElement('#summaryTotalTransactions', formatNumber(totalTransactions));
}



// === EXPORT FUNCTION ===
async function exportSoldProducts() {
    try {
        if (typeof XLSX === 'undefined') {
            showConfirm('Library Excel tidak tersedia!', null, 'OK');
            return;
        }
        
        const completedSales = appData.sales.filter(sale => sale.status === 'completed');
        const filteredSales = applySoldProductsFilters(completedSales);
        
        if (filteredSales.length === 0) {
            showConfirm('Tidak ada data untuk diekspor!', null, 'OK');
            return;
        }
        
        const exportData = filteredSales.map(sale => {
            const product = findProductById(sale.productId);
            return {
                'Tanggal': formatDate(sale.date),
                'Produk': product ? product.name : 'Produk Dihapus',
                'Kategori': product ? product.category : '-',
                'Qty': sale.quantity,
                'Harga Satuan': sale.sellPrice,
                'Total': sale.total,
                'Keuntungan': sale.profit,
                'Pelanggan': sale.customerName,
                'Sumber': getSourceText(sale.source)
            };
        });
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Auto-size columns
        const colWidths = Object.keys(exportData[0]).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key]).length))
        }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Produk Terjual');
        
        // Include filter info in filename
        const currentPeriod = getElement('#soldProductsPeriodFilter')?.value || '';
        const currentSource = getElement('#sourceFilter')?.value || '';
        let filenameSuffix = '';
        
        if (currentPeriod) {
            const periodTexts = {
                'today': 'hari-ini',
                '7': '7-hari',
                '30': '30-hari', 
                '90': '90-hari'
            };
            filenameSuffix += `-${periodTexts[currentPeriod]}`;
        }
        
        if (currentSource) {
            filenameSuffix += `-${currentSource}`;
        }
        
        const fileName = `produk-terjual${filenameSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showConfirm(
            `Data berhasil diekspor ke file: ${fileName}`,
            null,
            'OK',
            '',
            'Sukses',
            'check-circle'
        );
        
    } catch (error) {
        console.error('Export error:', error);
        showConfirm(
            'Error mengekspor data: ' + error.message,
            null,
            'OK',
            '',
            'Error',
            'x-circle'
        );
    }
}

// === CANCELLED ORDERS MANAGEMENT ===
function loadCancelledOrders() {
    createCancelledOrdersPageStructure();
    
    const tbody = getElement('#cancelledOrdersTable tbody');
    if (!tbody) return;
    
    const cancelledSales = appData.sales.filter(sale => sale.status === 'cancelled');
    
    if (cancelledSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="x-circle"></i></div>
                    <div class="empty-state-text">Tidak ada order yang dibatalkan</div>
                    <div class="empty-state-subtext">Semua penjualan berjalan lancar!</div>
                </td>
            </tr>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    // Sort by cancellation date (newest first)
    const sortedSales = cancelledSales.sort((a, b) => new Date(b.cancelledAt || b.date) - new Date(a.cancelledAt || a.date));
    
    tbody.innerHTML = sortedSales.map(sale => {
        const product = findProductById(sale.productId);
        const productName = product ? product.name : 'Produk Dihapus';
        
        return `
            <tr data-sale-id="${sale.id}">
                <td>${formatDate(sale.cancelledAt || sale.date)}</td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${productName}</div>
                    ${product && product.category ? 
                        `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                            <span class="category-badge ${getCategoryBadgeClass(product.category)}">${product.category}</span>
                        </div>` : ''
                    }
                </td>
                <td style="text-align: center; font-weight: 600;">${formatNumber(sale.quantity)}</td>
                <td>${formatCurrency(sale.total)}</td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 3px;">${sale.customerName}</div>
                    <span class="source-badge ${getSourceBadgeClass(sale.source)}">${getSourceText(sale.source)}</span>
                </td>
                <td>
                    <span style="color: var(--danger-color); font-weight: 600;">
                        <i data-lucide="x-circle" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                        Dibatalkan
                    </span>
                </td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="permanentDeleteSale('${sale.id}')" title="Hapus Permanen">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    setTimeout(initializeIcons, 50);
}

function createCancelledOrdersPageStructure() {
    const cancelledOrdersPage = getElement('#cancelled-ordersPage');
    if (!cancelledOrdersPage || cancelledOrdersPage.innerHTML.trim()) return;
    
    cancelledOrdersPage.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <i data-lucide="x-circle"></i>
                    Order Dibatalkan
                </h1>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Daftar Order Dibatalkan</h3>
            </div>
            <table id="cancelledOrdersTable">
                <thead>
                    <tr>
                        <th>Tanggal Batal</th>
                        <th>Produk</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Pelanggan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
    
    setTimeout(initializeIcons, 50);
}

// === UTILITY FUNCTIONS FOR SOURCES ===
function getSourceText(source) {
    const sourceTexts = {
        'offline': 'Toko Offline',
        'instagram': 'Instagram',
        'tiktok': 'TikTok Shop',
        'shopee': 'Shopee',
        'website': 'Website',
        'whatsapp': 'WhatsApp'
    };
    return sourceTexts[source] || source;
}

function getSourceBadgeClass(source) {
    const badgeClasses = {
        'offline': 'source-offline',
        'instagram': 'source-instagram',
        'tiktok': 'source-tiktok',
        'shopee': 'source-shopee',
        'website': 'source-website',
        'whatsapp': 'source-whatsapp'
    };
    return badgeClasses[source] || 'source-default';
}

function getSourceColor(source) {
    const colors = {
        'offline': '#6b7280',
        'instagram': '#e1306c',
        'tiktok': '#000000',
        'shopee': '#ff5722',
        'website': '#3b82f6',
        'whatsapp': '#25d366'
    };
    return colors[source] || '#6b7280';
}

// === ADDITIONAL SALES ACTIONS ===
async function permanentDeleteSale(saleId) {
    const sale = getSaleById(saleId);
    if (!sale) return;
    
    showConfirm(
        'Yakin ingin menghapus permanen penjualan ini? Data tidak dapat dikembalikan.',
        async () => {
            try {
                await window.deleteSale(saleId);
                
                // Update UI
                if (appData.ui.currentPage === 'cancelled-orders') {
                    loadCancelledOrders();
                }
                updateDashboard();
                updateCancelledBadge();
                
                showConfirm(
                    'Penjualan berhasil dihapus permanen!',
                    null,
                    'OK',
                    '',
                    'Sukses',
                    'check-circle'
                );
            } catch (error) {
                showConfirm(
                    'Error menghapus penjualan: ' + error.message,
                    null,
                    'OK',
                    '',
                    'Error',
                    'x-circle'
                );
            }
        },
        'Ya, Hapus Permanen',
        'Batal',
        'Konfirmasi Hapus Permanen',
        'trash-2'
    );
}

// === COUPONS MANAGEMENT ===
function loadCoupons() {
    createCouponsPageStructure();
    
    const container = getElement('#couponsContainer');
    if (!container) return;
    
    const now = new Date();
    const activeCoupons = appData.coupons.filter(c => 
        new Date(c.endDate) > now && c.usageCount < c.usageLimit
    );
    const expiredCoupons = appData.coupons.filter(c => 
        new Date(c.endDate) <= now || c.usageCount >= c.usageLimit
    );
    
    // Update summary stats
    updateElement('#totalCoupons', formatNumber(appData.coupons.length));
    updateElement('#activeCoupons', formatNumber(activeCoupons.length));
    updateElement('#expiredCoupons', formatNumber(expiredCoupons.length));
    updateElement('#usedCoupons', formatNumber(sum(appData.coupons, 'usageCount')));
    
    if (appData.coupons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="ticket"></i></div>
                <div class="empty-state-text">Belum ada kupon</div>
                <div class="empty-state-subtext">Buat kupon pertama untuk menarik pelanggan</div>
            </div>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    container.innerHTML = appData.coupons.map(coupon => {
        const isActive = new Date(coupon.endDate) > now && coupon.usageCount < coupon.usageLimit;
        const usagePercentage = (coupon.usageCount / coupon.usageLimit) * 100;
        
        return `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; margin-bottom: 12px; transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="font-family: 'Courier New', monospace; font-size: 1.1rem; font-weight: bold; color: var(--accent-color); background: rgba(59, 130, 246, 0.1); padding: 6px 12px; border-radius: 6px; display: inline-block; margin-bottom: 8px;">
                            ${coupon.code}
                        </div>
                        <span style="padding: 3px 8px; border-radius: 16px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; ${isActive ? 'background: rgba(16, 185, 129, 0.2); color: var(--success-color);' : 'background: rgba(239, 68, 68, 0.2); color: var(--danger-color);'}">
                            ${isActive ? 'Aktif' : 'Kadaluarsa'}
                        </span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-warning btn-compact" onclick="editCoupon('${coupon.id}')" title="Edit Kupon">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn btn-danger btn-compact" onclick="deleteCouponConfirm('${coupon.id}')" title="Hapus Kupon">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 3px;">Nilai Diskon</div>
                        <div style="font-weight: 600; color: var(--text-primary);">
                            ${coupon.type === 'percentage' ? formatPercentage(coupon.value) : formatCurrency(coupon.value)}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 3px;">Min. Pembelian</div>
                        <div style="font-weight: 600; color: var(--text-primary);">
                            ${coupon.minimum > 0 ? formatCurrency(coupon.minimum) : 'Tanpa minimum'}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 3px;">Penggunaan</div>
                        <div style="font-weight: 600; color: var(--text-primary);">
                            ${formatNumber(coupon.usageCount)} / ${formatNumber(coupon.usageLimit)}
                            <div style="width: 100%; height: 3px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 3px;">
                                <div style="width: ${usagePercentage}%; height: 100%; background: var(--accent-color); border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 3px;">Berlaku Sampai</div>
                        <div style="font-weight: 600; color: var(--text-primary);">${formatDate(coupon.endDate)}</div>
                    </div>
                </div>
                
                ${coupon.description ? 
                    `<div style="padding: 8px; background: var(--bg-tertiary); border-radius: 6px; font-size: 0.8rem; color: var(--text-secondary);">
                        ${coupon.description}
                    </div>` : ''
                }
            </div>
        `;
    }).join('');
    
    setTimeout(initializeIcons, 50);
}

function createCouponsPageStructure() {
    const couponsPage = getElement('#couponsPage');
    if (!couponsPage || couponsPage.innerHTML.trim()) return;
    
    couponsPage.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <i data-lucide="ticket"></i>
                    Kelola Kupon
                </h1>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="openCouponModal()">
                    <i data-lucide="plus"></i>
                    Buat Kupon Baru
                </button>
            </div>
        </div>

        <div class="summary-stats">
            <div class="summary-item">
                <div class="summary-label">Total Kupon</div>
                <div class="summary-value info" id="totalCoupons">0</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Kupon Aktif</div>
                <div class="summary-value success" id="activeCoupons">0</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Kupon Kadaluarsa</div>
                <div class="summary-value danger" id="expiredCoupons">0</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Digunakan</div>
                <div class="summary-value warning" id="usedCoupons">0</div>
            </div>
        </div>

        <div id="couponsContainer"></div>
    `;
    
    // Create coupon modal
    createCouponModal();
    
    setTimeout(initializeIcons, 50);
}

// === SALES MODAL ===
function openSalesModal() {
    let modal = getElement('#salesModal');
    if (!modal) {
        createSalesModal();
        modal = getElement('#salesModal');
    }
    
    const form = getElement('#salesForm');
    if (form) {
        form.reset();
    }
    
    // Update product options
    loadProductOptions();
    
    modal.style.display = 'block';
}

function closeSalesModal() {
    const modal = getElement('#salesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleSalesSubmit(event) {
    event.preventDefault();
    
    try {
        const saleData = {
            productId: getElement('#saleProductId').value,
            quantity: parseInt(getElement('#saleQuantity').value),
            customerName: getElement('#customerName').value.trim(),
            source: getElement('#saleSource').value,
            sellPrice: 0 // Will be set from product data
        };
        
        // Validate sale data
        if (!validateSaleData(saleData)) {
            return;
        }
        
        // Get product for price using FIXED function
        const product = findProductById(saleData.productId);
        
        if (!product) {
            showConfirm('Produk tidak ditemukan!', null, 'OK');
            return;
        }
        
        // Check stock
        if (product.stock < saleData.quantity) {
            showConfirm(
                `Stok tidak mencukupi! Stok tersedia: ${product.stock}, yang diminta: ${saleData.quantity}`,
                null,
                'OK',
                '',
                'Stok Habis',
                'alert-triangle'
            );
            return;
        }
        
        saleData.sellPrice = product.sellPrice;
        
        await window.saveSale(saleData);
        
        closeSalesModal();
        
        // Update UI immediately
        if (appData.ui.currentPage === 'sold-products') {
            loadSoldProducts();
        }
        
        updateDashboard();
        
        showConfirm(
            'Penjualan berhasil dicatat!',
            null,
            'OK',
            '',
            'Sukses',
            'check-circle'
        );
        
    } catch (error) {
        showConfirm(
            'Error menyimpan penjualan: ' + error.message,
            null,
            'OK',
            '',
            'Error',
            'x-circle'
        );
    }
}

function validateSaleData(data) {
    if (!data.productId) {
        showConfirm('Pilih produk terlebih dahulu!', null, 'OK');
        return false;
    }
    
    if (!validateNumber(data.quantity, 1)) {
        showConfirm('Jumlah harus berupa angka positif!', null, 'OK');
        return false;
    }
    
    if (!data.customerName) {
        showConfirm('Nama pelanggan harus diisi!', null, 'OK');
        return false;
    }
    
    if (!data.source) {
        showConfirm('Sumber penjualan harus dipilih!', null, 'OK');
        return false;
    }
    
    return true;
}

function createSalesModal() {
    const modalContainer = getElement('#modalContainer');
    if (!modalContainer) return;
    
    // Check if modal already exists
    if (getElement('#salesModal')) return;
    
    modalContainer.innerHTML += `
        <div id="salesModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Catat Penjualan Baru</h3>
                    <button class="close-btn" onclick="closeSalesModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form id="salesForm">
                    <div class="filter-row">
                        <div class="form-group" style="flex: 2;">
                            <label>Produk</label>
                            <select id="saleProductId" required>
                                <option value="">Pilih Produk</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Jumlah</label>
                            <input type="number" id="saleQuantity" min="1" required>
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="form-group" style="flex: 2;">
                            <label>Nama Pelanggan</label>
                            <input type="text" id="customerName" placeholder="Nama pelanggan" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Sumber Penjualan</label>
                            <select id="saleSource" required>
                                <option value="">Pilih Sumber</option>
                                <option value="offline">Toko Offline</option>
                                <option value="instagram">Instagram</option>
                                <option value="tiktok">TikTok Shop</option>
                                <option value="shopee">Shopee</option>
                                <option value="website">Website</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: end; margin-top: 20px;">
                        <button type="button" class="btn btn-secondary" onclick="closeSalesModal()">Batal</button>
                        <button type="submit" class="btn btn-success">Simpan Penjualan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    const salesForm = getElement('#salesForm');
    if (salesForm) {
        salesForm.addEventListener('submit', handleSalesSubmit);
    }
    
    setTimeout(initializeIcons, 50);
}

// === COUPON MODAL ===
function openCouponModal(couponId = null) {
    let modal = getElement('#couponModal');
    if (!modal) {
        createCouponModal();
        modal = getElement('#couponModal');
    }
    
    const title = getElement('#couponModalTitle');
    const form = getElement('#couponForm');
    
    if (couponId) {
        const coupon = getCouponById(couponId);
        if (!coupon) return;
        
        title.textContent = 'Edit Kupon';
        getElement('#couponCode').value = coupon.code;
        getElement('#couponType').value = coupon.type;
        getElement('#couponValue').value = coupon.value;
        getElement('#couponMinimum').value = coupon.minimum || '';
        getElement('#couponUsageLimit').value = coupon.usageLimit;
        getElement('#couponStartDate').value = new Date(coupon.startDate).toISOString().slice(0, 16);
        getElement('#couponEndDate').value = new Date(coupon.endDate).toISOString().slice(0, 16);
        getElement('#couponDescription').value = coupon.description || '';
        form.dataset.editId = couponId;
    } else {
        title.textContent = 'Buat Kupon Baru';
        form.reset();
        delete form.dataset.editId;
        
        // Set default dates
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        getElement('#couponStartDate').value = now.toISOString().slice(0, 16);
        getElement('#couponEndDate').value = tomorrow.toISOString().slice(0, 16);
    }
    
    modal.style.display = 'block';
}

function closeCouponModal() {
    const modal = getElement('#couponModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleCouponSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const editId = form.dataset.editId;
    
    try {
        const couponData = {
            code: getElement('#couponCode').value.toUpperCase().trim(),
            type: getElement('#couponType').value,
            value: parseFloat(getElement('#couponValue').value),
            minimum: parseFloat(getElement('#couponMinimum').value) || 0,
            usageLimit: parseInt(getElement('#couponUsageLimit').value),
            startDate: new Date(getElement('#couponStartDate').value).toISOString(),
            endDate: new Date(getElement('#couponEndDate').value).toISOString(),
            description: getElement('#couponDescription').value.trim()
        };
        
        await window.saveCoupon(couponData, editId);
        closeCouponModal();
        
        showConfirm(
            editId ? 'Kupon berhasil diupdate!' : 'Kupon berhasil dibuat!',
            null,
            'OK',
            '',
            'Sukses',
            'check-circle'
        );
        
    } catch (error) {
        showConfirm(
            'Error menyimpan kupon: ' + error.message,
            null,
            'OK',
            '',
            'Error',
            'x-circle'
        );
    }
}

function createCouponModal() {
    const modalContainer = getElement('#modalContainer');
    if (!modalContainer) return;
    
    // Check if modal already exists
    if (getElement('#couponModal')) return;
    
    modalContainer.innerHTML += `
        <div id="couponModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="couponModalTitle">Buat Kupon Baru</h3>
                    <button class="close-btn" onclick="closeCouponModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form id="couponForm">
                    <div class="filter-row">
                        <div class="form-group" style="flex: 2;">
                            <label>Kode Kupon</label>
                            <input type="text" id="couponCode" required placeholder="Contoh: DISKON50">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Tipe Diskon</label>
                            <select id="couponType" required>
                                <option value="percentage">Persentase (%)</option>
                                <option value="fixed">Nominal (Rp)</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Nilai Diskon</label>
                            <input type="number" id="couponValue" min="0" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Minimum Pembelian</label>
                            <input type="number" id="couponMinimum" min="0" placeholder="0 = tanpa minimum">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Maksimal Penggunaan</label>
                            <input type="number" id="couponUsageLimit" min="1" placeholder="1 = sekali pakai">
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Tanggal Mulai</label>
                            <input type="datetime-local" id="couponStartDate" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Tanggal Berakhir</label>
                            <input type="datetime-local" id="couponEndDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Deskripsi Kupon</label>
                        <textarea id="couponDescription" rows="3" placeholder="Deskripsi kupon untuk website"></textarea>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: end; margin-top: 20px;">
                        <button type="button" class="btn btn-secondary" onclick="closeCouponModal()">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan Kupon</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    const couponForm = getElement('#couponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponSubmit);
    }
    
    setTimeout(initializeIcons, 50);
}

// === SALES ACTIONS ===
function cancelSaleConfirm(saleId) {
    const sale = getSaleById(saleId);
    if (!sale) {
        showConfirm('Penjualan tidak ditemukan!', null, 'OK');
        return;
    }
    
    showConfirm(
        'Yakin ingin membatalkan penjualan ini? Stok akan dikembalikan.',
        async () => {
            try {
                await window.cancelSale(saleId);
                
                // Update UI immediately
                if (appData.ui.currentPage === 'sold-products') {
                    loadSoldProducts();
                }
                if (appData.ui.currentPage === 'cancelled-orders') {
                    loadCancelledOrders();
                }
                
                updateDashboard();
                updateCancelledBadge();
                
                showConfirm(
                    'Penjualan berhasil dibatalkan!',
                    null,
                    'OK',
                    '',
                    'Sukses',
                    'check-circle'
                );
            } catch (error) {
                showConfirm(
                    'Error membatalkan penjualan: ' + error.message,
                    null,
                    'OK',
                    '',
                    'Error',
                    'x-circle'
                );
            }
        },
        'Ya, Batalkan',
        'Batal',
        'Konfirmasi Pembatalan',
        'x-circle'
    );
}

function editCoupon(id) {
    openCouponModal(id);
}

function deleteCouponConfirm(id) {
    const coupon = getCouponById(id);
    if (!coupon) return;
    
    showConfirm(
        `Yakin ingin menghapus kupon "${coupon.code}"?`,
        async () => {
            try {
                await window.deleteCoupon(id);
                showConfirm(
                    'Kupon berhasil dihapus!',
                    null,
                    'OK',
                    '',
                    'Sukses',
                    'check-circle'
                );
            } catch (error) {
                showConfirm(
                    'Error menghapus kupon: ' + error.message,
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

// === UTILITY FUNCTIONS ===
function getPeriodText(period) {
    const periodTexts = {
        'today': 'Hari Ini',
        '7': '7 Hari Terakhir',
        '30': '30 Hari Terakhir',
        '90': '3 Bulan Terakhir'
    };
    return periodTexts[period] || 'Hari Ini';
}

function updateElement(selector, content) {
    const element = getElement(selector);
    if (element) {
        element.innerHTML = content;
    }
}

function loadProductOptions() {
    const select = getElement('#saleProductId');
    if (select) {
        const currentValue = select.value;
        
        // Get products with stock > 0
        const availableProducts = appData.products.filter(product => product.stock > 0);
        
        select.innerHTML = '<option value="">Pilih Produk</option>' + 
            availableProducts.map(product => 
                `<option value="${product.id}">${product.name} (Stok: ${product.stock})</option>`
            ).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    }
}

// Make functions globally available for onclick handlers
window.openSalesModal = openSalesModal;
window.closeSalesModal = closeSalesModal;
window.openCouponModal = openCouponModal;
window.closeCouponModal = closeCouponModal;
window.cancelSaleConfirm = cancelSaleConfirm;
window.editCoupon = editCoupon;
window.deleteCouponConfirm = deleteCouponConfirm;
window.loadSoldProducts = loadSoldProducts;
window.loadCancelledOrders = loadCancelledOrders;
window.filterSoldProducts = filterSoldProducts;
window.sortSoldProducts = sortSoldProducts;
window.exportSoldProducts = exportSoldProducts;
window.permanentDeleteSale = permanentDeleteSale;

// Override the loadCoupons function in global scope  
window.loadCoupons = loadCoupons;