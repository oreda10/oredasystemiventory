// js/main.js - OREDA Fashion Management System - FINAL CLEANED VERSION

// === THEME MANAGEMENT ===
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    saveToStorage(THEME_CONFIG.storageKey, theme);
    appData.ui.theme = theme;
    
    getAllElements('.theme-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    
    setTimeout(() => {
        if (appData.ui.currentPage === 'dashboard') {
            updateDashboard();
        }
        if (appData.ui.currentPage === 'reports') {
            loadReports();
        }
    }, 150);
}

function loadTheme() {
    const savedTheme = loadFromStorage(THEME_CONFIG.storageKey, THEME_CONFIG.default);
    setTheme(savedTheme);
}

function initializeTheme() {
    loadTheme();
    
    getAllElements('.theme-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (theme) {
                setTheme(theme);
            }
        });
    });
}

// === ICON MANAGEMENT ===
function initializeIcons() {
    try {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        } else {
            setTimeout(initializeIcons, 200);
        }
    } catch (error) {
        setTimeout(initializeIcons, 500);
    }
}

// === NAVIGATION ===
function showPage(pageId, event) {
    if (event) {
        event.preventDefault();
    }
    
    appData.ui.currentPage = pageId;
    
    getAllElements('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    const targetPage = getElement('#' + pageId + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    getAllElements('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        const menuItem = event.target.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    } else {
        const menuItem = getElement('[onclick*="' + pageId + '"]');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }
    
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }
    
    loadPageData(pageId);
}

function loadPageData(pageId) {
    switch(pageId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'products':
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            }
            break;
        case 'sold-products':
            if (typeof window.loadSoldProducts === 'function') {
                window.loadSoldProducts();
            }
            break;
        case 'best-seller':
            if (typeof window.loadBestSellers === 'function') {
                window.loadBestSellers();
            }
            break;
        case 'cancelled-orders':
            if (typeof window.loadCancelledOrders === 'function') {
                window.loadCancelledOrders();
            }
            break;
        case 'coupons':
            if (typeof window.loadCoupons === 'function') {
                window.loadCoupons();
            }
            break;
        case 'reports':
            loadReports();
            break;
    }
}

function toggleSidebar(force) {
    const sidebar = getElement('#sidebar');
    if (force !== null && force !== undefined) {
        if (force) {
            sidebar.classList.add('active');
            appData.ui.sidebarOpen = true;
        } else {
            sidebar.classList.remove('active');
            appData.ui.sidebarOpen = false;
        }
    } else {
        sidebar.classList.toggle('active');
        appData.ui.sidebarOpen = sidebar.classList.contains('active');
    }
}

// === MODAL MANAGEMENT ===
function showConfirm(message, onConfirm, confirmText, cancelText, title, icon) {
    confirmText = confirmText || 'Ya';
    cancelText = cancelText || 'Batal';
    title = title || 'Konfirmasi';
    icon = icon || 'alert-triangle';
    
    const modal = getElement('#confirmModal');
    const titleEl = modal.querySelector('.confirm-title');
    const messageEl = modal.querySelector('.confirm-message');
    const iconEl = modal.querySelector('.confirm-icon i');
    const confirmBtn = modal.querySelector('#confirmAction');
    const cancelBtn = modal.querySelector('.confirm-btn-cancel');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (iconEl) iconEl.setAttribute('data-lucide', icon);
    if (confirmBtn) confirmBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    
    modal.style.display = 'block';
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    if (onConfirm) {
        newConfirmBtn.onclick = function() {
            closeConfirmModal();
            onConfirm();
        };
    } else {
        newConfirmBtn.onclick = closeConfirmModal;
    }
    
    setTimeout(initializeIcons, 100);
}

function closeConfirmModal() {
    const modal = getElement('#confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// === CHART MANAGEMENT ===
function destroyAllCharts() {
    Object.keys(appData.charts).forEach(key => {
        if (appData.charts[key] && typeof appData.charts[key].destroy === 'function') {
            appData.charts[key].destroy();
            appData.charts[key] = null;
        }
    });
}

function getThemeColors() {
    const isDark = appData.ui.theme === 'dark';
    return {
        text: isDark ? '#94a3b8' : '#475569',
        grid: isDark ? '#334155' : '#e2e8f0',
        background: isDark ? '#1e293b' : '#f8fafc',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4'
    };
}

// === AUTO-REFRESH ===
function startAutoRefresh() {
    setInterval(function() {
        if (appData.currentUser && appData.ui.currentPage === 'dashboard') {
            updateDashboard();
        }
    }, APP_CONFIG.ui.chartRefreshInterval);
}

// === NOTIFICATION MANAGEMENT ===
function updateCancelledBadge() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - APP_CONFIG.dataRetention.notifications);
    
    const recentCancelledCount = appData.sales.filter(sale => 
        sale.status === 'cancelled' && 
        new Date(sale.date) >= oneMonthAgo
    ).length;
    
    const badge = getElement('#cancelledBadge');
    if (badge) {
        badge.textContent = recentCancelledCount;
        badge.style.display = recentCancelledCount > 0 ? 'inline' : 'none';
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    window.addEventListener('click', function(event) {
        if (event.target === getElement('#confirmModal')) {
            closeConfirmModal();
        }
        
        const modals = ['#productModal', '#salesModal', '#stockHistoryModal', 
                       '#bulkEditModal', '#productPreviewModal', '#couponModal'];
        
        modals.forEach(function(modalSelector) {
            const modal = getElement(modalSelector);
            if (modal && event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModals = getAllElements('.modal[style*="block"], .confirm-modal[style*="block"]');
            openModals.forEach(function(modal) {
                modal.style.display = 'none';
            });
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            toggleSidebar(false);
        }
    });
    
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && appData.ui.sidebarOpen) {
            const sidebar = getElement('#sidebar');
            const menuToggle = getElement('.menu-toggle');
            
            if (sidebar && !sidebar.contains(event.target) && 
                menuToggle && !menuToggle.contains(event.target)) {
                toggleSidebar(false);
            }
        }
    });
}

// === UTILITY FUNCTIONS ===
function getProductById(productId) {
    return findProductById ? findProductById(productId) : appData.products.find(function(p) { return p.id === productId; });
}

function getSaleById(saleId) {
    return appData.sales.find(function(s) { return s.id === saleId; });
}

function getCouponById(couponId) {
    return appData.coupons.find(function(c) { return c.id === couponId; });
}

function getFilteredSales(period, status) {
    period = period || 'today';
    const dateRange = getDateRange(period);
    
    return appData.sales.filter(function(sale) {
        const saleDate = new Date(sale.date);
        const inDateRange = saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        const statusMatch = status ? sale.status === status : true;
        return inDateRange && statusMatch;
    });
}

function getProductsSoldData(period) {
    period = period || 'today';
    const completedSales = getFilteredSales(period, 'completed');
    const soldProducts = {};
    
    completedSales.forEach(function(sale) {
        const product = getProductById(sale.productId);
        
        if (!soldProducts[sale.productId]) {
            soldProducts[sale.productId] = {
                productId: sale.productId,
                name: product ? product.name : 'Produk Dihapus',
                category: product ? product.category : 'UNKNOWN',
                totalSold: 0,
                totalSales: 0,
                totalProfit: 0,
                totalOrders: 0,
                lastSale: null,
                isDeleted: !product
            };
        }
        
        soldProducts[sale.productId].totalSold += sale.quantity;
        soldProducts[sale.productId].totalSales += sale.total;
        soldProducts[sale.productId].totalProfit += sale.profit;
        soldProducts[sale.productId].totalOrders += 1;
        
        if (!soldProducts[sale.productId].lastSale || 
            new Date(sale.date) > new Date(soldProducts[sale.productId].lastSale)) {
            soldProducts[sale.productId].lastSale = sale.date;
        }
    });
    
    return Object.values(soldProducts);
}

function getBestSellersData(period, limit) {
    period = period || 'today';
    limit = limit || 10;
    const soldData = getProductsSoldData(period);
    return soldData
        .sort(function(a, b) { return b.totalSold - a.totalSold; })
        .slice(0, limit);
}

// === DATA SYNCHRONIZATION ===
function forceSyncData() {
    return new Promise(function(resolve, reject) {
        try {
            showConfirm(
                'Menyinkronkan data dengan database...',
                null,
                '',
                '',
                'Loading',
                'loader-2'
            );
            
            if (typeof window.initializeSupabaseData === 'function') {
                window.initializeSupabaseData().then(function() {
                    closeConfirmModal();
                    loadPageData(appData.ui.currentPage);
                    
                    showNotification('Data berhasil disinkronkan!', 'success');
                    resolve();
                }).catch(function(error) {
                    closeConfirmModal();
                    showNotification('Error saat sinkronisasi: ' + error.message, 'error');
                    reject(error);
                });
            } else {
                reject(new Error('initializeSupabaseData function not available'));
            }
        } catch (error) {
            closeConfirmModal();
            showNotification('Error saat sinkronisasi: ' + error.message, 'error');
            reject(error);
        }
    });
}

// === APPLICATION INITIALIZATION ===
function initializeApp() {
    return new Promise(function(resolve, reject) {
        try {
            initializeTheme();
            initializeAuth();
            setupEventListeners();
            initializeIcons();
            
            if (appData.currentUser) {
                if (typeof window.initializeSupabaseData === 'function') {
                    window.initializeSupabaseData().then(function() {
                        startAutoRefresh();
                        resolve();
                    }).catch(function(error) {
                        console.error('Error initializing Supabase data:', error);
                        initializeSampleData();
                        resolve();
                    });
                } else {
                    initializeSampleData();
                    resolve();
                }
            } else {
                resolve();
            }
        } catch (error) {
            console.error('Error initializing application:', error);
            showConfirm(
                'Terjadi kesalahan saat memuat aplikasi. Silakan refresh halaman.',
                function() { window.location.reload(); },
                'Refresh',
                '',
                'Error',
                'x-circle'
            );
            reject(error);
        }
    });
}

// === SAMPLE DATA INITIALIZATION ===
function initializeSampleData() {
    appData.products = [
        {
            id: 'sample1',
            name: "Dress Wanita Casual",
            category: "ATASAN",
            stock: 22,
            buyPrice: 50000,
            sellPrice: 100000,
            images: [createPlaceholderImage('Dress', 100, 100)],
            description: "Dress casual untuk sehari-hari",
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample2',
            name: "Blouse Wanita Formal",
            category: "ATASAN",
            stock: 13,
            buyPrice: 40000,
            sellPrice: 85000,
            images: [createPlaceholderImage('Blouse', 100, 100)],
            description: "Blouse formal untuk kantor",
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample3',
            name: "Rok Mini Fashion",
            category: "BAWAHAN",
            stock: 10,
            buyPrice: 35000,
            sellPrice: 75000,
            images: [createPlaceholderImage('Rok', 100, 100)],
            description: "Rok mini trendy",
            createdAt: new Date().toISOString()
        }
    ];

    appData.sales = [
        {
            id: 'sale1',
            productId: 'sample1',
            quantity: 2,
            sellPrice: 100000,
            total: 200000,
            profit: 100000,
            customerName: 'Customer Sample',
            source: 'offline',
            status: 'completed',
            date: new Date().toISOString()
        }
    ];

    appData.stockHistory = [];
    appData.coupons = [];
}

// === STARTUP ===
function startApplication() {
    console.log('Starting OREDA Fashion Management System v' + APP_CONFIG.version);
    
    const isLoggedIn = checkSession();
    
    if (isLoggedIn) {
        initializeApp();
    } else {
        initializeTheme();
        initializeAuth();
        setupEventListeners();
        initializeIcons();
    }
}

// === WAIT FOR DEPENDENCIES ===
function waitForDependencies() {
    function checkDependencies() {
        const requiredLibs = {
            Chart: typeof Chart !== 'undefined',
            lucide: typeof lucide !== 'undefined',
            XLSX: typeof XLSX !== 'undefined',
            supabase: typeof window.supabase !== 'undefined'
        };
        
        const missing = Object.entries(requiredLibs)
            .filter(([name, loaded]) => !loaded)
            .map(([name]) => name);
        
        if (missing.length === 0) {
            window.supabaseReady = true;
            window.dispatchEvent(new Event('supabaseReady'));
            startApplication();
        } else {
            setTimeout(checkDependencies, 100);
        }
    }
    
    checkDependencies();
}

// === INITIALIZE WHEN DOM IS READY ===
document.addEventListener('DOMContentLoaded', function() {
    waitForDependencies();
});

// === ENHANCED DEBUGGING COMMANDS (DEV ONLY) ===
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugCommands = {
        testDelete: function(productId) {
            return new Promise(function(resolve, reject) {
                if (!productId && appData.products.length > 0) {
                    productId = appData.products[0].id;
                }
                
                if (typeof window.deleteProductDirect === 'function') {
                    try {
                        window.deleteProductDirect(productId);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('deleteProductDirect function not available'));
                }
            });
        },
        
        sync: function() {
            return forceSyncData();
        },
        
        debugIds: function() {
            console.log('🔍 ID DEBUG REPORT');
            console.log('Local Products:', appData.products.map(p => ({ id: p.id, type: typeof p.id, name: p.name })));
            
            const rows = getAllElements('#productsTable tbody tr[data-product-id]');
            console.log('DOM Product Rows:', Array.from(rows).map(row => ({ 
                id: row.getAttribute('data-product-id'), 
                type: typeof row.getAttribute('data-product-id') 
            })));
        },
        
        refreshProducts: function() {
            return new Promise(function(resolve, reject) {
                if (typeof window.loadProductsFromDB === 'function') {
                    window.loadProductsFromDB().then(function() {
                        if (appData.ui.currentPage === 'products') {
                            window.loadProducts();
                        }
                        resolve(appData.products);
                    }).catch(reject);
                } else {
                    if (typeof window.loadProducts === 'function') {
                        window.loadProducts();
                    }
                    resolve(appData.products);
                }
            });
        },
        
        listFunctions: function() {
            const globalFunctions = Object.keys(window).filter(function(key) {
                return typeof window[key] === 'function' && 
                       (key.includes('Product') || key.includes('Sale') || key.includes('Coupon') || key.includes('load'));
            });
            console.log('Available functions:', globalFunctions);
            return globalFunctions;
        },
        
        checkState: function() {
            const state = {
                products: {
                    count: appData.products.length,
                    ids: appData.products.map(p => ({ id: p.id, name: p.name, type: typeof p.id })),
                    categories: [...new Set(appData.products.map(p => p.category))]
                },
                sales: {
                    count: appData.sales.length,
                    completed: appData.sales.filter(s => s.status === 'completed').length,
                    cancelled: appData.sales.filter(s => s.status === 'cancelled').length
                },
                ui: {
                    currentPage: appData.ui.currentPage,
                    theme: appData.ui.theme,
                    sidebarOpen: appData.ui.sidebarOpen
                },
                user: appData.currentUser ? 'Logged in' : 'Not logged in',
                functions: {
                    deleteProductDirect: typeof window.deleteProductDirect === 'function',
                    loadProducts: typeof window.loadProducts === 'function',
                    editProduct: typeof window.editProduct === 'function',
                    previewProduct: typeof window.previewProduct === 'function'
                }
            };
            
            console.log('State report:', state);
            return state;
        },
        
        quickTest: function() {
            console.log('🚀 Running quick test...');
            
            if (typeof window.loadProducts === 'function') {
                console.log('✅ loadProducts - Available');
                window.loadProducts();
            } else {
                console.log('❌ loadProducts - Missing');
            }
            
            if (appData.products.length > 0) {
                const firstProduct = appData.products[0];
                console.log('Testing with product:', firstProduct.name, 'ID:', firstProduct.id);
                
                const found = getProductById(firstProduct.id);
                console.log(found ? '✅ getProductById - Working' : '❌ getProductById - Failed');
                
                console.log(typeof window.editProduct === 'function' ? '✅ editProduct - Available' : '❌ editProduct - Missing');
                console.log(typeof window.previewProduct === 'function' ? '✅ previewProduct - Available' : '❌ previewProduct - Missing');
            } else {
                console.log('⚠️ No products available for testing');
            }
        }
    };
}

// === GLOBAL ERROR HANDLER ===
window.addEventListener('error', function(event) {
    if (event.filename && event.filename.includes('script')) {
        return;
    }
    
    if (event.error && event.error.message) {
        if (typeof showNotification === 'function') {
            showNotification('Terjadi kesalahan sistem. Silakan refresh jika masalah berlanjut.', 'error', 5000);
        }
    }
});

window.addEventListener('unhandledrejection', function(event) {
    event.preventDefault();
    
    if (event.reason && event.reason.code) {
        console.error('Supabase error:', event.reason.code, event.reason.message);
    }
});

// Make essential functions globally available
window.forceSyncData = forceSyncData;
window.getProductById = getProductById;
window.getSaleById = getSaleById;
window.getCouponById = getCouponById;
window.getFilteredSales = getFilteredSales;
window.getProductsSoldData = getProductsSoldData;
window.getBestSellersData = getBestSellersData;