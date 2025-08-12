// js/config.js

// === SUPABASE CONFIGURATION ===
// ✅ CREDENTIALS SUDAH DIISI DENGAN API KEY ANDA - SIAP PAKAI!
const SUPABASE_CONFIG = {
    url: 'https://skwjswjppppwnjzexucb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrd2pzd2pwcHBwd25qemV4dWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTM5ODcsImV4cCI6MjA2OTE4OTk4N30.J8xypjXui7sg9I9HdSNschMxNHg2pnL8kfXpf1hFD6Y'
};

// === AUTHENTICATION CONFIGURATION ===
// To change login credentials, modify these values:
const AUTH_CONFIG = {
    email: 'oreda@gmail.com',      // Change this to your desired email
    password: 'oreda10',           // Change this to your desired password
    rememberDuration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};

// === APPLICATION CONFIGURATION ===
const APP_CONFIG = {
    name: 'OREDA Fashion Management System',
    version: '2.0.0',
    
    // Data retention settings
    dataRetention: {
        sales: 3 * 30 * 24 * 60 * 60 * 1000,        // 3 months for sales data
        stockHistory: 3 * 30 * 24 * 60 * 60 * 1000, // 3 months for stock history
        notifications: 30 * 24 * 60 * 60 * 1000,    // 30 days for notifications
    },
    
    // File upload settings
    upload: {
        maxFileSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        maxFiles: 5,
        compressionQuality: 0.8,
        maxImageWidth: 800,
    },
    
    // UI settings
    ui: {
        itemsPerPage: 50,
        chartRefreshInterval: 5 * 60 * 1000, // 5 minutes
        autoSaveInterval: 30 * 1000,         // 30 seconds
        debounceTime: 300,                   // 300ms for search
    },
    
    // Default categories
    defaultCategories: ['ATASAN', 'BAWAHAN', 'AKSESORIS'],
    
    // Source options for sales
    salesSources: [
        { value: 'offline', label: 'Toko Offline' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'tiktok', label: 'TikTok Shop' },
        { value: 'shopee', label: 'Shopee' },
        { value: 'website', label: 'Website' },
        { value: 'whatsapp', label: 'WhatsApp' },
    ],
    
    // Period options
    periods: [
        { value: 'today', label: 'Hari Ini' },
        { value: 'week', label: 'Minggu Ini' },
        { value: 'month', label: 'Bulan Ini' },
        { value: '3month', label: '3 Bulan Terakhir' },
    ],
    
    // Dashboard period options
    dashboardPeriods: [
        { value: 'today', label: 'Hari Ini' },
        { value: '7', label: '7 Hari Terakhir' },
        { value: '30', label: '30 Hari Terakhir' },
        { value: '90', label: '3 Bulan Terakhir' },
    ],
};

// === GLOBAL STATE ===
window.appData = {
    products: [],
    sales: [],
    stockHistory: [],
    coupons: [],
    categories: [...APP_CONFIG.defaultCategories],
    currentUser: null,
    listeners: [],
    selectedProducts: new Set(),
    
    // Charts instances
    charts: {
        sales: null,
        order: null,
        profitLoss: null,
        topProducts: null,
    },
    
    // UI state
    ui: {
        currentPage: 'dashboard',
        sidebarOpen: false,
        theme: 'dark',
        loading: false,
    }
};

// === UTILITY CONSTANTS ===
const ICONS = {
    // Common icons
    loading: 'loader-2',
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info',
    
    // Navigation icons
    dashboard: 'bar-chart-3',
    products: 'package',
    sales: 'shopping-cart',
    bestSeller: 'trophy',
    cancelled: 'x-circle',
    coupons: 'ticket',
    reports: 'trending-up',
    
    // Action icons
    add: 'plus',
    edit: 'edit',
    delete: 'trash-2',
    view: 'eye',
    print: 'printer',
    download: 'download',
    upload: 'upload',
    save: 'save',
    cancel: 'x',
    
    // UI icons
    menu: 'menu',
    close: 'x',
    search: 'search',
    filter: 'filter',
    sort: 'arrow-up-down',
    logout: 'log-out',
    user: 'user',
    settings: 'settings',
    
    // Theme icons
    sun: 'sun',
    moon: 'moon',
    
    // Status icons
    completed: 'check',
    pending: 'clock',
    cancelled: 'x',
    
    // Stock icons
    stockHigh: 'trending-up',
    stockMedium: 'minus',
    stockLow: 'trending-down',
};

// === THEME CONFIGURATION ===
const THEME_CONFIG = {
    default: 'dark',
    storageKey: 'oredaTheme',
    
    themes: {
        dark: {
            name: 'Dark',
            icon: ICONS.moon,
        },
        light: {
            name: 'Light', 
            icon: ICONS.sun,
        }
    }
};

// === EXPORT FOR MODULE USAGE ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        AUTH_CONFIG,
        APP_CONFIG,
        ICONS,
        THEME_CONFIG
    };
}