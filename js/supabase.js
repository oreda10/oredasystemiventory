// js/supabase.js - ENHANCED VERSION WITH BULK DESCRIPTION UPDATE

// === SUPABASE CLIENT INITIALIZATION ===
let supabase;

// Initialize Supabase client
function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not loaded');
            return false;
        }
        
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        // Test connection
        testSupabaseConnection();
        
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        // Try to query products table
        const { data, error } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            console.error('Database connection test failed:', error);
            
            if (error.message.includes('relation "products" does not exist')) {
                console.error('❌ TABEL BELUM DIBUAT! Jalankan setup SQL terlebih dahulu.');
                showConfirm(
                    'Database belum di-setup! Silakan buat tabel di Supabase terlebih dahulu menggunakan SQL script yang disediakan.',
                    null,
                    'OK',
                    '',
                    'Database Error',
                    'alert-triangle'
                );
            }
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Connection test error:', error);
        return false;
    }
}

// === PRODUCT FUNCTIONS ===

// Get all products with better error handling
async function loadProductsFromDB() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error loading products:', error);
            throw error;
        }

        // Convert to match app format with validation and ROBUST ID handling
        const validProducts = data.filter(product => 
            product && 
            (product.id || product.id === 0) && // Handle ID 0 as valid
            product.name && 
            typeof product.name === 'string' &&
            product.name.trim() !== ''
        );

        appData.products = validProducts.map(product => ({
            id: String(product.id), // FORCE STRING CONVERSION
            name: product.name,
            category: product.category || 'ATASAN',
            stock: parseInt(product.stock) || 0,
            buyPrice: parseFloat(product.buy_price) || 0,
            sellPrice: parseFloat(product.sell_price) || 0,
            images: Array.isArray(product.images) && product.images.length > 0 
                ? product.images.filter(img => img && img !== 'undefined' && img !== 'null')
                : [createPlaceholderImage(product.name || 'No Image', 100, 100)],
            description: product.description || '',
            createdAt: product.created_at
        }));

        // Update UI only if on products page
        if (appData.ui.currentPage === 'products') {
            if (typeof window.loadProducts === 'function') {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    window.loadProducts();
                }, 100);
            }
        }
        
        // Load categories and product options
        loadCategoriesFromProducts();
        loadProductOptions();

        return appData.products;
    } catch (error) {
        console.error('❌ Error loading products:', error);
        throw error;
    }
}

// Save product (add or update) 
async function saveProduct(productData, editId = null) {
    try {
        const dbProduct = {
            name: productData.name,
            category: productData.category,
            stock: productData.stock,
            buy_price: productData.buyPrice,
            sell_price: productData.sellPrice,
            images: productData.images || [],
            description: productData.description || ''
        };

        let result;

        if (editId) {
            // Update existing product
            const { data, error } = await supabase
                .from('products')
                .update(dbProduct)
                .eq('id', editId)
                .select();

            if (error) {
                console.error('❌ Update error:', error);
                throw error;
            }
            
            result = data[0];

            // Update local data with ROBUST ID handling
            const index = appData.products.findIndex(p => String(p.id) === String(editId));
            if (index !== -1) {
                appData.products[index] = {
                    id: String(result.id), // FORCE STRING CONVERSION
                    name: result.name,
                    category: result.category,
                    stock: result.stock,
                    buyPrice: result.buy_price,
                    sellPrice: result.sell_price,
                    images: result.images || [createPlaceholderImage('No Image', 100, 100)],
                    description: result.description,
                    createdAt: result.created_at
                };
            }
        } else {
            // Add new product
            const { data, error } = await supabase
                .from('products')
                .insert([dbProduct])
                .select();

            if (error) {
                console.error('❌ Insert error:', error);
                throw error;
            }
            
            result = data[0];

            // Add to local data with ROBUST ID handling
            const newProduct = {
                id: String(result.id), // FORCE STRING CONVERSION
                name: result.name,
                category: result.category,
                stock: result.stock,
                buyPrice: result.buy_price,
                sellPrice: result.sell_price,
                images: result.images || [createPlaceholderImage('No Image', 100, 100)],
                description: result.description,
                createdAt: result.created_at
            };
            
            appData.products.unshift(newProduct);

            // Record initial stock history
            await addStockHistory(String(result.id), 'in', result.stock, result.stock, 'Initial stock');
        }

        // Update UI and data
        loadCategoriesFromProducts();
        loadProductOptions();
        
        if (appData.ui.currentPage === 'products') {
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            }
        }
        
        updateDashboard();

        return result;
    } catch (error) {
        console.error('❌ Error saving product:', error);
        throw error;
    }
}

// FULLY FIXED delete product with ROBUST handling
async function deleteProduct(productId) {
    try {
        // FORCE string conversion for comparison
        const productIdStr = String(productId);
        
        // Step 1: Find product with ROBUST ID matching
        let localProduct = appData.products.find(p => String(p.id) === productIdStr);
        
        if (!localProduct) {
            // Force reload from database
            await loadProductsFromDB();
            
            // Try again after sync
            localProduct = appData.products.find(p => String(p.id) === productIdStr);
            
            if (!localProduct) {
                // Check directly in database
                const { data: dbCheck, error: dbError } = await supabase
                    .from('products')
                    .select('id, name')
                    .eq('id', productId);
                
                if (dbError) {
                    console.error('❌ Database check error:', dbError);
                    throw new Error('Database error: ' + dbError.message);
                }
                
                if (!dbCheck || dbCheck.length === 0) {
                    throw new Error('Produk tidak ditemukan di database. Mungkin sudah dihapus sebelumnya.');
                } else {
                    throw new Error('Produk ditemukan di database tapi tidak bisa disinkronkan. Silakan refresh halaman.');
                }
            }
        }
        
        // Step 2: Delete from database with CASCADE
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .select();

        if (error) {
            console.error('❌ Supabase delete error:', error);
            
            // Enhanced error handling
            if (error.code === '23503') {
                throw new Error('Tidak dapat menghapus produk: masih direferensikan oleh data lain. Silakan hapus data terkait terlebih dahulu.');
            } else if (error.code === 'PGRST116') {
                throw new Error('Produk tidak ditemukan di database. Mungkin sudah dihapus sebelumnya.');
            } else {
                throw new Error(`Database error: ${error.message}`);
            }
        }

        // Step 3: Remove from local data with ROBUST ID matching
        const originalLength = appData.products.length;
        appData.products = appData.products.filter(p => String(p.id) !== productIdStr);

        // Step 4: Force reload to ensure sync
        await Promise.all([
            loadProductsFromDB(),
            loadSales(),
            loadStockHistory()
        ]);

        // Step 5: Update UI and related components
        loadCategoriesFromProducts();
        loadProductOptions();
        updateDashboard();
        updateCancelledBadge();

        return true;
    } catch (error) {
        console.error('❌ ROBUST delete error:', error);
        throw error;
    }
}

// FIXED Update product stock - Fixed the 400 error
async function updateProductStock(productId, newStock, note = '') {
    try {
        // ROBUST ID matching
        const productIdStr = String(productId);
        const product = appData.products.find(p => String(p.id) === productIdStr);
        
        if (!product) {
            console.error('❌ Product not found for stock update:', productIdStr);
            throw new Error('Product not found');
        }

        const oldStock = product.stock;
        const change = newStock - oldStock;
        const type = change > 0 ? 'in' : 'out';

        // FIXED: Update stock in database - use correct field name and parameters
        const { data, error } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', parseInt(productId)) // FIXED: Convert to integer for database
            .select();

        if (error) {
            console.error('❌ Database update error:', error);
            throw error;
        }

        // Update local data
        product.stock = newStock;

        // Add stock history
        await addStockHistory(productIdStr, type, Math.abs(change), newStock, note);

        // Update UI
        if (appData.ui.currentPage === 'products') {
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            }
        }
        updateDashboard();

        return data;
    } catch (error) {
        console.error('❌ Error updating product stock:', error);
        throw error;
    }
}

// === ENHANCED BULK UPDATE WITH DESCRIPTION ===
async function bulkUpdateProducts(productIds, updates) {
    try {
        let totalUpdated = 0;
        let errors = [];
        
        for (const productId of productIds) {
            try {
                const productIdStr = String(productId);
                const product = appData.products.find(p => String(p.id) === productIdStr);
                if (!product) {
                    console.warn(`⚠️ Product ${productId} not found, skipping...`);
                    continue;
                }

                const updateData = {};

                // Category update
                if (updates.category) {
                    updateData.category = updates.category;
                }

                // Price updates
                if (updates.buyPrice) {
                    updateData.buy_price = updates.buyPrice;
                }

                if (updates.sellPrice) {
                    updateData.sell_price = updates.sellPrice;
                }

                // NEW: Description update
                if (updates.description !== null && updates.description !== undefined) {
                    updateData.description = updates.description;
                }

                // Apply database updates if any
                if (Object.keys(updateData).length > 0) {
                    const { error } = await supabase
                        .from('products')
                        .update(updateData)
                        .eq('id', parseInt(productId)); // FIXED: Convert to integer

                    if (error) {
                        console.error(`❌ Error updating product ${productId}:`, error);
                        errors.push(`Product ${product.name}: ${error.message}`);
                        continue;
                    }

                    // Update local data
                    Object.assign(product, {
                        category: updateData.category || product.category,
                        buyPrice: updateData.buy_price || product.buyPrice,
                        sellPrice: updateData.sell_price || product.sellPrice,
                        description: updateData.description !== undefined ? updateData.description : product.description // NEW
                    });
                }

                // Handle stock change
                if (updates.stockChange && updates.stockChange !== 0) {
                    const newStock = Math.max(0, product.stock + updates.stockChange);
                    const changeType = updates.stockChange > 0 ? 'addition' : 'reduction';
                    await updateProductStock(productIdStr, newStock, `Bulk ${changeType} by admin`);
                }

                totalUpdated++;

            } catch (error) {
                console.error(`❌ Error processing product ${productId}:`, error);
                errors.push(`Product ${productId}: ${error.message}`);
            }
        }

        // Force reload data to ensure consistency
        await loadProductsFromDB();

        // Update UI
        loadCategoriesFromProducts();
        if (appData.ui.currentPage === 'products') {
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            }
        }
        updateDashboard();

        if (errors.length > 0) {
            console.warn('⚠️ Some errors occurred during bulk update:', errors);
            throw new Error(`${totalUpdated} produk berhasil diupdate, ${errors.length} produk gagal. Errors: ${errors.slice(0, 3).join('; ')}`);
        }

        return { updated: totalUpdated, errors: errors.length };
        
    } catch (error) {
        console.error('❌ Error in enhanced bulk update:', error);
        throw error;
    }
}

// Enhanced bulk delete with ROBUST handling
async function bulkDeleteProducts(productIds) {
    try {
        // Force string conversion for all IDs and convert to integers for database
        const productIdsStr = productIds.map(id => String(id));
        const productIdsInt = productIds.map(id => parseInt(id)); // FIXED: Convert to integers for database
        
        // Verify all products exist
        const missingProducts = [];
        
        for (const productIdStr of productIdsStr) {
            const exists = appData.products.find(p => String(p.id) === productIdStr);
            if (!exists) {
                missingProducts.push(productIdStr);
            }
        }
        
        if (missingProducts.length > 0) {
            await loadProductsFromDB();
            
            // Check again after sync
            const stillMissing = [];
            for (const productIdStr of missingProducts) {
                const exists = appData.products.find(p => String(p.id) === productIdStr);
                if (!exists) {
                    stillMissing.push(productIdStr);
                }
            }
            
            if (stillMissing.length > 0) {
                throw new Error(`Produk dengan ID ${stillMissing.join(', ')} tidak ditemukan setelah sinkronisasi.`);
            }
        }
        
        // Delete multiple products with cascade - FIXED: Use integer IDs
        const { data, error } = await supabase
            .from('products')
            .delete()
            .in('id', productIdsInt) // FIXED: Use integer array
            .select();

        if (error) {
            console.error('❌ Bulk delete error:', error);
            throw new Error(`Bulk delete failed: ${error.message}`);
        }

        // Remove from local data with ROBUST ID matching
        const originalLength = appData.products.length;
        appData.products = appData.products.filter(p => !productIdsStr.includes(String(p.id)));

        // Force reload all data
        await Promise.all([
            loadProductsFromDB(),
            loadSales(),
            loadStockHistory()
        ]);

        // Update UI
        loadCategoriesFromProducts();
        loadProductOptions();
        if (appData.ui.currentPage === 'products') {
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            }
        }
        updateDashboard();
    } catch (error) {
        console.error('❌ Error in ROBUST bulk delete:', error);
        throw error;
    }
}

// === SALES FUNCTIONS ===

// Load all sales
async function loadSales() {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        // Convert to match app format with ROBUST ID handling
        appData.sales = data.map(sale => ({
            id: String(sale.id), // FORCE STRING CONVERSION
            productId: String(sale.product_id), // FORCE STRING CONVERSION
            quantity: sale.quantity,
            sellPrice: sale.sell_price,
            total: sale.total,
            profit: sale.profit,
            customerName: sale.customer_name,
            source: sale.source,
            status: sale.status,
            date: sale.date,
            cancelledAt: sale.cancelled_at
        }));

        // Update UI
        updateDashboard();
        updateCancelledBadge();

        return appData.sales;
    } catch (error) {
        console.error('❌ Error loading sales:', error);
        throw error;
    }
}

// Save sale - FIXED to handle stock update properly
async function saveSale(saleData) {
    try {
        // ROBUST ID matching
        const productIdStr = String(saleData.productId);
        const product = appData.products.find(p => String(p.id) === productIdStr);
        
        if (!product) {
            console.error('❌ Product not found for sale:', productIdStr);
            throw new Error('Product not found');
        }

        if (product.stock < saleData.quantity) {
            throw new Error('Insufficient stock');
        }

        // Calculate totals
        const total = saleData.sellPrice * saleData.quantity;
        const profit = (saleData.sellPrice - product.buyPrice) * saleData.quantity;

        const dbSale = {
            product_id: parseInt(saleData.productId), // FIXED: Convert to integer for database
            quantity: saleData.quantity,
            sell_price: saleData.sellPrice,
            total: total,
            profit: profit,
            customer_name: saleData.customerName,
            source: saleData.source,
            status: 'completed'
        };

        // Save sale to database
        const { data, error } = await supabase
            .from('sales')
            .insert([dbSale])
            .select();

        if (error) {
            console.error('❌ Error saving sale:', error);
            throw error;
        }

        const result = data[0];

        // Update product stock - FIXED: Use proper ID conversion
        const newStock = product.stock - saleData.quantity;
        await updateProductStock(parseInt(saleData.productId), newStock, `Sale to ${saleData.customerName}`);

        // Add to local data with ROBUST ID handling
        appData.sales.unshift({
            id: String(result.id), // FORCE STRING CONVERSION
            productId: String(result.product_id), // FORCE STRING CONVERSION
            quantity: result.quantity,
            sellPrice: result.sell_price,
            total: result.total,
            profit: result.profit,
            customerName: result.customer_name,
            source: result.source,
            status: result.status,
            date: result.date,
            cancelledAt: result.cancelled_at
        });

        // Update UI
        updateDashboard();
        if (appData.ui.currentPage === 'sold-products') {
            if (typeof window.loadSoldProducts === 'function') {
                window.loadSoldProducts();
            }
        }

        return result;
    } catch (error) {
        console.error('❌ Error saving sale:', error);
        throw error;
    }
}

// Cancel sale
async function cancelSale(saleId) {
    try {
        // ROBUST ID matching
        const saleIdStr = String(saleId);
        const sale = appData.sales.find(s => String(s.id) === saleIdStr);
        
        if (!sale) {
            console.error('❌ Sale not found:', saleIdStr);
            throw new Error('Sale not found');
        }

        if (sale.status === 'cancelled') {
            throw new Error('Sale already cancelled');
        }

        // Update sale status in database - FIXED: Convert to integer
        const { error } = await supabase
            .from('sales')
            .update({ 
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', parseInt(saleId)); // FIXED: Convert to integer

        if (error) throw error;

        // Restore product stock with ROBUST ID matching
        const productIdStr = String(sale.productId);
        const product = appData.products.find(p => String(p.id) === productIdStr);
        if (product) {
            const newStock = product.stock + sale.quantity;
            await updateProductStock(parseInt(sale.productId), newStock, `Stock restored from cancelled sale`);
        }

        // Update local data
        sale.status = 'cancelled';
        sale.cancelledAt = new Date().toISOString();

        // Update UI
        updateDashboard();
        updateCancelledBadge();
        if (appData.ui.currentPage === 'sold-products') {
            if (typeof window.loadSoldProducts === 'function') {
                window.loadSoldProducts();
            }
        }
        if (appData.ui.currentPage === 'cancelled-orders') {
            if (typeof window.loadCancelledOrders === 'function') {
                window.loadCancelledOrders();
            }
        }
    } catch (error) {
        console.error('❌ Error cancelling sale:', error);
        throw error;
    }
}

// === STOCK HISTORY FUNCTIONS ===

// Add stock history record
async function addStockHistory(productId, type, quantity, finalStock, note = '') {
    try {
        const historyData = {
            product_id: parseInt(productId), // FIXED: Convert to integer for database
            type: type,
            quantity: quantity,
            final_stock: finalStock,
            note: note
        };

        const { data, error } = await supabase
            .from('stock_history')
            .insert([historyData])
            .select();

        if (error) throw error;

        // Add to local data with ROBUST ID handling
        appData.stockHistory.unshift({
            id: String(data[0].id), // FORCE STRING CONVERSION
            productId: String(data[0].product_id), // FORCE STRING CONVERSION
            type: data[0].type,
            quantity: data[0].quantity,
            finalStock: data[0].final_stock,
            note: data[0].note,
            date: data[0].date
        });
    } catch (error) {
        console.error('❌ Error adding stock history:', error);
        throw error;
    }
}

// Load stock history
async function loadStockHistory() {
    try {
        const { data, error } = await supabase
            .from('stock_history')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        // Convert to match app format with ROBUST ID handling
        appData.stockHistory = data.map(history => ({
            id: String(history.id), // FORCE STRING CONVERSION
            productId: String(history.product_id), // FORCE STRING CONVERSION
            type: history.type,
            quantity: history.quantity,
            finalStock: history.final_stock,
            note: history.note,
            date: history.date
        }));

        return appData.stockHistory;
    } catch (error) {
        console.error('❌ Error loading stock history:', error);
        throw error;
    }
}

// === COUPON FUNCTIONS ===

// Load all coupons
async function loadCoupons() {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert to match app format with ROBUST ID handling
        appData.coupons = data.map(coupon => ({
            id: String(coupon.id), // FORCE STRING CONVERSION
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minimum: coupon.minimum,
            usageLimit: coupon.usage_limit,
            usageCount: coupon.usage_count,
            startDate: coupon.start_date,
            endDate: coupon.end_date,
            description: coupon.description,
            createdAt: coupon.created_at
        }));

        // Update UI
        if (appData.ui.currentPage === 'coupons') {
            if (typeof window.loadCoupons === 'function') {
                window.loadCoupons();
            }
        }

        return appData.coupons;
    } catch (error) {
        console.error('❌ Error loading coupons:', error);
        throw error;
    }
}

// Save coupon (add or update)
async function saveCoupon(couponData, editId = null) {
    try {
        const dbCoupon = {
            code: couponData.code,
            type: couponData.type,
            value: couponData.value,
            minimum: couponData.minimum,
            usage_limit: couponData.usageLimit,
            start_date: couponData.startDate,
            end_date: couponData.endDate,
            description: couponData.description || ''
        };

        let result;

        if (editId) {
            // Update existing coupon - FIXED: Convert to integer
            const { data, error } = await supabase
                .from('coupons')
                .update(dbCoupon)
                .eq('id', parseInt(editId)) // FIXED: Convert to integer
                .select();

            if (error) throw error;
            result = data[0];

            // Update local data with ROBUST ID handling
            const editIdStr = String(editId);
            const index = appData.coupons.findIndex(c => String(c.id) === editIdStr);
            if (index !== -1) {
                appData.coupons[index] = {
                    id: String(result.id), // FORCE STRING CONVERSION
                    code: result.code,
                    type: result.type,
                    value: result.value,
                    minimum: result.minimum,
                    usageLimit: result.usage_limit,
                    usageCount: result.usage_count,
                    startDate: result.start_date,
                    endDate: result.end_date,
                    description: result.description,
                    createdAt: result.created_at
                };
            }
        } else {
            // Add new coupon
            dbCoupon.usage_count = 0;

            const { data, error } = await supabase
                .from('coupons')
                .insert([dbCoupon])
                .select();

            if (error) throw error;
            result = data[0];

            // Add to local data with ROBUST ID handling
            appData.coupons.unshift({
                id: String(result.id), // FORCE STRING CONVERSION
                code: result.code,
                type: result.type,
                value: result.value,
                minimum: result.minimum,
                usageLimit: result.usage_limit,
                usageCount: result.usage_count,
                startDate: result.start_date,
                endDate: result.end_date,
                description: result.description,
                createdAt: result.created_at
            });
        }

        // Update UI
        if (appData.ui.currentPage === 'coupons') {
            if (typeof window.loadCoupons === 'function') {
                window.loadCoupons();
            }
        }

        return result;
    } catch (error) {
        console.error('❌ Error saving coupon:', error);
        throw error;
    }
}

// Delete coupon
async function deleteCoupon(couponId) {
    try {
        // FIXED: Convert to integer for database
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', parseInt(couponId)); // FIXED: Convert to integer

        if (error) throw error;

        // Remove from local data with ROBUST ID handling
        const couponIdStr = String(couponId);
        appData.coupons = appData.coupons.filter(c => String(c.id) !== couponIdStr);

        // Update UI
        if (appData.ui.currentPage === 'coupons') {
            if (typeof window.loadCoupons === 'function') {
                window.loadCoupons();
            }
        }
    } catch (error) {
        console.error('❌ Error deleting coupon:', error);
        throw error;
    }
}

// === INITIALIZATION ===

// Initialize all data from Supabase
async function initializeSupabaseData() {
    try {
        // Initialize Supabase client
        if (!initializeSupabase()) {
            throw new Error('Failed to initialize Supabase client');
        }

        // Load all data
        await Promise.all([
            loadProductsFromDB(),
            loadSales(),
            loadStockHistory(),
            loadCoupons()
        ]);

        // Trigger initial UI updates
        updateDashboard();
        updateCancelledBadge();

    } catch (error) {
        console.error('❌ Error initializing Supabase data:', error);
        
        // Fallback to sample data if connection fails
        initializeSampleData();
    }
}

// Initialize sample data as fallback
function initializeSampleData() {
    appData.products = [
        {
            id: 'sample1',
            name: "Dress Wanita Casual",
            category: "ATASAN",
            stock: 22,
            buyPrice: 50000,
            sellPrice: 100000,
            images: [createPlaceholderImage('Dress', 400, 400)],
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
            images: [createPlaceholderImage('Blouse', 400, 400)],
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
            images: [createPlaceholderImage('Rok', 400, 400)],
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

    // Load categories and product options
    loadCategoriesFromProducts();
    loadProductOptions();
}

// Helper functions (same as before)
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

// === GLOBAL EXPORTS ===
// Export functions to global scope immediately with error handling
try {
    window.saveProduct = saveProduct;
    window.deleteProduct = deleteProduct;
    window.updateProductStock = updateProductStock;
    window.bulkUpdateProducts = bulkUpdateProducts; // ENHANCED VERSION
    window.bulkDeleteProducts = bulkDeleteProducts;
    window.saveSale = saveSale;
    window.cancelSale = cancelSale;
    window.saveCoupon = saveCoupon;
    window.deleteCoupon = deleteCoupon;
    window.loadProductsFromDB = loadProductsFromDB;
    window.loadSales = loadSales;
    window.loadStockHistory = loadStockHistory;
    window.initializeSupabaseData = initializeSupabaseData;
    
    // Verify critical functions
    const criticalFunctions = ['deleteProduct', 'saveProduct', 'loadProductsFromDB', 'bulkUpdateProducts'];
    const missing = criticalFunctions.filter(fn => typeof window[fn] !== 'function');
    
    if (missing.length > 0) {
        console.error('❌ Critical functions missing from global scope:', missing);
    }
    
} catch (error) {
    console.error('❌ Error exporting functions to global scope:', error);
}

// Create placeholder page load functions for compatibility
window.loadSoldProducts = function() {
    createSoldProductsPageStructure();
    
    const tbody = getElement('#soldProductsTableBody');
    if (!tbody) return;
    
    const period = getElement('#periodFilterSold')?.value || 'today';
    const filteredSoldProducts = getFilteredSales(period, 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalSold = sum(filteredSoldProducts, 'quantity');
    
    // Update table title and counts
    const periodText = getPeriodText(period);
    updateElement('#totalSoldCount', formatNumber(totalSold));
    updateElement('#totalSoldItems', formatNumber(totalSold));
    updateElement('#soldTableTitle', `Produk Terjual (${periodText}) - Total: <span id="totalSoldCount">${formatNumber(totalSold)}</span> item`);
    
    if (filteredSoldProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="shopping-cart"></i></div>
                    <div class="empty-state-text">Belum ada produk terjual untuk periode ini</div>
                </td>
            </tr>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    tbody.innerHTML = filteredSoldProducts.map(sale => {
        // ROBUST ID matching for sales
        const product = appData.products.find(p => String(p.id) === String(sale.productId));
        return `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td><strong style="color: var(--text-primary);">${product ? product.name : 'Produk Dihapus'}</strong></td>
                <td>${sale.customerName}</td>
                <td><strong>${formatNumber(sale.quantity)}</strong></td>
                <td>${formatCurrency(sale.sellPrice || (product ? product.sellPrice : 0))}</td>
                <td><strong style="color: var(--accent-color);">${formatCurrency(sale.total)}</strong></td>
                <td style="color: var(--success-color);"><strong>${formatCurrency(sale.profit)}</strong></td>
                <td><span class="source-badge ${getSourceBadgeClass(sale.source)}">${getSourceText(sale.source)}</span></td>
                <td><span class="status-badge status-completed">Selesai</span></td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="cancelSaleConfirm('${sale.id}')" title="Batalkan Penjualan">
                        <i data-lucide="x"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    setTimeout(initializeIcons, 50);
};

window.loadBestSellers = function() {
    createBestSellerPageStructure();
    
    const period = getElement('#periodFilterBest')?.value || 'today';
    const bestSellers = getBestSellersData(period);
    const tbody = getElement('#bestSellerTableBody');
    
    if (!tbody) return;
    
    // Update label and title
    const periodText = getPeriodText(period);
    updateElement('#bestSellerLabel', `Produk Best Seller (${periodText})`);
    updateElement('#bestSellerTableTitle', `Produk Best Seller (${periodText})`);
    updateElement('#bestSellerCount', formatNumber(bestSellers.length));
    
    if (bestSellers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="trophy"></i></div>
                    <div class="empty-state-text">Belum ada best seller untuk periode ini</div>
                </td>
            </tr>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    tbody.innerHTML = bestSellers.map((item, index) => `
        <tr>
            <td><span class="ranking-badge ${getRankingBadgeClass(index + 1)}">${index + 1}</span></td>
            <td><strong style="color: var(--text-primary);">${item.name}</strong></td>
            <td><strong style="color: var(--accent-color);">${formatNumber(item.totalSold)}</strong></td>
            <td><strong>${formatNumber(item.totalOrders)}</strong></td>
            <td><strong style="color: var(--accent-color);">${formatCurrency(item.totalSales)}</strong></td>
            <td style="color: var(--success-color);"><strong>${formatCurrency(item.totalProfit)}</strong></td>
        </tr>
    `).join('');
};

window.loadCancelledOrders = function() {
    createCancelledOrdersPageStructure();
    
    const tbody = getElement('#cancelledOrdersTableBody');
    if (!tbody) return;
    
    const period = getElement('#periodFilterCancelled')?.value || 'today';
    const cancelledSales = getFilteredSales(period, 'cancelled')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalCancelled = cancelledSales.length;
    const totalCancelledItems = sum(cancelledSales, 'quantity');
    
    // Update table title and summary
    const periodText = getPeriodText(period);
    updateElement('#cancelledTableTitle', `Order Dibatalkan (${periodText})`);
    updateElement('#totalCancelledCount', `${formatNumber(totalCancelled)} orders`);
    updateElement('#totalCancelledItems', `${formatNumber(totalCancelledItems)} items`);
    
    if (cancelledSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="check-circle"></i></div>
                    <div class="empty-state-text">Tidak ada order dibatalkan untuk periode ini</div>
                    <div class="empty-state-subtext">Pertahankan performa yang baik!</div>
                </td>
            </tr>
        `;
        setTimeout(initializeIcons, 50);
        return;
    }
    
    tbody.innerHTML = cancelledSales.map(sale => {
        // ROBUST ID matching for cancelled sales
        const product = appData.products.find(p => String(p.id) === String(sale.productId));
        return `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>${sale.cancelledAt ? formatDate(sale.cancelledAt) : '-'}</td>
                <td><strong style="color: var(--text-primary);">${product ? product.name : 'Produk Dihapus'}</strong></td>
                <td>${sale.customerName}</td>
                <td><strong>${formatNumber(sale.quantity)}</strong></td>
                <td><span class="source-badge ${getSourceBadgeClass(sale.source)}">${getSourceText(sale.source)}</span></td>
            </tr>
        `;
    }).join('');
};

// Helper functions for creating page structures
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
                <div class="filter-group">
                    <label>Filter Periode</label>
                    <select id="periodFilterSold" onchange="loadSoldProducts()">
                        <option value="today">Hari Ini</option>
                        <option value="7">7 Hari Terakhir</option>
                        <option value="30">30 Hari Terakhir</option>
                        <option value="90">3 Bulan Terakhir</option>
                    </select>
                </div>
                <button class="btn btn-success" onclick="openSalesModal()">
                    <i data-lucide="plus"></i>
                    Catat Penjualan
                </button>
            </div>
        </div>

        <div class="summary-stats">
            <div class="summary-item">
                <div class="summary-label">Total Item</div>
                <div class="summary-value items" id="totalSoldItems">0</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title" id="soldTableTitle">Produk Terjual (Hari Ini) - Total: <span id="totalSoldCount">0</span> item</h3>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Produk</th>
                        <th>Customer</th>
                        <th>Qty Terjual</th>
                        <th>Harga Satuan</th>
                        <th>Total Penjualan</th>
                        <th>Profit</th>
                        <th>Sumber</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody id="soldProductsTableBody"></tbody>
            </table>
        </div>
    `;
    
    setTimeout(initializeIcons, 50);
}

function createBestSellerPageStructure() {
    const bestSellerPage = getElement('#best-sellerPage');
    if (!bestSellerPage || bestSellerPage.innerHTML.trim()) return;
    
    bestSellerPage.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <i data-lucide="trophy"></i>
                    Best Seller
                </h1>
            </div>
            <div class="page-actions">
                <div class="filter-group">
                    <label>Filter Periode</label>
                    <select id="periodFilterBest" onchange="loadBestSellers()">
                        <option value="today">Hari Ini</option>
                        <option value="7">7 Hari Terakhir</option>
                        <option value="30">30 Hari Terakhir</option>
                        <option value="90">3 Bulan Terakhir</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="summary-stats">
            <div class="summary-item">
                <div class="summary-label" id="bestSellerLabel">Produk Best Seller (Hari Ini)</div>
                <div class="summary-value success" id="bestSellerCount">0</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title" id="bestSellerTableTitle">Produk Best Seller (Hari Ini)</h3>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Produk</th>
                        <th>Total Terjual</th>
                        <th>Total Orders</th>
                        <th>Total Revenue</th>
                        <th>Total Profit</th>
                    </tr>
                </thead>
                <tbody id="bestSellerTableBody"></tbody>
            </table>
        </div>
    `;
    
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
            <div class="page-actions">
                <div class="filter-group">
                    <label>Filter Periode</label>
                    <select id="periodFilterCancelled" onchange="loadCancelledOrders()">
                        <option value="today">Hari Ini</option>
                        <option value="7">7 Hari Terakhir</option>
                        <option value="30">30 Hari Terakhir</option>
                        <option value="90">3 Bulan Terakhir</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="summary-stats">
            <div class="summary-item">
                <div class="summary-label">Total Cancelled</div>
                <div class="summary-value danger" id="totalCancelledCount">0 orders</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Items Cancelled</div>
                <div class="summary-value warning" id="totalCancelledItems">0 items</div>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title" id="cancelledTableTitle">Order Dibatalkan (Hari Ini)</h3>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Tanggal Order</th>
                        <th>Tanggal Cancel</th>
                        <th>Produk</th>
                        <th>Customer</th>
                        <th>Qty</th>
                        <th>Sumber</th>
                    </tr>
                </thead>
                <tbody id="cancelledOrdersTableBody"></tbody>
            </table>
        </div>
    `;
    
    setTimeout(initializeIcons, 50);
}

// Helper functions
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