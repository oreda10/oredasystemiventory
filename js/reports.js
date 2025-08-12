// js/reports.js - CLEANED VERSION

// === REPORTS AND ANALYTICS ===

// === MAIN REPORTS FUNCTION ===
function loadReports() {
    createReportsPageStructure();
    
    const period = getElement('#periodFilterReports')?.value || 'today';
    const { startDate, endDate } = getDateRange(period);
    
    const periodCompletedSales = getFilteredSales(period, 'completed');
    const periodCancelledSales = getFilteredSales(period, 'cancelled');
    
    // Calculate financial metrics
    const financialData = calculateFinancialMetrics(periodCompletedSales, periodCancelledSales);
    
    // Update report period text
    updateReportPeriodText(period);
    
    // Update summary stats
    updateReportStats(financialData);
    
    // Update charts and analysis
    setTimeout(() => {
        updateProfitLossChart(period);
        updatePerformanceMetrics();
        updateTopProductsChart(period);
        updateCategoryAnalysis(period);
        updatePrintReportData(period);
    }, 100);
}

function createReportsPageStructure() {
    const reportsPage = getElement('#reportsPage');
    if (!reportsPage || reportsPage.innerHTML.trim()) return;
    
    reportsPage.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <i data-lucide="trending-up"></i>
                    Laporan Keuangan
                </h1>
            </div>
            <div class="page-actions">
                <div class="filter-group">
                    <label>Filter Periode</label>
                    <select id="periodFilterReports" onchange="loadReports()">
                        <option value="today">Hari Ini</option>
                        <option value="7">7 Hari Terakhir</option>
                        <option value="30">30 Hari Terakhir</option>
                        <option value="90">3 Bulan Terakhir</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Format Export</label>
                    <select id="exportFormat">
                        <option value="print">Print PDF</option>
                        <option value="excel">Excel (.xlsx)</option>
                    </select>
                </div>
                <button class="btn btn-info" onclick="exportReport()">
                    <i data-lucide="download"></i>
                    Export Laporan
                </button>
            </div>
        </div>

        <!-- Print Report Container -->
        <div id="printReportContainer" style="background: var(--bg-secondary); padding: 16px; border-radius: 10px; box-shadow: 0 2px 4px var(--shadow); border: 1px solid var(--border-color);">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid var(--accent-color); padding-bottom: 16px;">
                <div style="font-size: 1.8rem; font-weight: 700; color: var(--accent-color); margin-bottom: 8px;">OREDA FASHION</div>
                <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 12px;">Laporan Keuangan Bisnis</div>
                <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 6px; font-weight: 600; color: var(--text-primary);" id="reportPeriodText">Periode: Hari Ini</div>
            </div>

            <!-- Financial Overview -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; border-left: 3px solid var(--accent-color); padding-left: 12px;">
                    <i data-lucide="bar-chart-3"></i>
                    Ringkasan Keuangan
                </div>
                <div class="summary-stats" id="reportStatsGrid">
                    <div class="summary-item">
                        <div class="summary-label">Total Penjualan</div>
                        <div class="summary-value sales" id="reportTotalSales">Rp 0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Total Modal</div>
                        <div class="summary-value warning" id="reportTotalModal">Rp 0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Keuntungan Bersih</div>
                        <div class="summary-value profit" id="reportNetProfit">Rp 0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Margin (%)</div>
                        <div class="summary-value success" id="reportMargin">0%</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Barang Terjual</div>
                        <div class="summary-value items" id="reportItemsSold">0 item</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Success Rate</div>
                        <div class="summary-value success" id="reportSuccessRate">0%</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Total Stock</div>
                        <div class="summary-value info" id="reportTotalStock">0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">ROI</div>
                        <div class="summary-value info" id="reportROI">0%</div>
                    </div>
                </div>
            </div>

            <!-- Top Products -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; border-left: 3px solid var(--accent-color); padding-left: 12px;">
                    <i data-lucide="trophy"></i>
                    Top 5 Produk Terlaris
                </div>
                <div class="table-container">
                    <table id="topProductsPrintTable">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Produk</th>
                                <th>Qty Terjual</th>
                                <th>Total Penjualan</th>
                                <th>Total Profit</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>

            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-color); text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
                <p><strong>OREDA Fashion Management System</strong> | Generated on <span id="reportGeneratedDate"></span></p>
                <p>Confidential Business Report - For Internal Use Only</p>
            </div>
        </div>

        <!-- Key Performance Indicators -->
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">
                    <i data-lucide="trending-up"></i>
                    Tren Penjualan & Keuntungan
                </div>
                <div class="chart-container">
                    <canvas id="profitLossChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-title">
                    <i data-lucide="target"></i>
                    Performance Metrics
                </div>
                <div id="performanceMetrics"></div>
            </div>
        </div>

        <!-- Detailed Analysis -->
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">
                    <i data-lucide="trophy"></i>
                    Top 5 Produk Terlaris
                </div>
                <div class="chart-container">
                    <canvas id="topProductsChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-title">
                    <i data-lucide="pie-chart"></i>
                    Analisis Kategori
                </div>
                <div id="categoryAnalysis"></div>
            </div>
        </div>
    `;
    
    initializeIcons();
}

// === FINANCIAL CALCULATIONS ===
function calculateFinancialMetrics(completedSales, cancelledSales) {
    const totalSales = sum(completedSales, 'total');
    const totalModal = completedSales.reduce((sum, sale) => {
        const product = getProductById(sale.productId);
        return sum + (product ? product.buyPrice * sale.quantity : 0);
    }, 0);
    const netProfit = sum(completedSales, 'profit');
    const margin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const itemsSold = sum(completedSales, 'quantity');
    const roi = totalModal > 0 ? (netProfit / totalModal) * 100 : 0;
    const totalStock = sum(appData.products, 'stock');
    
    const totalOrders = completedSales.length + cancelledSales.length;
    const successRate = totalOrders > 0 ? (completedSales.length / totalOrders) * 100 : 0;
    
    return {
        totalSales,
        totalModal,
        netProfit,
        margin,
        itemsSold,
        roi,
        totalStock,
        successRate,
        totalOrders,
        completedOrders: completedSales.length,
        cancelledOrders: cancelledSales.length
    };
}

function updateReportPeriodText(period) {
    const periodTexts = {
        'today': 'Hari Ini',
        '7': '7 Hari Terakhir', 
        '30': '30 Hari Terakhir',
        '90': '3 Bulan Terakhir'
    };
    const periodText = periodTexts[period] || 'Hari Ini';
    
    const reportPeriodElements = getAllElements('#reportPeriodText');
    reportPeriodElements.forEach(el => {
        if (el) el.textContent = `Periode: ${periodText}`;
    });
}

function updateReportStats(financialData) {
    const elements = {
        'reportTotalSales': formatCurrency(financialData.totalSales),
        'reportTotalModal': formatCurrency(financialData.totalModal),
        'reportNetProfit': formatCurrency(financialData.netProfit),
        'reportMargin': formatPercentage(financialData.margin, 1),
        'reportItemsSold': formatNumber(financialData.itemsSold) + ' item',
        'reportSuccessRate': formatPercentage(financialData.successRate, 1),
        'reportTotalStock': formatNumber(financialData.totalStock) + ' item',
        'reportROI': formatPercentage(financialData.roi, 1)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = getElement(`#${id}`);
        if (element) element.textContent = value;
    });
}

// === CHART FUNCTIONS ===
function updateProfitLossChart(period = 'today') {
    const ctx = getElement('#profitLossChart')?.getContext('2d');
    if (!ctx) {
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        setTimeout(() => updateProfitLossChart(period), 500);
        return;
    }
    
    // Destroy existing chart
    if (appData.charts.profitLoss) {
        appData.charts.profitLoss.destroy();
        appData.charts.profitLoss = null;
    }
    
    // Generate data based on period
    const chartData = generateProfitLossData(period);
    const colors = getThemeColors();
    
    try {
        appData.charts.profitLoss = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Keuntungan',
                    data: chartData.profitData,
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                    borderWidth: 1
                }, {
                    label: 'Kerugian (Cancelled)',
                    data: chartData.lossData,
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: colors.text
                        },
                        grid: {
                            color: colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: colors.text,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            color: colors.grid
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: colors.text
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.background,
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating profit loss chart:', error);
    }
}

function generateProfitLossData(period) {
    const labels = [];
    const profitData = [];
    const lossData = [];
    
    let days = 7;
    if (period === '30' || period === '90') days = 30;
    if (period === '7') days = 7;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayCompletedSales = appData.sales.filter(sale => 
            sale.status === 'completed' && 
            new Date(sale.date) >= dayStart && 
            new Date(sale.date) <= dayEnd
        );
        
        const dayCancelledSales = appData.sales.filter(sale => 
            sale.status === 'cancelled' && 
            new Date(sale.date) >= dayStart && 
            new Date(sale.date) <= dayEnd
        );
        
        labels.push(date.toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: days > 7 ? '2-digit' : 'short' 
        }));
        
        profitData.push(sum(dayCompletedSales, 'profit'));
        lossData.push(sum(dayCancelledSales, 'profit')); // Potential lost profit
    }
    
    return { labels, profitData, lossData };
}

function updateTopProductsChart(period = 'today') {
    const ctx = getElement('#topProductsChart')?.getContext('2d');
    if (!ctx) {
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        setTimeout(() => updateTopProductsChart(period), 500);
        return;
    }
    
    // Destroy existing chart
    if (appData.charts.topProducts) {
        appData.charts.topProducts.destroy();
        appData.charts.topProducts = null;
    }
    
    const bestSellers = getBestSellersData(period, 5);
    const labels = bestSellers.map(item => item.name);
    const data = bestSellers.map(item => item.totalSold);
    const colors = getThemeColors();
    
    try {
        appData.charts.topProducts = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Qty Terjual',
                    data: data,
                    backgroundColor: [
                        '#FFD700', // Gold
                        '#C0C0C0', // Silver 
                        '#CD7F32', // Bronze
                        colors.primary,
                        colors.success
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: colors.background,
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.primary,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: colors.text
                        },
                        grid: {
                            color: colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: colors.text
                        },
                        grid: {
                            color: colors.grid
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating top products chart:', error);
    }
}

function updatePerformanceMetrics() {
    const widget = getElement('#performanceMetrics');
    if (!widget) return;
    
    const totalProducts = appData.products.length;
    const activeProducts = appData.products.filter(p => p.stock > 0).length;
    const lowStockProducts = appData.products.filter(p => p.stock < 5).length;
    const totalStock = sum(appData.products, 'stock');
    
    const avgStockPerProduct = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;
    const activePercentage = totalProducts > 0 ? ((activeProducts / totalProducts) * 100).toFixed(1) : 0;
    
    widget.innerHTML = `
        <div style="padding: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div style="text-align: center; padding: 12px; background: var(--bg-tertiary); border-radius: 6px;">
                    <div style="font-size: 1.3rem; font-weight: bold; color: var(--success-color);">${formatNumber(activeProducts)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Produk Aktif</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-tertiary); border-radius: 6px;">
                    <div style="font-size: 1.3rem; font-weight: bold; color: var(--danger-color);">${formatNumber(lowStockProducts)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Stok Rendah</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-tertiary); border-radius: 6px;">
                    <div style="font-size: 1.3rem; font-weight: bold; color: var(--accent-color);">${formatNumber(totalStock)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Total Stok</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-tertiary); border-radius: 6px;">
                    <div style="font-size: 1.3rem; font-weight: bold; color: var(--info-color);">${formatNumber(totalProducts)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Total Katalog</div>
                </div>
            </div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
                <h6 style="margin-bottom: 8px; color: var(--text-primary); font-size: 0.9rem;">Quick Stats:</h6>
                <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
                    • Tingkat Perputaran: ${activePercentage}%<br>
                    • Alert Stok: ${formatNumber(lowStockProducts)} produk perlu restock<br>
                    • Rata-rata Stok per Produk: ${formatNumber(avgStockPerProduct)} item
                </div>
            </div>
        </div>
    `;
}

function updateCategoryAnalysis(period = 'today') {
    const widget = getElement('#categoryAnalysis');
    if (!widget) return;
    
    const completedSales = getFilteredSales(period, 'completed');
    const categoryData = {};
    
    completedSales.forEach(sale => {
        const product = getProductById(sale.productId);
        if (product) {
            if (!categoryData[product.category]) {
                categoryData[product.category] = {
                    sales: 0,
                    profit: 0,
                    quantity: 0
                };
            }
            categoryData[product.category].sales += sale.total;
            categoryData[product.category].profit += sale.profit;
            categoryData[product.category].quantity += sale.quantity;
        }
    });
    
    const sortedCategories = Object.entries(categoryData)
        .sort(([,a], [,b]) => b.sales - a.sales);
    
    if (sortedCategories.length === 0) {
        widget.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="pie-chart"></i></div>
                <div class="empty-state-text">Belum ada data kategori</div>
            </div>
        `;
        initializeIcons();
        return;
    }
    
    widget.innerHTML = `
        <div style="padding: 16px;">
            ${sortedCategories.map(([category, data]) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <span class="category-badge ${getCategoryBadgeClass(category)}">${category}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: var(--text-primary);">${formatCurrency(data.sales)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${formatNumber(data.quantity)} item terjual</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function updatePrintReportData(period = 'today') {
    const bestSellers = getBestSellersData(period, 5);
    const tbody = getElement('#topProductsPrintTable tbody');
    
    if (tbody) {
        if (bestSellers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 16px;">Belum ada data penjualan untuk periode ini</td></tr>';
        } else {
            tbody.innerHTML = bestSellers.map((item, index) => `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${index + 1}</td>
                    <td style="font-weight: 600;">${item.name}</td>
                    <td style="text-align: center; font-weight: 600;">${formatNumber(item.totalSold)}</td>
                    <td style="text-align: right;">${formatCurrency(item.totalSales)}</td>
                    <td style="text-align: right; color: var(--success-color); font-weight: 600;">${formatCurrency(item.totalProfit)}</td>
                </tr>
            `).join('');
        }
    }
    
    // Update generated date
    const reportGeneratedDate = getElement('#reportGeneratedDate');
    if (reportGeneratedDate) {
        reportGeneratedDate.textContent = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// === EXPORT FUNCTIONS ===
function exportReport() {
    const format = getElement('#exportFormat')?.value || 'print';
    
    if (format === 'print') {
        printReport();
    } else if (format === 'excel') {
        exportToExcel();
    }
}

function printReport() {
    // Ensure data is loaded
    loadReports();
    
    setTimeout(() => {
        window.print();
    }, 1000);
}

function exportToExcel() {
    try {
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            showNotification('Error: Library Excel tidak dapat dimuat. Silakan refresh halaman dan coba lagi.', 'error');
            return;
        }
        
        const period = getElement('#periodFilterReports')?.value || 'today';
        const periodCompletedSales = getFilteredSales(period, 'completed');
        const periodCancelledSales = getFilteredSales(period, 'cancelled');
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = createSummarySheet(period, periodCompletedSales, periodCancelledSales);
        const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
        
        // Sales detail sheet
        const salesData = createSalesDetailSheet(periodCompletedSales, periodCancelledSales);
        const salesWS = XLSX.utils.aoa_to_sheet(salesData);
        XLSX.utils.book_append_sheet(wb, salesWS, 'Sales Detail');
        
        // Products sheet
        const productsData = createProductsSheet();
        const productsWS = XLSX.utils.aoa_to_sheet(productsData);
        XLSX.utils.book_append_sheet(wb, productsWS, 'Products');
        
        // Best sellers sheet
        const bestSellersData = createBestSellersSheet(period);
        const bestSellersWS = XLSX.utils.aoa_to_sheet(bestSellersData);
        XLSX.utils.book_append_sheet(wb, bestSellersWS, 'Best Sellers');
        
        // Generate filename with date
        const today = new Date();
        const filename = `OREDA_Report_${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}.xlsx`;
        
        // Write file
        XLSX.writeFile(wb, filename);
        
        showNotification('Laporan berhasil diexport ke Excel!', 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showNotification('Error saat export Excel: ' + error.message, 'error');
    }
}

// === EXCEL SHEET CREATORS ===
function createSummarySheet(period, completedSales, cancelledSales) {
    const financialData = calculateFinancialMetrics(completedSales, cancelledSales);
    const periodText = getPeriodText(period);
    
    return [
        ['OREDA Fashion - Laporan Keuangan'],
        ['Periode:', periodText],
        ['Generated:', new Date().toLocaleDateString('id-ID')],
        [],
        ['Ringkasan Keuangan'],
        ['Total Penjualan', financialData.totalSales],
        ['Total Modal', financialData.totalModal],
        ['Keuntungan Bersih', financialData.netProfit],
        ['Margin (%)', financialData.margin],
        ['Barang Terjual', financialData.itemsSold],
        ['Order Completed', financialData.completedOrders],
        ['Order Cancelled', financialData.cancelledOrders],
        ['Success Rate (%)', financialData.successRate],
        ['Total Stok', financialData.totalStock],
        ['ROI (%)', financialData.roi]
    ];
}

function createSalesDetailSheet(completedSales, cancelledSales) {
    const salesHeaders = ['Tanggal', 'Produk', 'Customer', 'Qty', 'Harga Jual', 'Total', 'Profit', 'Sumber', 'Status'];
    const salesData = [salesHeaders];
    
    [...completedSales, ...cancelledSales]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(sale => {
            const product = getProductById(sale.productId);
            salesData.push([
                formatDate(sale.date),
                product ? product.name : 'Produk Dihapus',
                sale.customerName,
                sale.quantity,
                sale.sellPrice || (product ? product.sellPrice : 0),
                sale.total,
                sale.profit,
                getSourceText(sale.source),
                sale.status === 'completed' ? 'Selesai' : 'Dibatalkan'
            ]);
        });
    
    return salesData;
}

function createProductsSheet() {
    const productsHeaders = ['Nama Produk', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Margin %', 'Total Terjual'];
    const productsData = [productsHeaders];
    
    appData.products.forEach(product => {
        const soldCount = appData.sales
            .filter(sale => sale.productId === product.id && sale.status === 'completed')
            .reduce((sum, sale) => sum + sale.quantity, 0);
        
        productsData.push([
            product.name,
            product.category,
            product.stock,
            product.buyPrice,
            product.sellPrice,
            calculateMargin(product.sellPrice, product.buyPrice),
            soldCount
        ]);
    });
    
    return productsData;
}

function createBestSellersSheet(period) {
    const bestSellers = getBestSellersData(period);
    const bestSellersHeaders = ['Rank', 'Produk', 'Total Terjual', 'Total Penjualan', 'Total Profit'];
    const bestSellersData = [bestSellersHeaders];
    
    bestSellers.forEach((item, index) => {
        bestSellersData.push([
            index + 1,
            item.name,
            item.totalSold,
            item.totalSales,
            item.totalProfit
        ]);
    });
    
    return bestSellersData;
}

// === STOCK HISTORY FUNCTIONS ===
function openStockHistory() {
    createStockHistoryModal();
    
    // Load products for filter dropdown
    const productFilter = getElement('#stockHistoryProductFilter');
    if (productFilter) {
        productFilter.innerHTML = '<option value="">Semua Produk</option>' + 
            appData.products.map(product => 
                `<option value="${product.id}">${product.name}</option>`
            ).join('');
    }
    
    loadStockHistory();
    const modal = getElement('#stockHistoryModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeStockHistory() {
    const modal = getElement('#stockHistoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadStockHistory() {
    const tbody = getElement('#stockHistoryTableBody');
    if (!tbody) return;
    
    let filteredHistory = [...appData.stockHistory];
    
    // Apply filters
    const productFilter = getElement('#stockHistoryProductFilter')?.value;
    const periodFilter = getElement('#stockHistoryPeriodFilter')?.value;
    const typeFilter = getElement('#stockHistoryTypeFilter')?.value;
    
    if (productFilter) {
        filteredHistory = filteredHistory.filter(h => h.productId === productFilter);
    }
    
    if (periodFilter && periodFilter !== 'all') {
        const { startDate, endDate } = getDateRange(periodFilter);
        filteredHistory = filteredHistory.filter(h => {
            const historyDate = new Date(h.date);
            return historyDate >= startDate && historyDate <= endDate;
        });
    }
    
    if (typeFilter) {
        filteredHistory = filteredHistory.filter(h => h.type === typeFilter);
    }
    
    if (filteredHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="file-text"></i></div>
                    <div class="empty-state-text">Tidak ada riwayat stok</div>
                </td>
            </tr>
        `;
        initializeIcons();
        return;
    }
    
    tbody.innerHTML = filteredHistory.map(history => {
        const product = getProductById(history.productId);
        const productName = product ? product.name : 'Produk Dihapus';
        
        return `
            <tr>
                <td>${formatDate(history.date)}</td>
                <td><strong style="color: var(--text-primary);">${productName}</strong></td>
                <td>
                    <span style="color: ${history.type === 'in' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">
                        ${history.type === 'in' ? 'Stock In (+)' : 'Stock Out (-)'}
                    </span>
                </td>
                <td><strong>${formatNumber(history.quantity)}</strong></td>
                <td><strong>${formatNumber(history.finalStock)}</strong></td>
                <td style="font-size: 0.75rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${history.note || '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function filterStockHistory() {
    loadStockHistory();
}

function createStockHistoryModal() {
    const modalContainer = getElement('#modalContainer');
    if (!modalContainer) return;
    
    // Check if modal already exists
    if (getElement('#stockHistoryModal')) return;
    
    modalContainer.innerHTML += `
        <div id="stockHistoryModal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i data-lucide="file-text"></i>
                        Riwayat Perubahan Stok
                    </h3>
                    <button class="close-btn" onclick="closeStockHistory()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="filters">
                    <div class="filter-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Filter Produk</label>
                            <select id="stockHistoryProductFilter" onchange="filterStockHistory()">
                                <option value="">Semua Produk</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Filter Periode</label>
                            <select id="stockHistoryPeriodFilter" onchange="filterStockHistory()">
                                <option value="all">Semua Periode</option>
                                <option value="today">Hari Ini</option>
                                <option value="7">7 Hari Terakhir</option>
                                <option value="30">30 Hari Terakhir</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Filter Tipe</label>
                            <select id="stockHistoryTypeFilter" onchange="filterStockHistory()">
                                <option value="">Semua Tipe</option>
                                <option value="in">Stock In (+)</option>
                                <option value="out">Stock Out (-)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Riwayat Perubahan Stok</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Produk</th>
                                <th>Tipe</th>
                                <th>Qty</th>
                                <th>Stok Akhir</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody id="stockHistoryTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(initializeIcons, 100);
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

// === MAKE FUNCTIONS GLOBAL ===
window.loadReports = loadReports;
window.exportReport = exportReport;
window.printReport = printReport;
window.exportToExcel = exportToExcel;
window.openStockHistory = openStockHistory;
window.closeStockHistory = closeStockHistory;
window.loadStockHistory = loadStockHistory;
window.filterStockHistory = filterStockHistory;