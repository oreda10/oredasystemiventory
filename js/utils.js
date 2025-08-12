// js/utils.js - COMPLETE UTILITY FUNCTIONS WITH FIXED CALCULATIONS

// === DOM HELPERS ===
function getElement(selector) {
    return document.querySelector(selector);
}

function getAllElements(selector) {
    return document.querySelectorAll(selector);
}

// === VALIDATION FUNCTIONS ===
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateNumber(value, min = 0) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min;
}

function validateStock(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0;
}

function validatePrice(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}

function validateFileSize(file, maxSizeMB) {
    const maxSize = maxSizeMB * 1024 * 1024;
    return file.size <= maxSize;
}

function validateFileType(file) {
    const allowedTypes = APP_CONFIG.upload.allowedTypes;
    return allowedTypes.includes(file.type);
}

// === FORMATTING FUNCTIONS ===
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatPercentage(value, decimals = 0) {
    return (value).toFixed(decimals) + '%';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// === CALCULATION FUNCTIONS ===
function sum(array, property) {
    return array.reduce((total, item) => total + (item[property] || 0), 0);
}

function average(array, property) {
    if (array.length === 0) return 0;
    return sum(array, property) / array.length;
}

function calculateMargin(sellPrice, buyPrice) {
    if (buyPrice === 0) return 0;
    return ((sellPrice - buyPrice) / sellPrice) * 100;
}

// FIXED: Enhanced percentage change calculation
function calculatePercentageChange(current, previous) {
    // Convert to numbers and handle null/undefined
    current = parseFloat(current) || 0;
    previous = parseFloat(previous) || 0;
    
    // Handle edge cases
    if (previous === 0) {
        if (current === 0) {
            return 0; // No change from 0 to 0
        } else {
            return 100; // From nothing to something = 100% increase
        }
    }
    
    if (current === 0) {
        return -100; // Complete decline to zero = -100%
    }
    
    // Standard percentage change calculation
    const change = ((current - previous) / Math.abs(previous)) * 100;
    
    // Ensure the result is finite
    return isFinite(change) ? change : 0;
}

// === DATE FUNCTIONS ===
function getDateRange(period) {
    const now = new Date();
    const startDate = new Date();
    
    switch(period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '7':
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '30':
            startDate.setDate(now.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '90':
            startDate.setDate(now.getDate() - 89);
            startDate.setHours(0, 0, 0, 0);
            break;
        default:
            startDate.setHours(0, 0, 0, 0);
    }
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
}

// === STORAGE FUNCTIONS ===
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('Storage save failed:', error);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Storage load failed:', error);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Storage remove failed:', error);
    }
}

// === IMAGE FUNCTIONS ===
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

function createPlaceholderImage(text, width = 400, height = 400) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Background
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);
    
    // Text
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate font size based on canvas size
    let fontSize = Math.max(12, Math.min(width, height) / 15);
    ctx.font = `bold ${fontSize}px Arial`;
    
    const maxWidth = width - 20;
    
    // Auto-adjust font size if text is too wide
    while (ctx.measureText(text).width > maxWidth && fontSize > 8) {
        fontSize--;
        ctx.font = `bold ${fontSize}px Arial`;
    }
    
    ctx.fillText(text, width / 2, height / 2);
    
    return canvas.toDataURL();
}

// === UTILITY FUNCTIONS ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, wait) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// === BADGE HELPER FUNCTIONS ===
function getStockStatus(stock) {
    if (stock >= 10) return 'stock-high';
    if (stock >= 5) return 'stock-medium';
    return 'stock-low';
}

function getStockText(stock) {
    if (stock >= 10) return 'Tinggi';
    if (stock >= 5) return 'Sedang';
    return 'Rendah';
}

function getCategoryBadgeClass(category) {
    const classes = {
        'ATASAN': 'category-atasan',
        'BAWAHAN': 'category-bawahan',
        'AKSESORIS': 'category-aksesoris'
    };
    return classes[category] || 'category-atasan';
}

function getSourceBadgeClass(source) {
    const classes = {
        'offline': 'source-offline',
        'instagram': 'source-instagram',
        'tiktok': 'source-tiktok',
        'shopee': 'source-shopee',
        'website': 'source-website',
        'whatsapp': 'source-whatsapp'
    };
    return classes[source] || 'source-offline';
}

function getSourceText(source) {
    const texts = {
        'offline': 'Toko Offline',
        'instagram': 'Instagram',
        'tiktok': 'TikTok Shop',
        'shopee': 'Shopee',
        'website': 'Website',
        'whatsapp': 'WhatsApp'
    };
    return texts[source] || 'Unknown';
}

function getRankingBadgeClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
}

// === PRODUCT HELPER WITH ROBUST ID MATCHING ===
function findProductById(productId) {
    if (!productId) return null;
    const productIdStr = String(productId);
    return appData.products.find(p => String(p.id) === productIdStr);
}

// === NUMBER PARSING UTILITIES ===
function parseFormattedNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    const cleanNumber = formattedNumber.toString().replace(/\./g, '');
    return parseInt(cleanNumber) || 0;
}

function formatNumberForDisplay(number) {
    if (number === null || number === undefined || isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCurrencyInput(value) {
    if (!value) return 0;
    const cleanValue = value.toString().replace(/[^\d]/g, '');
    return parseInt(cleanValue) || 0;
}

// === CURRENCY INPUT HELPERS ===
function autoFormatCurrency(inputElement) {
    if (!inputElement) return;
    
    const rawValue = inputElement.value.replace(/[^\d]/g, '');
    
    if (rawValue) {
        inputElement.value = formatNumber(parseInt(rawValue));
    } else {
        inputElement.value = '';
    }
}

function setupAutoFormatCurrency(selector) {
    const input = getElement(selector);
    if (!input) return;
    
    input.addEventListener('input', () => autoFormatCurrency(input));
    input.addEventListener('blur', () => autoFormatCurrency(input));
    
    input.addEventListener('focus', function() {
        const rawValue = this.value.replace(/\./g, '');
        if (rawValue && !isNaN(rawValue)) {
            this.value = rawValue;
        }
    });
}

// === ENHANCED ERROR HANDLING ===
function handleError(error, context = '') {
    console.error(`Error ${context}:`, error);
    
    let message = 'Terjadi kesalahan sistem';
    
    if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = 'Koneksi bermasalah. Periksa internet Anda.';
        } else if (error.message.includes('permission') || error.message.includes('auth')) {
            message = 'Akses ditolak. Silakan login ulang.';
        } else {
            message = error.message;
        }
    }
    
    // No notification - just log
    console.warn('Error handled:', message);
}

// === FORM VALIDATION HELPERS ===
function validateForm(formSelector, rules) {
    const form = getElement(formSelector);
    if (!form) return false;
    
    let isValid = true;
    const errors = [];
    
    Object.entries(rules).forEach(([fieldName, rule]) => {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;
        
        const value = field.value.trim();
        
        if (rule.required && !value) {
            errors.push(`${rule.label || fieldName} harus diisi`);
            isValid = false;
            field.classList.add('error');
        } else if (value && rule.validate && !rule.validate(value)) {
            errors.push(rule.message || `${rule.label || fieldName} tidak valid`);
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        console.warn('Form validation failed:', errors[0]);
    }
    
    return isValid;
}

// === DATA EXPORT HELPERS ===
function exportTableToCSV(tableSelector, filename = 'data.csv') {
    const table = getElement(tableSelector);
    if (!table) return;
    
    const rows = [];
    const tableRows = table.querySelectorAll('tr');
    
    tableRows.forEach(row => {
        const cols = [];
        const cells = row.querySelectorAll('th, td');
        
        cells.forEach(cell => {
            let cellText = cell.textContent.trim().replace(/"/g, '""');
            cols.push(`"${cellText}"`);
        });
        
        if (cols.length > 0) {
            rows.push(cols.join(','));
        }
    });
    
    if (rows.length === 0) return;
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// === PERFORMANCE HELPERS ===
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
}

async function measureAsyncPerformance(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
}

// Make functions globally available
window.getElement = getElement;
window.getAllElements = getAllElements;
window.findProductById = findProductById;
window.parseFormattedNumber = parseFormattedNumber;
window.formatNumberForDisplay = formatNumberForDisplay;
window.parseCurrencyInput = parseCurrencyInput;
window.autoFormatCurrency = autoFormatCurrency;
window.setupAutoFormatCurrency = setupAutoFormatCurrency;
window.handleError = handleError;
window.validateForm = validateForm;
window.exportTableToCSV = exportTableToCSV;
window.measurePerformance = measurePerformance;
window.measureAsyncPerformance = measureAsyncPerformance;

console.log('✅ Utils.js loaded with FIXED percentage calculations');