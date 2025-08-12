// js/dashboard.js - CLEAN VERSION WITH IMPROVED MOBILE RESPONSIVENESS

// === CONSTANTS & CONFIGURATION ===
const DASHBOARD_CONFIG = {
    CHART_REFRESH_DELAY: 100,
    CHART_RETRY_DELAY: 500,
    RESIZE_DEBOUNCE: 500, // Increased from 250
    MOBILE_BREAKPOINT: 768,
    SAMPLE_DATA_DAYS: 30,
    LOW_STOCK_THRESHOLD: 5,
    BEST_SELLERS_LIMIT: 5,
    RECENT_SALES_LIMIT: 5,
    CHART_UPDATE_THROTTLE: 1000, // Minimum time between chart updates
    SCROLL_DEBOUNCE: 150, // Time to wait after scroll stops
    SIGNIFICANT_RESIZE: 50 // Minimum pixels to trigger resize
};

// === UTILITY FUNCTIONS ===
const isMobile = () => window.innerWidth < DASHBOARD_CONFIG.MOBILE_BREAKPOINT;

// === CURRENCY FORMATTING ===
function formatCurrency(value, isChart = false) {
    if (!value) return isChart ? 'Rp 0' : 'Rp 0';
    
    const absValue = Math.abs(value);
    
    if (isChart) {
        if (absValue >= 1000000) {
            return `Rp ${(value / 1000000).toFixed(1).replace(/\.0$/, '')} jt`;
        } else if (absValue >= 1000) {
            return `Rp ${(value / 1000).toFixed(1).replace(/\.0$/, '')} rb`;
        }
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    } else {
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    }
}

// === MAIN DASHBOARD CONTROLLER ===
class DashboardController {
    constructor() {
        this.currentPeriod = 'today';
        this.lastWidth = window.innerWidth;
        this.isUpdating = false;
        this.updateQueue = null;
        this.resizeHandler = this.createResizeHandler();
        this.isScrolling = false;
        this.scrollTimeout = null;
    }

    createResizeHandler() {
        let timeout;
        let isResizing = false;
        
        return () => {
            // Detect if we're scrolling vs actually resizing
            if (this.isScrolling) {
                return; // Ignore resize events during scroll
            }
            
            const currentWidth = window.innerWidth;
            const widthDifference = Math.abs(currentWidth - this.lastWidth);
            
            // Only trigger if width changed significantly (more than configured threshold)
            if (widthDifference < DASHBOARD_CONFIG.SIGNIFICANT_RESIZE && !isResizing) {
                return;
            }
            
            isResizing = true;
            clearTimeout(timeout);
            
            timeout = setTimeout(() => {
                if (currentWidth !== this.lastWidth) {
                    console.log(`📱 Significant resize detected: ${this.lastWidth}px → ${currentWidth}px`);
                    this.lastWidth = currentWidth;
                    this.handleResize();
                }
                isResizing = false;
            }, DASHBOARD_CONFIG.RESIZE_DEBOUNCE);
        };
    }

    init() {
        this.setupFilters();
        this.hideLoading();
        this.checkDataAndGenerate();
        this.update();
        this.bindEvents();
    }

    setupFilters() {
        const periodFilter = getElement('#periodFilter');
        if (periodFilter) {
            periodFilter.innerHTML = APP_CONFIG.dashboardPeriods
                .map(period => `<option value="${period.value}">${period.label}</option>`)
                .join('');
            
            // Use change event with debouncing to prevent rapid updates
            let filterTimeout;
            periodFilter.addEventListener('change', () => {
                clearTimeout(filterTimeout);
                filterTimeout = setTimeout(() => {
                    console.log('📅 Period filter changed to:', periodFilter.value);
                    ChartManager.resetThrottling(); // Allow immediate update on filter change
                    this.update();
                }, 100);
            });
        }
    }

    hideLoading() {
        const loading = getElement('#dashboardLoading');
        if (loading) loading.style.display = 'none';
    }

    checkDataAndGenerate() {
        if (appData.sales.length === 0) {
            console.log('No sales data found, generating sample data...');
            SampleDataGenerator.generate();
        }
    }

    update() {
        // Prevent multiple simultaneous updates
        if (this.isUpdating) {
            console.log('🔄 Dashboard update already in progress, skipping...');
            return;
        }
        
        this.isUpdating = true;
        this.currentPeriod = getElement('#periodFilter')?.value || 'today';
        
        try {
            StatsManager.update(this.currentPeriod);
            
            // Use requestAnimationFrame for smoother updates
            requestAnimationFrame(() => {
                setTimeout(() => {
                    ChartManager.updateSalesChart(this.currentPeriod);
                    ChartManager.updateOrderChart(this.currentPeriod);
                    WidgetManager.updateBestSellers(this.currentPeriod);
                    WidgetManager.updateRecentSales();
                    WidgetManager.updateStockAlert();
                    this.isUpdating = false;
                }, DASHBOARD_CONFIG.CHART_REFRESH_DELAY);
            });
        } catch (error) {
            console.error('❌ Dashboard update error:', error);
            this.isUpdating = false;
        }
    }

    handleResize() {
        if (appData.ui.currentPage === 'dashboard' && !this.isUpdating) {
            console.log('📱 Window resized, updating dashboard...');
            this.update();
        }
    }

    bindEvents() {
        // Bind resize handler
        window.addEventListener('resize', this.resizeHandler);
        
        // Detect scroll events to prevent false resize triggers
        let scrollTimer;
        const scrollHandler = () => {
            this.isScrolling = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.isScrolling = false;
            }, DASHBOARD_CONFIG.SCROLL_DEBOUNCE);
        };
        
        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Store reference for cleanup
        this.scrollHandler = scrollHandler;
        
        // Detect orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (!this.isScrolling) {
                    console.log('📱 Orientation changed, updating dashboard...');
                    ChartManager.resetThrottling();
                    this.handleResize();
                }
            }, 300);
        });
        
        // Detect touch events on mobile to better handle scroll detection
        let isTouching = false;
        if ('ontouchstart' in window) {
            window.addEventListener('touchstart', () => {
                isTouching = true;
            }, { passive: true });
            
            window.addEventListener('touchend', () => {
                setTimeout(() => {
                    isTouching = false;
                }, 100);
            }, { passive: true });
            
            // Override scroll detection for touch devices
            const originalScrollHandler = this.scrollHandler;
            this.scrollHandler = () => {
                if (isTouching) {
                    this.isScrolling = true;
                    clearTimeout(scrollTimer);
                    scrollTimer = setTimeout(() => {
                        this.isScrolling = false;
                    }, DASHBOARD_CONFIG.SCROLL_DEBOUNCE * 2); // Longer debounce on touch
                } else {
                    originalScrollHandler();
                }
            };
        }
    }
    
    destroy() {
        // Clean up event listeners
        window.removeEventListener('resize', this.resizeHandler);
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        this.isUpdating = false;
        ChartManager.resetThrottling();
    }
    
    // Force update (bypass throttling)
    forceUpdate() {
        this.isUpdating = false;
        ChartManager.resetThrottling();
        this.update();
    }
}

// === STATS CARD MANAGER ===
class StatsManager {
    static update(period) {
        const { startDate, endDate } = getDateRange(period);
        
        const currentData = this.calculatePeriodData(startDate, endDate);
        const previousData = this.calculatePreviousPeriodData(startDate, endDate, period);
        
        const changes = this.calculateChanges(currentData, previousData);
        
        this.updateCards(currentData, changes);
        this.logStats(period, currentData, previousData, changes);
    }

    static calculatePeriodData(startDate, endDate) {
        const completedSales = appData.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return sale.status === 'completed' && saleDate >= startDate && saleDate <= endDate;
        });
        
        const cancelledSales = appData.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return sale.status === 'cancelled' && saleDate >= startDate && saleDate <= endDate;
        });
        
        return {
            totalSales: sum(completedSales, 'total'),
            totalProfit: sum(completedSales, 'profit'),
            itemsSold: sum(completedSales, 'quantity'),
            cancelledCount: cancelledSales.length
        };
    }

    static calculatePreviousPeriodData(startDate, endDate, period) {
        const periodDays = period === 'today' ? 1 : Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - periodDays);
        
        const prevEndDate = new Date(startDate);
        prevEndDate.setTime(prevEndDate.getTime() - 1);
        
        return this.calculatePeriodData(prevStartDate, prevEndDate);
    }

    static calculateChanges(current, previous) {
        return {
            salesChange: calculatePercentageChange(current.totalSales, previous.totalSales),
            profitChange: calculatePercentageChange(current.totalProfit, previous.totalProfit),
            itemsChange: current.itemsSold - previous.itemsSold,
            cancelledChange: current.cancelledCount - previous.cancelledCount
        };
    }

    static updateCards(data, changes) {
        StatCard.update('totalSales', formatCurrency(data.totalSales), 'salesChange', changes.salesChange, true);
        StatCard.update('totalProfit', formatCurrency(data.totalProfit), 'profitChange', changes.profitChange, true);
        StatCard.update('itemsSold', formatNumber(data.itemsSold), 'itemsChange', changes.itemsChange, false);
        StatCard.update('cancelledOrders', formatNumber(data.cancelledCount), 'cancelledChange', changes.cancelledChange, false, true);
    }

    static logStats(period, current, previous, changes) {
        console.log('📊 Dashboard Stats Update:', {
            period,
            current,
            previous,
            changes
        });
    }
}

// === INDIVIDUAL STAT CARD HANDLER ===
class StatCard {
    static update(valueId, value, changeId, change, isPercentage = true, isNegativeGood = false) {
        const valueElement = getElement(`#${valueId}`);
        const changeElement = getElement(`#${changeId}`);
        
        if (valueElement) {
            this.updateValue(valueElement, value);
        }
        
        if (changeElement) {
            this.updateChange(changeElement, change, isPercentage, isNegativeGood);
        }
    }

    static updateValue(element, value) {
        element.textContent = value;
        this.applyMobileStyles(element);
    }

    static updateChange(element, change, isPercentage, isNegativeGood) {
        const { text, className } = this.formatChange(change, isPercentage, isNegativeGood);
        
        element.textContent = text;
        element.className = `stat-change ${className}`;
        
        this.applyChangeStyles(element, className);
        this.applyMobileStyles(element);
    }

    static formatChange(change, isPercentage, isNegativeGood) {
        let text, className;
        
        if (isPercentage) {
            if (!isFinite(change)) {
                text = '+0%';
                className = 'neutral';
            } else {
                text = (change >= 0 ? '+' : '') + formatPercentage(change, 1);
                className = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
            }
        } else {
            text = (change >= 0 ? '+' : '') + formatNumber(change);
            className = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
        }
        
        if (isNegativeGood) {
            className = change <= 0 ? 'positive' : 'negative';
        }
        
        return { text, className };
    }

    static applyChangeStyles(element, className) {
        element.style.fontWeight = '600';
        
        const colorMap = {
            positive: 'var(--success-color)',
            negative: 'var(--danger-color)',
            neutral: 'var(--text-secondary)'
        };
        
        element.style.color = colorMap[className] || colorMap.neutral;
    }

    static applyMobileStyles(element) {
        Object.assign(element.style, {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal',
            maxWidth: '100%',
            wordBreak: 'break-word'
        });
    }
}

// === CHART MANAGER ===
class ChartManager {
    static lastSalesChartUpdate = 0;
    static lastOrderChartUpdate = 0;
    static chartUpdateThrottle = DASHBOARD_CONFIG.CHART_UPDATE_THROTTLE;
    
    static updateSalesChart(period = 'today') {
        const now = Date.now();
        
        // Throttle chart updates to prevent excessive re-rendering
        if (now - this.lastSalesChartUpdate < this.chartUpdateThrottle) {
            console.log('⏳ Sales chart update throttled');
            return;
        }
        
        const ctx = getElement('#salesChart')?.getContext('2d');
        if (!ctx) return;
        
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.updateSalesChart(period), DASHBOARD_CONFIG.CHART_RETRY_DELAY);
            return;
        }
        
        // Check if chart data actually changed before destroying and recreating
        const existingChart = appData.charts.sales;
        const newChartData = SalesChartDataGenerator.generate(period);
        
        if (existingChart && this.isSameChartData(existingChart.data, newChartData)) {
            console.log('📊 Sales chart data unchanged, skipping update');
            return;
        }
        
        this.destroyChart('sales');
        this.lastSalesChartUpdate = now;
        
        try {
            const options = SalesChartOptionsBuilder.build(period);
            
            appData.charts.sales = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: newChartData.labels,
                    datasets: this.buildSalesDatasets(newChartData)
                },
                options: {
                    ...options,
                    animation: { duration: 500, easing: 'easeInOutQuart' } // Shorter animation
                }
            });
            
            console.log('✅ Sales chart updated for period:', period);
        } catch (error) {
            console.error('❌ Sales chart creation failed:', error);
            // Don't retry immediately to prevent infinite loops
            setTimeout(() => this.updateSalesChart(period), 2000);
        }
    }

    static updateOrderChart(period = 'today') {
        const now = Date.now();
        
        if (now - this.lastOrderChartUpdate < this.chartUpdateThrottle) {
            console.log('⏳ Order chart update throttled');
            return;
        }
        
        const ctx = getElement('#orderChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('order');
        this.adjustOrderChartContainer();
        this.lastOrderChartUpdate = now;
        
        const data = this.getOrderChartData(period);
        const colors = getThemeColors();
        
        try {
            appData.charts.order = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Selesai', 'Dibatalkan'],
                    datasets: [{
                        data: [data.completed, data.cancelled],
                        backgroundColor: [colors.success, colors.danger],
                        borderWidth: isMobile() ? 1 : 2,
                        borderColor: colors.background
                    }]
                },
                options: {
                    ...OrderChartOptionsBuilder.build(),
                    animation: { duration: 300 } // Shorter animation
                }
            });
            
            console.log('✅ Order chart updated for period:', period);
        } catch (error) {
            console.error('❌ Order chart creation failed:', error);
        }
    }
    
    static isSameChartData(oldData, newData) {
        if (!oldData || !newData) return false;
        
        // Compare labels
        if (JSON.stringify(oldData.labels) !== JSON.stringify(newData.labels)) {
            return false;
        }
        
        // Compare sales data
        const oldSalesData = oldData.datasets[0]?.data || [];
        const newSalesData = newData.salesData || [];
        
        return JSON.stringify(oldSalesData) === JSON.stringify(newSalesData);
    }

    static resetThrottling() {
        this.lastSalesChartUpdate = 0;
        this.lastOrderChartUpdate = 0;
        console.log('🔄 Chart update throttling reset');
    }

    static destroyChart(chartType) {
        if (appData.charts[chartType]) {
            appData.charts[chartType].destroy();
            appData.charts[chartType] = null;
        }
    }

    static adjustOrderChartContainer() {
        const chartCanvas = getElement('#orderChart');
        if (!chartCanvas?.parentElement) return;
        
        const container = chartCanvas.parentElement;
        if (isMobile()) {
            container.style.minHeight = '250px';
            container.style.height = '35vh';
        } else {
            container.style.minHeight = '300px';
            container.style.height = 'auto';
        }
    }

    static getOrderChartData(period) {
        const completedSales = getFilteredSales(period, 'completed');
        const cancelledSales = getFilteredSales(period, 'cancelled');
        
        return {
            completed: completedSales.length,
            cancelled: cancelledSales.length
        };
    }

    static buildSalesDatasets(chartData) {
        const colors = getThemeColors();
        
        return [
            {
                label: 'Penjualan (Rp)',
                data: chartData.salesData,
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}20`,
                tension: 0.4,
                fill: true,
                yAxisID: 'y',
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            },
            {
                label: 'Keuntungan (Rp)',
                data: chartData.profitData,
                borderColor: colors.success,
                backgroundColor: `${colors.success}20`,
                tension: 0.4,
                fill: true,
                yAxisID: 'y',
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: colors.success,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            },
            {
                label: 'Barang Terjual (Qty)',
                data: chartData.itemsData,
                borderColor: colors.warning,
                backgroundColor: `${colors.warning}20`,
                tension: 0.4,
                fill: false,
                yAxisID: 'y1',
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: colors.warning,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ];
    }
}

// === SALES CHART DATA GENERATOR ===
class SalesChartDataGenerator {
    static generate(period) {
        const generator = this.getGeneratorByPeriod(period);
        return generator.call(this, period);
    }

    static getGeneratorByPeriod(period) {
        const generators = {
            'today': this.generateDailyData,
            '7': this.generateWeeklyData,
            '30': this.generateMonthlyData,
            '90': this.generateQuarterlyData
        };
        
        return generators[period] || generators['today'];
    }

    static generateDailyData() {
        const data = { labels: [], salesData: [], profitData: [], itemsData: [] };
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const { dayStart, dayEnd } = this.getDayBounds(date);
            const daySales = this.getFilteredSales(dayStart, dayEnd);
            
            data.labels.push(date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
            data.salesData.push(sum(daySales, 'total'));
            data.profitData.push(sum(daySales, 'profit'));
            data.itemsData.push(sum(daySales, 'quantity'));
        }
        
        return this.addSampleDataIfEmpty(data, 'today');
    }

    static generateWeeklyData() {
        const data = { labels: [], salesData: [], profitData: [], itemsData: [] };
        const weeksToShow = 4;
        
        for (let weekOffset = weeksToShow - 1; weekOffset >= 0; weekOffset--) {
            const { weekStart, weekEnd } = this.getWeekBounds(weekOffset);
            const weekSales = this.getFilteredSales(weekStart, weekEnd);
            
            const label = this.getWeekLabel(weekOffset);
            
            data.labels.push(label);
            data.salesData.push(sum(weekSales, 'total'));
            data.profitData.push(sum(weekSales, 'profit'));
            data.itemsData.push(sum(weekSales, 'quantity'));
        }
        
        return this.addSampleDataIfEmpty(data, '7');
    }

    static generateMonthlyData() {
        const data = { labels: [], salesData: [], profitData: [], itemsData: [] };
        const monthsToShow = 4;
        
        for (let monthOffset = monthsToShow - 1; monthOffset >= 0; monthOffset--) {
            const { monthStart, monthEnd } = this.getMonthBounds(monthOffset);
            const monthSales = this.getFilteredSales(monthStart, monthEnd);
            
            const label = this.getMonthLabel(monthOffset, monthStart);
            
            data.labels.push(label);
            data.salesData.push(sum(monthSales, 'total'));
            data.profitData.push(sum(monthSales, 'profit'));
            data.itemsData.push(sum(monthSales, 'quantity'));
        }
        
        return this.addSampleDataIfEmpty(data, '30');
    }

    static generateQuarterlyData() {
        const data = { labels: [], salesData: [], profitData: [], itemsData: [] };
        const quartersToShow = 4;
        
        for (let quarterOffset = quartersToShow - 1; quarterOffset >= 0; quarterOffset--) {
            const { quarterStart, quarterEnd } = this.getQuarterBounds(quarterOffset);
            const quarterSales = this.getFilteredSales(quarterStart, quarterEnd);
            
            const label = this.getQuarterLabel(quarterOffset, quarterStart);
            
            data.labels.push(label);
            data.salesData.push(sum(quarterSales, 'total'));
            data.profitData.push(sum(quarterSales, 'profit'));
            data.itemsData.push(sum(quarterSales, 'quantity'));
        }
        
        return this.addSampleDataIfEmpty(data, '90');
    }

    static getDayBounds(date) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        return { dayStart, dayEnd };
    }

    static getWeekBounds(weekOffset) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weekOffset * 7 + 6));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        return { weekStart, weekEnd };
    }

    static getMonthBounds(monthOffset) {
        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - (monthOffset * 30));
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        return { monthStart, monthEnd };
    }

    static getQuarterBounds(quarterOffset) {
        const quarterStart = new Date();
        quarterStart.setMonth(quarterStart.getMonth() - (quarterOffset * 3));
        quarterStart.setDate(1);
        quarterStart.setHours(0, 0, 0, 0);
        
        const quarterEnd = new Date(quarterStart);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        quarterEnd.setDate(0);
        quarterEnd.setHours(23, 59, 59, 999);
        
        return { quarterStart, quarterEnd };
    }

    static getFilteredSales(startDate, endDate) {
        return appData.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return sale.status === 'completed' && saleDate >= startDate && saleDate <= endDate;
        });
    }

    static getWeekLabel(weekOffset) {
        if (weekOffset === 0) return 'Minggu Ini';
        if (weekOffset === 1) return 'Minggu Lalu';
        return `${weekOffset} Minggu Lalu`;
    }

    static getMonthLabel(monthOffset, monthStart) {
        if (monthOffset === 0) return 'Bulan Ini';
        if (monthOffset === 1) return 'Bulan Lalu';
        return monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }

    static getQuarterLabel(quarterOffset, quarterStart) {
        if (quarterOffset === 0) return '3 Bulan Ini';
        if (quarterOffset === 1) return '3 Bulan Lalu';
        
        const quarterNum = Math.floor(quarterStart.getMonth() / 3) + 1;
        return `Q${quarterNum} ${quarterStart.getFullYear()}`;
    }

    static addSampleDataIfEmpty(data, period) {
        if (!data.salesData.every(val => val === 0)) return data;
        
        const multipliers = {
            'today': { base: 300000, range: 500000 },
            '7': { base: 2100000, range: 3500000 },
            '30': { base: 9000000, range: 15000000 },
            '90': { base: 27000000, range: 45000000 }
        };
        
        const config = multipliers[period] || multipliers['today'];
        
        for (let i = 0; i < data.salesData.length; i++) {
            if (Math.random() > 0.2) {
                const trendMultiplier = 1 + (i * 0.15);
                const sales = Math.floor((Math.random() * config.range + config.base) * trendMultiplier);
                
                data.salesData[i] = sales;
                data.profitData[i] = Math.floor(sales * 0.3);
                data.itemsData[i] = Math.floor(sales / 100000);
            }
        }
        
        return data;
    }
}

// === CHART OPTIONS BUILDERS ===
class SalesChartOptionsBuilder {
    static build(period = 'today') {
        const colors = getThemeColors();
        const mobile = isMobile();
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: mobile ? 1.0 : 2,
            interaction: { mode: 'index', intersect: false },
            elements: this.buildElements(period, mobile),
            scales: this.buildScales(colors, period, mobile),
            plugins: this.buildPlugins(colors, mobile)
        };
    }

    static buildElements(period, mobile) {
        return {
            point: { radius: period === 'today' ? 4 : 6, hoverRadius: 8 },
            line: { borderWidth: mobile ? 2 : 3 }
        };
    }

    static buildScales(colors, period, mobile) {
        const axisLabels = {
            'today': 'Tanggal',
            '7': 'Periode Mingguan',
            '30': 'Periode Bulanan',
            '90': 'Periode Quarter'
        };
        
        const maxTicks = { 'today': 7, '7': 4, '30': 4, '90': 4 };
        
        return {
            x: {
                display: true,
                title: { display: !mobile, text: axisLabels[period] || 'Tanggal', color: colors.text },
                ticks: {
                    color: colors.text,
                    maxRotation: mobile ? 60 : 45,
                    minRotation: 0,
                    autoSkip: false,
                    maxTicksLimit: maxTicks[period] || 7,
                    font: { size: mobile ? 10 : 12 }
                },
                grid: { color: colors.grid, display: true }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Nilai (Rp)', color: colors.primary },
                ticks: {
                    color: colors.text,
                    callback: (value) => formatCurrency(value, true)
                },
                grid: { color: colors.grid }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Qty Barang', color: colors.warning },
                grid: { drawOnChartArea: false },
                ticks: { beginAtZero: true, color: colors.text }
            }
        };
    }

    static buildPlugins(colors, mobile) {
        return {
            legend: {
                display: true,
                position: 'top',
                labels: { usePointStyle: true, padding: 20, color: colors.text }
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: colors.background,
                titleColor: colors.text,
                bodyColor: colors.text,
                borderColor: colors.primary,
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title: (context) => 'Tanggal: ' + context[0].label,
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        
                        if (context.datasetIndex === 0 || context.datasetIndex === 1) {
                            label += formatCurrency(context.parsed.y, true);
                        } else {
                            label += formatNumber(context.parsed.y) + ' item';
                        }
                        
                        return label;
                    }
                }
            }
        };
    }
}

class OrderChartOptionsBuilder {
    static build() {
        const colors = getThemeColors();
        const mobile = isMobile();
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: mobile ? 1.5 : 2,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        padding: mobile ? 10 : 20,
                        usePointStyle: true,
                        font: { size: mobile ? 11 : 12 }
                    }
                },
                tooltip: {
                    backgroundColor: colors.background,
                    titleColor: colors.text,
                    bodyColor: colors.text,
                    borderColor: colors.primary,
                    borderWidth: 1,
                    padding: mobile ? 8 : 12,
                    titleFont: { size: mobile ? 12 : 14 },
                    bodyFont: { size: mobile ? 11 : 12 },
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        };
    }
}

// === WIDGET MANAGER ===
class WidgetManager {
    static updateBestSellers(period = 'today') {
        const bestSellers = getBestSellersData(period, DASHBOARD_CONFIG.BEST_SELLERS_LIMIT);
        const widget = getElement('#bestSellerWidget');
        
        if (!widget) return;
        
        if (bestSellers.length === 0) {
            widget.innerHTML = this.getEmptyState('trophy', 'Belum ada penjualan');
            setTimeout(initializeIcons, 50);
            return;
        }
        
        widget.innerHTML = bestSellers.map((item, index) => 
            this.createBestSellerItem(item, index)
        ).join('');
    }

    static updateRecentSales() {
        const recentSales = appData.sales
            .filter(sale => sale.status === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, DASHBOARD_CONFIG.RECENT_SALES_LIMIT);
        
        const widget = getElement('#recentSalesWidget');
        
        if (!widget) return;
        
        if (recentSales.length === 0) {
            widget.innerHTML = this.getEmptyState('clock', 'Belum ada penjualan');
            setTimeout(initializeIcons, 50);
            return;
        }
        
        widget.innerHTML = recentSales.map(sale => 
            this.createRecentSaleItem(sale)
        ).join('');
        
        setTimeout(initializeIcons, 50);
    }

    static updateStockAlert() {
        const lowStockProducts = appData.products.filter(
            product => product.stock < DASHBOARD_CONFIG.LOW_STOCK_THRESHOLD
        );
        const alertDiv = getElement('#stockAlert');
        
        if (!alertDiv) return;
        
        if (lowStockProducts.length > 0) {
            alertDiv.innerHTML = this.createStockAlert(lowStockProducts);
            setTimeout(initializeIcons, 50);
        } else {
            alertDiv.innerHTML = '';
        }
    }

    static getEmptyState(icon, text) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="${icon}"></i></div>
                <div class="empty-state-text">${text}</div>
            </div>
        `;
    }

    static createBestSellerItem(item, index) {
        return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <span class="ranking-badge ${getRankingBadgeClass(index + 1)}">${index + 1}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; margin-bottom: 3px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${item.name}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${formatNumber(item.totalSold)} terjual • ${formatCurrency(item.totalSales, false)}
                    </div>
                </div>
            </div>
        `;
    }

    static createRecentSaleItem(sale) {
        const product = getProductById(sale.productId);
        return `
            <div style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <div style="font-weight: 600; margin-bottom: 3px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${product ? product.name : 'Produk Dihapus'}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${sale.customerName} • ${formatNumber(sale.quantity)} item • ${formatCurrency(sale.total, false)}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                    ${formatDate(sale.date)}
                </div>
            </div>
        `;
    }

    static createStockAlert(lowStockProducts) {
        return `
            <div class="alert alert-warning">
                <strong><i data-lucide="alert-triangle"></i> Peringatan Stok Rendah!</strong><br>
                <div style="margin-top: 8px;">
                    ${lowStockProducts.map(p => 
                        `<span style="display: inline-block; margin: 2px 8px 2px 0; font-size: 0.9rem;">
                            ${p.name} <strong>(${p.stock} tersisa)</strong>
                        </span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
}

// === SAMPLE DATA GENERATOR ===
class SampleDataGenerator {
    static generate() {
        if (appData.sales.length > 0) return;
        
        const now = new Date();
        const sampleSales = [];
        
        for (let i = DASHBOARD_CONFIG.SAMPLE_DATA_DAYS; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const numSales = Math.floor(Math.random() * 6);
            
            for (let j = 0; j < numSales; j++) {
                const sale = this.createSampleSale(date, i, j);
                if (sale) sampleSales.push(sale);
            }
        }
        
        appData.sales = sampleSales;
        console.log(`✅ Generated ${sampleSales.length} sample sales for testing`);
    }

    static createSampleSale(date, i, j) {
        const product = appData.products[Math.floor(Math.random() * appData.products.length)];
        if (!product) return null;
        
        const quantity = Math.floor(Math.random() * 3) + 1;
        const total = product.sellPrice * quantity;
        const profit = (product.sellPrice - product.buyPrice) * quantity;
        
        return {
            id: `sample-${Date.now()}-${i}-${j}`,
            productId: product.id,
            quantity: quantity,
            sellPrice: product.sellPrice,
            total: total,
            profit: profit,
            customerName: `Customer ${Math.floor(Math.random() * 100)}`,
            source: ['offline', 'instagram', 'tiktok', 'shopee'][Math.floor(Math.random() * 4)],
            status: Math.random() > 0.9 ? 'cancelled' : 'completed',
            date: date.toISOString()
        };
    }
}

// === PERFORMANCE MONITORING ===
function getDashboardMetrics() {
    const totalProducts = appData.products.length;
    const activeProducts = appData.products.filter(p => p.stock > 0).length;
    const lowStockProducts = appData.products.filter(p => p.stock < DASHBOARD_CONFIG.LOW_STOCK_THRESHOLD).length;
    const totalStock = sum(appData.products, 'stock');
    
    const todaySales = getFilteredSales('today', 'completed');
    const todayRevenue = sum(todaySales, 'total');
    const todayProfit = sum(todaySales, 'profit');
    const todayItems = sum(todaySales, 'quantity');
    
    return {
        products: {
            total: totalProducts,
            active: activeProducts,
            lowStock: lowStockProducts,
            totalStock: totalStock,
            activePercentage: totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0
        },
        sales: {
            todayRevenue: todayRevenue,
            todayProfit: todayProfit,
            todayItems: todayItems,
            todayOrders: todaySales.length
        },
        performance: {
            avgOrderValue: todaySales.length > 0 ? todayRevenue / todaySales.length : 0,
            profitMargin: todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0
        }
    };
}

// === GLOBAL FUNCTIONS (Available Immediately) ===
let dashboardController = null;

// Main functions that need to be available globally
function updateDashboard() {
    try {
        if (!dashboardController) {
            console.warn('Dashboard controller not initialized, initializing now...');
            initializeDashboard();
            return;
        }
        dashboardController.update();
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function initializeDashboard() {
    try {
        if (!dashboardController) {
            dashboardController = new DashboardController();
        }
        dashboardController.init();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

function generateSampleSalesData() {
    try {
        SampleDataGenerator.generate();
    } catch (error) {
        console.error('Error generating sample data:', error);
    }
}

// Additional utility functions
function forceUpdateDashboard() {
    try {
        if (!dashboardController) {
            initializeDashboard();
            return;
        }
        dashboardController.forceUpdate();
        console.log('🔄 Dashboard force updated');
    } catch (error) {
        console.error('Error force updating dashboard:', error);
    }
}

function resetDashboardThrottling() {
    try {
        ChartManager.resetThrottling();
        console.log('⚡ Dashboard throttling reset');
    } catch (error) {
        console.error('Error resetting throttling:', error);
    }
}

// Make functions available on window object immediately
window.updateDashboard = updateDashboard;
window.initializeDashboard = initializeDashboard;
window.generateSampleSalesData = generateSampleSalesData;
window.forceUpdateDashboard = forceUpdateDashboard;
window.resetDashboardThrottling = resetDashboardThrottling;