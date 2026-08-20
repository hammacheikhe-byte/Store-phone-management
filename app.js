/* ==========================================================================
   PHONE STORE MANAGEMENT PRO - FULL-STACK COMMERCIAL ERP / POS ENGINE
   ========================================================================== */

const APP_VERSION = "3.0.0-PRO";
const STORAGE_KEY = "phone_store_pro_state_v3";
const AUTH_KEY = "phone_store_pro_user_session";

// Currency Formatter Helper
const CurrencyFormatter = {
  format(amount, currencySymbol = "MRU") {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat("ar", { maximumFractionDigits: 0 }).format(val) + " " + currencySymbol;
  }
};

// GitHub Token Cleaning & UTF-8 Base64 Helpers
function cleanGitHubToken(tokenStr) {
  if (!tokenStr) return "";
  return String(tokenStr)
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^token\s+/i, '');
}

function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

// Global Application State
let AppState = {
  isInitialized: false,
  settings: {
    storeName: "متجر الهواتف الذهبي - PHONE STORE PRO",
    storeLogo: "",
    storeAddress: "شارع الأمل، المجمع التجاري - نواكشوط",
    storePhone: "+222 45 25 00 00",
    storeEmail: "contact@phonestorepro.com",
    currency: "MRU",
    taxRate: 0,
    invoicePrefix: "INV-",
    invoiceFooter: "شكراً لتسوقكم معنا! الهواتف المباعة مشمولة بالضمان الرسمي.",
    defaultPaymentMethod: "cash",
    lowStockThreshold: 3,
    language: "ar",
    theme: "dark",
    primaryColor: "#3b82f6",
    adminPassword: "1234",
    githubToken: "",
    githubRepo: "Store-phone-management",
    githubUser: "hammacheikhe-byte"
  },
  currentUser: null,
  phones: [],
  accessories: [],
  suppliers: [],
  customers: [],
  sales: [],
  purchases: [],
  returns: [],
  expenses: [],
  partners: [],
  auditLogs: []
};

/* ==========================================================================
   1. DATA REPOSITORY & PERSISTENCE ENGINE
   ========================================================================== */
const DataRepository = {
  init() {
    this.loadState();
    if (!AppState.isInitialized && !AppState.phones.length && !AppState.accessories.length) {
      SeedDataEngine.generateSeedData();
      AppState.isInitialized = true;
      this.saveState();
    }
  },

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        AppState = { ...AppState, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load local state:", e);
    }
  },

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
    } catch (e) {
      console.error("Failed to save local state:", e);
    }
  },

  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PHONE_STORE_PRO_BACKUP_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    AuditLogEngine.log("تصدير نسخة احتياطية", "قام المستخدم بتصدير نسخة احتياطية كاملة للنظام.");
  },

  purgeAllData() {
    AppState.isInitialized = true;
    AppState.phones = [];
    AppState.accessories = [];
    AppState.suppliers = [];
    AppState.customers = [];
    AppState.sales = [];
    AppState.purchases = [];
    AppState.returns = [];
    AppState.expenses = [];
    AppState.partners = [];
    AppState.auditLogs = [];
    this.saveState();
    AuditLogEngine.log("تصفير الشامل", "تم تصفير كافة البيانات والجداول بنجاح وجعل قاعدة البيانات فارغة تماماً.");
  },

  restoreDemoData() {
    AppState.isInitialized = true;
    SeedDataEngine.generateSeedData();
    this.saveState();
    AuditLogEngine.log("استعادة البيانات التجريبية", "تمت استعادة البيانات التجريبية الأولية للنظام.");
  }
};

/* ==========================================================================
   2. SEED DATA ENGINE
   ========================================================================== */
const SeedDataEngine = {
  generateSeedData() {
    AppState.suppliers = [
      { id: "sup_1", name: "شركة الأمل للاستيراد (دبي)", phone: "+971 4 332211", email: "info@alamal-trade.ae", company: "Al-Amal Telecom", totalPurchases: 450000, totalPaid: 400000, totalDebt: 50000 },
      { id: "sup_2", name: "مؤسسة الخليج للتكنولوجيا", phone: "+222 46 00 11 22", email: "sales@gulf-tech.mr", company: "Gulf Tech MR", totalPurchases: 280000, totalPaid: 280000, totalDebt: 0 },
      { id: "sup_3", name: "شركة الإكسسوارات العصرية", phone: "+222 36 99 88 77", email: "accessories@modern.mr", company: "Modern Acc Co", totalPurchases: 95000, totalPaid: 75000, totalDebt: 20000 }
    ];

    AppState.customers = [
      { id: "cust_1", name: "محمد ولد أحمد", phone: "36 12 34 56", email: "med.ahmed@mail.com", address: "تفرغ زينه - نواكشوط", totalPurchases: 145000, totalPaid: 120000, totalDebt: 25000, status: "Active" },
      { id: "cust_2", name: "سيدي محمود", phone: "46 98 76 54", email: "sidi.m@mail.com", address: "عرفات - نواكشوط", totalPurchases: 85000, totalPaid: 85000, totalDebt: 0, status: "Active" },
      { id: "cust_3", name: "مريم بنت فال", phone: "22 11 44 33", email: "mariem.fal@mail.com", address: "لكصر - نواكشوط", totalPurchases: 210000, totalPaid: 210000, totalDebt: 0, status: "Active" }
    ];

    AppState.phones = [
      {
        id: "ph_1",
        name: "iPhone 15 Pro Max 256GB Titanium",
        brand: "Apple",
        model: "15 Pro Max",
        barcode: "194253001122",
        imei1: "359871092837461",
        imei2: "359871092837462",
        serialNumber: "DX9G82736152",
        color: "Natural Titanium",
        ram: "8GB",
        storage: "256GB",
        condition: "New",
        batteryHealth: 100,
        purchasePrice: 115000,
        sellingPrice: 135000,
        minSellingPrice: 130000,
        stock: 4,
        status: "Available",
        notes: "نسخة جديدة مغلقة"
      },
      {
        id: "ph_2",
        name: "Samsung Galaxy S24 Ultra 512GB",
        brand: "Samsung",
        model: "S24 Ultra",
        barcode: "880609501234",
        imei1: "354128098765432",
        imei2: "354128098765433",
        serialNumber: "RF8N20ABCDEF",
        color: "Titanium Gray",
        ram: "12GB",
        storage: "512GB",
        condition: "New",
        batteryHealth: 100,
        purchasePrice: 110000,
        sellingPrice: 128000,
        minSellingPrice: 124000,
        stock: 3,
        status: "Available",
        notes: "مع القلم الأصلي"
      },
      {
        id: "ph_3",
        name: "iPhone 14 Pro 128GB (مستعمل ممتاز)",
        brand: "Apple",
        model: "14 Pro",
        barcode: "194252998877",
        imei1: "351234567890123",
        imei2: "351234567890124",
        serialNumber: "F17H82716152",
        color: "Deep Purple",
        ram: "6GB",
        storage: "128GB",
        condition: "Used",
        batteryHealth: 89,
        purchasePrice: 75000,
        sellingPrice: 90000,
        minSellingPrice: 86000,
        stock: 2,
        status: "Available",
        notes: "حالة كالجديدة"
      }
    ];

    AppState.accessories = [
      { id: "acc_1", sku: "ANK-CH-20W", barcode: "848061001122", name: "شاحن أنكر أنكرباور 20W Type-C", category: "شواحن وكابلات", brand: "Anker", purchasePrice: 2200, sellingPrice: 3500, stock: 15, minStock: 5 },
      { id: "acc_2", sku: "APL-MAG-CASE", barcode: "194253112233", name: "حافظة آيفون MagSafe شفافة", category: "حافظات وواقيات", brand: "Apple", purchasePrice: 1500, sellingPrice: 2800, stock: 20, minStock: 5 }
    ];

    AppState.partners = [
      { id: "part_1", name: "الشيخ ولد سيدي", sharePercent: 40, capital: 500000, accruedProfit: 45000, paidProfit: 20000, balance: 25000 },
      { id: "part_2", name: "أحمد محمود", sharePercent: 35, capital: 400000, accruedProfit: 39375, paidProfit: 15000, balance: 24375 },
      { id: "part_3", name: "فاطمة بنت البشير", sharePercent: 25, capital: 300000, accruedProfit: 28125, paidProfit: 10000, balance: 18125 }
    ];

    AppState.expenses = [
      { id: "exp_1", date: "2026-08-02", category: "إيجار", description: "إيجار المتجر لشهر أغسطس", amount: 25000, employee: "admin" },
      { id: "exp_2", date: "2026-08-05", category: "كهرباء", description: "فاتورة الكهرباء والإنترنت", amount: 4500, employee: "admin" }
    ];

    AppState.sales = [
      {
        id: "sale_1001",
        invoiceNo: "INV-1001",
        date: new Date().toISOString(),
        customerId: "cust_1",
        customerName: "محمد ولد أحمد",
        customerPhone: "36 12 34 56",
        employeeName: "المدير العام",
        items: [
          { productId: "ph_1", name: "iPhone 15 Pro Max 256GB Titanium", imei: "359871092837461", qty: 1, unitPrice: 135000, discount: 5000, total: 130000 }
        ],
        subtotal: 135000,
        discount: 5000,
        tax: 0,
        total: 130000,
        paid: 110000,
        remaining: 20000,
        paymentMethod: "mixed",
        status: "Completed"
      }
    ];

    AppState.purchases = [
      {
        id: "pur_1001",
        invoiceNo: "PUR-1001",
        date: new Date().toISOString(),
        supplierId: "sup_1",
        supplierName: "شركة الأمل للاستيراد (دبي)",
        total: 450000,
        paid: 400000,
        remaining: 50000
      }
    ];

    AppState.auditLogs = [
      { id: "log_1", date: new Date().toISOString(), user: "admin", action: "تهيئة النظام", details: "تم تشغيل نظام PHONE STORE MANAGEMENT PRO الجاهز للتجارة." }
    ];
  }
};

/* ==========================================================================
   3. IMEI UNIQUE VALIDATION ENGINE
   ========================================================================== */
const IMEIManager = {
  isUnique(imei, excludePhoneId = null) {
    if (!imei) return true;
    const target = String(imei).trim();
    if (!target) return true;

    for (const phone of AppState.phones) {
      if (excludePhoneId && phone.id === excludePhoneId) continue;
      if (phone.imei1 && String(phone.imei1).trim() === target) return false;
      if (phone.imei2 && String(phone.imei2).trim() === target) return false;
    }
    return true;
  }
};

/* ==========================================================================
   4. FINANCIAL ENGINE & PROFIT SHARING
   ========================================================================== */
const ProfitEngine = {
  calculateFinancialSummary() {
    let totalSalesRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;

    AppState.sales.forEach(sale => {
      if (sale.status !== "Cancelled") {
        totalSalesRevenue += Number(sale.total) || 0;
        (sale.items || []).forEach(item => {
          const phone = AppState.phones.find(p => p.id === item.productId);
          const acc = AppState.accessories.find(a => a.id === item.productId);
          const cost = phone ? phone.purchasePrice : (acc ? acc.purchasePrice : 0);
          totalCOGS += (cost * (item.qty || 1));
        });
      }
    });

    AppState.expenses.forEach(exp => {
      totalExpenses += Number(exp.amount) || 0;
    });

    const grossProfit = totalSalesRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    const totalSharePercent = AppState.partners.reduce((sum, p) => sum + (p.sharePercent || 0), 0) || 100;
    AppState.partners.forEach(partner => {
      const partnerShare = (netProfit * (partner.sharePercent / totalSharePercent));
      partner.accruedProfit = Math.max(0, partnerShare);
      partner.balance = partner.accruedProfit - (partner.paidProfit || 0);
    });

    return { totalSalesRevenue, totalCOGS, grossProfit, totalExpenses, netProfit };
  }
};

/* ==========================================================================
   5. AUDIT LOG ENGINE
   ========================================================================== */
const AuditLogEngine = {
  log(action, details) {
    AppState.auditLogs.unshift({
      id: "log_" + Date.now(),
      date: new Date().toISOString(),
      user: AppState.currentUser ? AppState.currentUser.name : "النظام",
      action,
      details
    });
    if (AppState.auditLogs.length > 500) AppState.auditLogs.pop();
    DataRepository.saveState();
  }
};

/* ==========================================================================
   6. POS CART ENGINE
   ========================================================================== */
const POSCartEngine = {
  cart: [],
  discount: 0,

  addItem(product, selectedIMEI = null) {
    const existing = this.cart.find(i => i.id === product.id && i.selectedIMEI === selectedIMEI);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.sellingPrice,
        qty: 1,
        selectedIMEI: selectedIMEI || product.imei1 || "",
        discount: 0,
        isPhone: !!product.imei1
      });
    }
    this.recalculate();
  },

  removeItem(index) {
    this.cart.splice(index, 1);
    this.recalculate();
  },

  fillFullPayment() {
    const totalVal = parseFloat(document.getElementById("cartTotal")?.textContent.replace(/[^0-9.]/g, '') || 0);
    const paidInput = document.getElementById("posPaidInput");
    if (paidInput) paidInput.value = totalVal;
    this.recalculate();
  },

  fillCreditPayment() {
    const paidInput = document.getElementById("posPaidInput");
    if (paidInput) paidInput.value = 0;
    this.recalculate();
  },

  clearCart() {
    this.cart = [];
    this.discount = 0;
    const discInput = document.getElementById("posDiscountInput");
    if (discInput) discInput.value = 0;
    const paidInput = document.getElementById("posPaidInput");
    if (paidInput) paidInput.value = "";
    this.recalculate();
  },

  recalculate() {
    let subtotal = 0;
    this.cart.forEach(item => {
      subtotal += (item.price - item.discount) * item.qty;
    });

    const tax = subtotal * ((AppState.settings.taxRate || 0) / 100);
    const total = Math.max(0, subtotal - this.discount + tax);

    RenderEngine.renderPOSCart({ subtotal, discount: this.discount, tax, total, items: this.cart });
  },

  checkoutSale(saleDetails) {
    if (!this.cart.length) throw new Error("السلة فارغة، يرجى إضافة منتجات قبل البيع.");

    const invoiceNo = AppState.settings.invoicePrefix + (1001 + AppState.sales.length);
    const total = saleDetails.total;
    const paid = Number(saleDetails.paid) || total;
    const remaining = Math.max(0, total - paid);

    const newSale = {
      id: "sale_" + Date.now(),
      invoiceNo,
      date: new Date().toISOString(),
      customerId: saleDetails.customerId || "cust_cash",
      customerName: saleDetails.customerName || "عميل نقدي",
      customerPhone: saleDetails.customerPhone || "-",
      employeeName: AppState.currentUser ? AppState.currentUser.name : "الكاشير",
      items: this.cart.map(item => ({
        productId: item.id,
        name: item.name,
        imei: item.selectedIMEI,
        qty: item.qty,
        unitPrice: item.price,
        discount: item.discount,
        total: (item.price - item.discount) * item.qty
      })),
      subtotal: saleDetails.subtotal,
      discount: saleDetails.discount,
      tax: saleDetails.tax,
      total,
      paid,
      remaining,
      paymentMethod: saleDetails.paymentMethod,
      status: "Completed"
    };

    // Update Stock
    this.cart.forEach(item => {
      const phone = AppState.phones.find(p => p.id === item.id);
      if (phone) {
        phone.stock = Math.max(0, phone.stock - item.qty);
        if (phone.stock === 0) phone.status = "Sold";
      } else {
        const acc = AppState.accessories.find(a => a.id === item.id);
        if (acc) acc.stock = Math.max(0, acc.stock - item.qty);
      }
    });

    // Update Customer Debt
    if (remaining > 0 && saleDetails.customerId) {
      const customer = AppState.customers.find(c => c.id === saleDetails.customerId);
      if (customer) {
        customer.totalPurchases += total;
        customer.totalPaid += paid;
        customer.totalDebt += remaining;
      }
    }

    AppState.sales.unshift(newSale);
    AuditLogEngine.log("إتمام عملية بيع", `الفاتورة ${invoiceNo} بقيمة ${CurrencyFormatter.format(total, AppState.settings.currency)}.`);
    DataRepository.saveState();

    // Background Cloud Sync if GitHub Token exists
    if (AppState.settings.githubToken) {
      UIController.syncWithGitHubCloud(true);
    }

    this.clearCart();
    return newSale;
  }
};

/* ==========================================================================
   7. UI RENDER ENGINE
   ========================================================================== */
const RenderEngine = {
  init() {
    this.applyThemeAndColors();
    this.renderDashboard();
    this.renderPOSProducts();
    this.renderPOSCustomersDropdown();
    this.renderInventoryTable();
    this.renderPhonesTable();
    this.renderAccessoriesTable();
    this.renderCustomersTable();
    this.renderSuppliersTable();
    this.renderSalesTable();
    this.renderExpensesTable();
    this.renderPartnersTable();
    this.renderAuditLogs();
    this.renderSettings();
  },

  applyThemeAndColors() {
    document.documentElement.setAttribute("data-theme", AppState.settings.theme || "dark");
    if (AppState.settings.primaryColor) {
      document.documentElement.style.setProperty("--primary", AppState.settings.primaryColor);
    }
  },

  renderDashboard() {
    const summary = ProfitEngine.calculateFinancialSummary();
    const todayStr = new Date().toISOString().slice(0, 10);
    
    let todaySales = 0;
    AppState.sales.forEach(s => {
      if (s.date && s.date.slice(0, 10) === todayStr && s.status !== "Cancelled") {
        todaySales += Number(s.total) || 0;
      }
    });

    let inventoryVal = 0;
    let phoneCount = 0;
    let lowStockCount = 0;

    AppState.phones.forEach(p => {
      inventoryVal += (p.purchasePrice * p.stock);
      phoneCount += p.stock;
      if (p.stock <= (AppState.settings.lowStockThreshold || 3)) lowStockCount++;
    });
    AppState.accessories.forEach(a => {
      inventoryVal += (a.purchasePrice * a.stock);
      if (a.stock <= a.minStock) lowStockCount++;
    });

    const totalCustomerDebts = AppState.customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
    const totalSupplierPayables = AppState.suppliers.reduce((sum, s) => sum + (s.totalDebt || 0), 0);

    if (document.getElementById("kpiTodaySales")) document.getElementById("kpiTodaySales").textContent = CurrencyFormatter.format(todaySales, AppState.settings.currency);
    if (document.getElementById("kpiMonthSales")) document.getElementById("kpiMonthSales").textContent = CurrencyFormatter.format(summary.totalSalesRevenue, AppState.settings.currency);
    if (document.getElementById("kpiNetProfit")) document.getElementById("kpiNetProfit").textContent = CurrencyFormatter.format(summary.netProfit, AppState.settings.currency);
    if (document.getElementById("kpiInventoryValue")) document.getElementById("kpiInventoryValue").textContent = CurrencyFormatter.format(inventoryVal, AppState.settings.currency);
    if (document.getElementById("kpiPhoneCount")) document.getElementById("kpiPhoneCount").textContent = phoneCount + " هاتف متوفر";
    if (document.getElementById("kpiCustomerDebts")) document.getElementById("kpiCustomerDebts").textContent = CurrencyFormatter.format(totalCustomerDebts, AppState.settings.currency);
    if (document.getElementById("kpiSupplierPayables")) document.getElementById("kpiSupplierPayables").textContent = CurrencyFormatter.format(totalSupplierPayables, AppState.settings.currency);

    const recentSalesBody = document.getElementById("dashboardRecentSales");
    if (recentSalesBody) {
      recentSalesBody.innerHTML = AppState.sales.slice(0, 5).map(s => `
        <tr>
          <td><strong style="color:var(--primary);">${s.invoiceNo}</strong></td>
          <td>${s.customerName}</td>
          <td><span class="badge badge-info">${s.items.length} منتجات</span></td>
          <td><strong>${CurrencyFormatter.format(s.total, AppState.settings.currency)}</strong></td>
          <td><span class="badge badge-success">${s.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-icon" onclick="UIController.viewInvoice('${s.id}')"><i class="fa-solid fa-eye"></i></button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">لا توجد مبيعات مسجلة</td></tr>`;
    }
  },

  renderPOSProducts() {
    const grid = document.getElementById("posProductsGrid");
    if (!grid) return;

    const searchTerm = (document.getElementById("posSearchInput")?.value || "").toLowerCase().trim();
    const selectedBrand = document.getElementById("posBrandFilter")?.value || "";

    const availablePhones = AppState.phones.filter(p => {
      const matchName = p.name.toLowerCase().includes(searchTerm) || (p.imei1 && p.imei1.includes(searchTerm)) || (p.barcode && p.barcode.includes(searchTerm));
      const matchBrand = !selectedBrand || p.brand === selectedBrand;
      return matchName && matchBrand && p.stock > 0;
    });

    const availableAccessories = AppState.accessories.filter(a => {
      const matchName = a.name.toLowerCase().includes(searchTerm) || (a.sku && a.sku.toLowerCase().includes(searchTerm));
      const matchBrand = !selectedBrand || a.brand === selectedBrand;
      return matchName && matchBrand && a.stock > 0;
    });

    let html = "";
    availablePhones.forEach(p => {
      html += `
        <div class="product-card" onclick="POSCartEngine.addItem(AppState.phones.find(x => x.id === '${p.id}'))">
          <div class="product-img"><i class="fa-solid fa-mobile-screen-button"></i></div>
          <div class="product-name">${p.name}</div>
          <div class="product-imei-badge">IMEI: ${p.imei1 || 'غير معرف'}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <span class="product-price">${CurrencyFormatter.format(p.sellingPrice, AppState.settings.currency)}</span>
            <span class="product-stock">المتبقي: ${p.stock}</span>
          </div>
        </div>
      `;
    });

    availableAccessories.forEach(a => {
      html += `
        <div class="product-card" onclick="POSCartEngine.addItem(AppState.accessories.find(x => x.id === '${a.id}'))">
          <div class="product-img"><i class="fa-solid fa-plug"></i></div>
          <div class="product-name">${a.name}</div>
          <div class="product-imei-badge" style="color:var(--accent-purple); background:rgba(139,92,246,0.15);">SKU: ${a.sku}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <span class="product-price">${CurrencyFormatter.format(a.sellingPrice, AppState.settings.currency)}</span>
            <span class="product-stock">المتبقي: ${a.stock}</span>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html || `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">لا توجد منتجات مطابقة للبحث</div>`;
  },

  renderPOSCustomersDropdown() {
    const select = document.getElementById("posCustomerSelect");
    if (!select) return;

    const currentVal = select.value;
    let html = `<option value="">عميل نقدي مباشر (Cash Customer)</option>`;
    (AppState.customers || []).forEach(c => {
      const debtLabel = c.totalDebt > 0 ? ` (مدين: ${CurrencyFormatter.format(c.totalDebt, AppState.settings.currency)})` : '';
      html += `<option value="${c.id}">${c.name} - ${c.phone}${debtLabel}</option>`;
    });
    select.innerHTML = html;
    if (currentVal) select.value = currentVal;
  },

  renderPOSCart(cartData) {
    const list = document.getElementById("posCartItemsList");
    if (!list) return;

    const countBadge = document.getElementById("cartCountBadge");
    const totalItemsCount = cartData.items.reduce((sum, i) => sum + i.qty, 0);
    if (countBadge) countBadge.textContent = `${totalItemsCount} منتج`;

    if (cartData.items.length === 0) {
      list.innerHTML = `
        <div class="empty-cart-state" style="text-align:center; padding:35px 12px; color:var(--text-muted);">
          <i class="fa-solid fa-cart-flatbed-suitcases" style="font-size:42px; margin-bottom:12px; opacity:0.35;"></i>
          <p style="font-weight:700; font-size:13.5px; margin-bottom:4px;">السلة فارغة حالياً</p>
          <p style="font-size:11.5px; opacity:0.8;">اضغط على أي هاتف أو إكسسوار من القائمة لإضافته</p>
        </div>
      `;
    } else {
      list.innerHTML = cartData.items.map((item, idx) => {
        const phoneObj = AppState.phones.find(p => p.id === item.id);
        let imeiSelector = '';
        if (item.isPhone && phoneObj) {
          const imei1Val = phoneObj.imei1;
          const imei2Val = phoneObj.imei2;
          if (imei1Val && imei2Val) {
            imeiSelector = `
              <select class="form-control" style="height:26px; font-size:10.5px; padding:0 4px; margin-top:2px; color:var(--accent-cyan);" onchange="POSCartEngine.cart[${idx}].selectedIMEI = this.value; POSCartEngine.recalculate();">
                <option value="${imei1Val}" ${item.selectedIMEI === imei1Val ? 'selected' : ''}>IMEI 1: ${imei1Val}</option>
                <option value="${imei2Val}" ${item.selectedIMEI === imei2Val ? 'selected' : ''}>IMEI 2: ${imei2Val}</option>
              </select>
            `;
          } else {
            imeiSelector = `<div style="font-size:11px; color:var(--accent-cyan); font-weight:700;">IMEI: ${item.selectedIMEI || imei1Val || '-'}</div>`;
          }
        }

        const itemLineTotal = (item.price - item.discount) * item.qty;

        return `
          <div class="cart-item" style="background:var(--bg-input); padding:10px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-weight:700; font-size:13px; color:var(--text-main);">${item.name}</div>
              ${imeiSelector}
              <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                <span style="font-weight:800; color:var(--accent-emerald); font-size:13px;">${CurrencyFormatter.format(item.price, AppState.settings.currency)}</span>
                ${item.discount > 0 ? `<span style="font-size:11px; color:var(--accent-rose); text-decoration:line-through;">خصم: ${item.discount}</span>` : ''}
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <button class="btn btn-secondary btn-icon" style="width:24px; height:24px; font-size:12px;" onclick="POSCartEngine.cart[${idx}].qty = Math.max(1, POSCartEngine.cart[${idx}].qty - 1); POSCartEngine.recalculate();">-</button>
                <span style="font-weight:800; font-size:13px; min-width:18px; text-align:center;">${item.qty}</span>
                <button class="btn btn-secondary btn-icon" style="width:24px; height:24px; font-size:12px;" onclick="POSCartEngine.cart[${idx}].qty += 1; POSCartEngine.recalculate();">+</button>
                <button class="btn btn-danger btn-icon" style="width:24px; height:24px; font-size:12px;" onclick="POSCartEngine.removeItem(${idx})" title="حذف العنصر"><i class="fa-solid fa-trash"></i></button>
              </div>
              <div style="font-weight:800; font-size:12px; color:var(--primary);">الإجمالي: ${CurrencyFormatter.format(itemLineTotal, AppState.settings.currency)}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (document.getElementById("cartSubtotal")) document.getElementById("cartSubtotal").textContent = CurrencyFormatter.format(cartData.subtotal, AppState.settings.currency);
    if (document.getElementById("cartTotal")) document.getElementById("cartTotal").textContent = CurrencyFormatter.format(cartData.total, AppState.settings.currency);

    const paidInputVal = Number(document.getElementById("posPaidInput")?.value) || 0;
    const remainingDebt = Math.max(0, cartData.total - paidInputVal);
    const debtEl = document.getElementById("cartRemainingDebt");
    if (debtEl) {
      debtEl.textContent = CurrencyFormatter.format(remainingDebt, AppState.settings.currency);
      debtEl.style.color = remainingDebt > 0 ? "var(--accent-rose)" : "var(--accent-emerald)";
    }
  },

  renderPhonesTable() {
    const tbody = document.getElementById("phonesTableBody");
    if (!tbody) return;

    tbody.innerHTML = AppState.phones.map(p => `
      <tr>
        <td><strong>#${p.id.replace('ph_', '')}</strong></td>
        <td>
          <div style="font-weight:700;">${p.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">${p.brand} - ${p.model}</div>
        </td>
        <td>
          <div style="font-size:12px; font-weight:700; color:var(--accent-cyan);">IMEI 1: ${p.imei1 || '-'}</div>
          <div style="font-size:11px; color:var(--text-muted);">IMEI 2: ${p.imei2 || '-'}</div>
        </td>
        <td><span class="badge ${p.condition === 'New' ? 'badge-success' : 'badge-warning'}">${p.condition === 'New' ? 'جديد' : 'مستعمل (' + p.batteryHealth + '%)'}</span></td>
        <td>${CurrencyFormatter.format(p.purchasePrice, AppState.settings.currency)}</td>
        <td><strong style="color:var(--accent-emerald);">${CurrencyFormatter.format(p.sellingPrice, AppState.settings.currency)}</strong></td>
        <td><span class="badge ${p.stock > 0 ? 'badge-info' : 'badge-danger'}">${p.stock} أجهزة</span></td>
        <td><span class="badge badge-success">${p.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-icon" onclick="UIController.editPhone('${p.id}')" title="تعديل بيانات الهاتف"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-icon" onclick="UIController.deletePhone('${p.id}')" title="حذف الهاتف"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  renderAccessoriesTable() {
    const tbody = document.getElementById("accessoriesTableBody");
    if (!tbody) return;

    tbody.innerHTML = AppState.accessories.map(a => `
      <tr>
        <td><strong>${a.sku}</strong></td>
        <td><div style="font-weight:700;">${a.name}</div></td>
        <td><span class="badge badge-purple">${a.category}</span></td>
        <td>${a.brand}</td>
        <td>${CurrencyFormatter.format(a.purchasePrice, AppState.settings.currency)}</td>
        <td><strong style="color:var(--accent-emerald);">${CurrencyFormatter.format(a.sellingPrice, AppState.settings.currency)}</strong></td>
        <td><span class="badge ${a.stock > a.minStock ? 'badge-info' : 'badge-warning'}">${a.stock} قطعة</span></td>
        <td>
          <button class="btn btn-danger btn-icon" onclick="UIController.deleteAccessory('${a.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  renderInventoryTable() {
    const tbody = document.getElementById("inventoryTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("inventorySearchInput")?.value || "").toLowerCase().trim();
    const typeFilter = document.getElementById("inventoryTypeFilter")?.value || "all";

    let combinedItems = [];

    AppState.phones.forEach(p => {
      combinedItems.push({
        id: p.id,
        code: p.imei1 || p.barcode || `#${p.id.replace('ph_', '')}`,
        name: p.name,
        brandModel: `${p.brand} - ${p.model || ''}`,
        type: 'phone',
        typeLabel: 'هاتف ذكي',
        categoryBadge: 'badge-info',
        purchaseCost: Number(p.purchasePrice) || 0,
        sellingPrice: Number(p.sellingPrice) || 0,
        stock: Number(p.stock) || 0,
        isLow: p.stock <= (AppState.settings.lowStockThreshold || 3),
        totalVal: (Number(p.purchasePrice) || 0) * (Number(p.stock) || 0)
      });
    });

    AppState.accessories.forEach(a => {
      combinedItems.push({
        id: a.id,
        code: a.sku || a.barcode || `#${a.id}`,
        name: a.name,
        brandModel: `${a.brand} - ${a.category}`,
        type: 'accessory',
        typeLabel: 'إكسسوار',
        categoryBadge: 'badge-purple',
        purchaseCost: Number(a.purchasePrice) || 0,
        sellingPrice: Number(a.sellingPrice) || 0,
        stock: Number(a.stock) || 0,
        isLow: a.stock <= a.minStock,
        totalVal: (Number(a.purchasePrice) || 0) * (Number(a.stock) || 0)
      });
    });

    let totalCostVal = 0;
    let totalRetailVal = 0;
    let totalPhonesStock = 0;
    let totalAccStock = 0;

    combinedItems.forEach(item => {
      totalCostVal += (item.purchaseCost * item.stock);
      totalRetailVal += (item.sellingPrice * item.stock);
      if (item.type === 'phone') totalPhonesStock += item.stock;
      if (item.type === 'accessory') totalAccStock += item.stock;
    });

    if (document.getElementById("invCostValue")) document.getElementById("invCostValue").textContent = CurrencyFormatter.format(totalCostVal, AppState.settings.currency);
    if (document.getElementById("invRetailValue")) document.getElementById("invRetailValue").textContent = CurrencyFormatter.format(totalRetailVal, AppState.settings.currency);
    if (document.getElementById("invPhonesCount")) document.getElementById("invPhonesCount").textContent = totalPhonesStock + " جهاز متوفر";
    if (document.getElementById("invAccCount")) document.getElementById("invAccCount").textContent = totalAccStock + " قطعة متوفرة";

    const filtered = combinedItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm) || 
                          item.code.toLowerCase().includes(searchTerm) || 
                          item.brandModel.toLowerCase().includes(searchTerm);

      let matchType = true;
      if (typeFilter === 'phones') matchType = item.type === 'phone';
      if (typeFilter === 'accessories') matchType = item.type === 'accessory';
      if (typeFilter === 'low') matchType = item.isLow || item.stock === 0;

      return matchSearch && matchType;
    });

    tbody.innerHTML = filtered.map(item => `
      <tr>
        <td><strong style="color:var(--primary); font-size:12px;">${item.code}</strong></td>
        <td>
          <div style="font-weight:700;">${item.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">${item.brandModel}</div>
        </td>
        <td><span class="badge ${item.categoryBadge}">${item.typeLabel}</span></td>
        <td>${CurrencyFormatter.format(item.purchaseCost, AppState.settings.currency)}</td>
        <td><strong style="color:var(--accent-emerald);">${CurrencyFormatter.format(item.sellingPrice, AppState.settings.currency)}</strong></td>
        <td>
          <strong style="font-size:14px; ${item.stock === 0 ? 'color:var(--accent-rose);' : ''}">${item.stock}</strong>
        </td>
        <td><strong>${CurrencyFormatter.format(item.totalVal, AppState.settings.currency)}</strong></td>
        <td>
          <span class="badge ${item.stock === 0 ? 'badge-danger' : (item.isLow ? 'badge-warning' : 'badge-success')}">
            ${item.stock === 0 ? 'نفذت الكمية' : (item.isLow ? 'مخزون منخفض' : 'متوفر بالمخزن')}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:4px;">
            <button class="btn btn-secondary btn-icon" onclick="UIController.quickAdjustStock('${item.type}', '${item.id}')" title="تعديل الكمية والمخزون"><i class="fa-solid fa-pen-to-square"></i></button>
            ${item.type === 'phone' ? 
              `<button class="btn btn-secondary btn-icon" onclick="UIController.editPhone('${item.id}')" title="تعديل الهاتف"><i class="fa-solid fa-pen"></i></button>` : 
              `<button class="btn btn-danger btn-icon" onclick="UIController.deleteAccessory('${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>`
            }
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">لا توجد منتجات مطابقة لفلتر البحث</td></tr>`;
  },

  renderCustomersTable() {
    const tbody = document.getElementById("customersTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("customersSearchInput")?.value || "").toLowerCase().trim();

    // Calculate Summary Stats
    const totalCount = AppState.customers.length;
    let totalDebts = 0;
    let totalPaid = 0;

    AppState.customers.forEach(c => {
      totalDebts += (Number(c.totalDebt) || 0);
      totalPaid += (Number(c.totalPaid) || 0);
    });

    if (document.getElementById("custTotalCount")) document.getElementById("custTotalCount").textContent = totalCount + " عميل";
    if (document.getElementById("custTotalDebtsSum")) document.getElementById("custTotalDebtsSum").textContent = CurrencyFormatter.format(totalDebts, AppState.settings.currency);
    if (document.getElementById("custTotalPaidSum")) document.getElementById("custTotalPaidSum").textContent = CurrencyFormatter.format(totalPaid, AppState.settings.currency);

    const filtered = AppState.customers.filter(c => {
      const matchName = (c.name || "").toLowerCase().includes(searchTerm);
      const matchPhone = (c.phone || "").toLowerCase().includes(searchTerm);
      const matchAddress = (c.address || "").toLowerCase().includes(searchTerm);
      return matchName || matchPhone || matchAddress;
    });

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><span style="direction:ltr; font-weight:700; color:var(--primary);">${c.phone}</span></td>
        <td>${c.address || '-'}</td>
        <td>${CurrencyFormatter.format(c.totalPurchases || 0, AppState.settings.currency)}</td>
        <td><strong style="color:var(--accent-emerald);">${CurrencyFormatter.format(c.totalPaid || 0, AppState.settings.currency)}</strong></td>
        <td>
          <strong style="color:${(c.totalDebt || 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; font-size:14.5px;">
            ${CurrencyFormatter.format(c.totalDebt || 0, AppState.settings.currency)}
          </strong>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-warning btn-sm" onclick="UIController.openDebtModal('${c.id}')" style="font-weight:700;">
            <i class="fa-solid fa-coins"></i> تسديد / تعديل الدين
          </button>
        </td>
        <td style="text-align:center;">
          <div style="display:flex; justify-content:center; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="UIController.editCustomer('${c.id}')" title="تعديل اسم العميل وهاتفه">
              <i class="fa-solid fa-user-pen"></i> تعديل
            </button>
            <button class="btn btn-primary btn-sm" onclick="UIController.viewCustomerStatement('${c.id}')" title="عرض كشف الحساب التفصيلي">
              <i class="fa-solid fa-file-invoice"></i> كشف الحساب
            </button>
            <button class="btn btn-danger btn-icon" style="width:30px; height:30px;" onclick="UIController.deleteCustomer('${c.id}')" title="حذف العميل">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">لا يوجد عملاء مطبقين لشرط البحث</td></tr>`;
  },

  renderSuppliersTable() {
    const tbody = document.getElementById("suppliersTableBody");
    if (!tbody) return;

    tbody.innerHTML = AppState.suppliers.map(s => `
      <tr>
        <td><strong>${s.name}</strong> (${s.company})</td>
        <td>${s.phone}</td>
        <td>${s.email || '-'}</td>
        <td>${CurrencyFormatter.format(s.totalPurchases, AppState.settings.currency)}</td>
        <td>${CurrencyFormatter.format(s.totalPaid, AppState.settings.currency)}</td>
        <td><span class="badge ${s.totalDebt > 0 ? 'badge-danger' : 'badge-success'}">${CurrencyFormatter.format(s.totalDebt, AppState.settings.currency)}</span></td>
        <td>
          <button class="btn btn-secondary btn-icon" onclick="UIController.viewSupplierStatement('${s.id}')" title="كشف حساب المورد"><i class="fa-solid fa-file-contract"></i></button>
        </td>
      </tr>
    `).join('');
  },

  renderSalesTable() {
    const tbody = document.getElementById("salesTableBody");
    if (!tbody) return;

    tbody.innerHTML = AppState.sales.map(s => `
      <tr>
        <td><strong style="color:var(--primary);">${s.invoiceNo}</strong></td>
        <td>${new Date(s.date).toLocaleString('ar-EG')}</td>
        <td>${s.customerName}</td>
        <td>${s.items.length} منتجات</td>
        <td><strong>${CurrencyFormatter.format(s.total, AppState.settings.currency)}</strong></td>
        <td>${CurrencyFormatter.format(s.paid, AppState.settings.currency)}</td>
        <td><span class="badge ${s.remaining > 0 ? 'badge-danger' : 'badge-success'}">${CurrencyFormatter.format(s.remaining, AppState.settings.currency)}</span></td>
        <td>
          <button class="btn btn-secondary btn-icon" onclick="UIController.viewInvoice('${s.id}')"><i class="fa-solid fa-print"></i></button>
        </td>
      </tr>
    `).join('');
  },

  renderExpensesTable() {
    const tbody = document.getElementById("expensesTableBody");
    if (!tbody) return;

    tbody.innerHTML = AppState.expenses.map(e => `
      <tr>
        <td>${e.date}</td>
        <td><span class="badge badge-warning">${e.category}</span></td>
        <td>${e.description}</td>
        <td><strong style="color:var(--accent-rose);">${CurrencyFormatter.format(e.amount, AppState.settings.currency)}</strong></td>
        <td>${e.employee}</td>
      </tr>
    `).join('');
  },

  renderPartnersTable() {
    const tbody = document.getElementById("partnersTableBody");
    if (!tbody) return;

    ProfitEngine.calculateFinancialSummary();

    tbody.innerHTML = AppState.partners.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-info">${p.sharePercent}%</span></td>
        <td>${CurrencyFormatter.format(p.capital, AppState.settings.currency)}</td>
        <td><strong style="color:var(--accent-emerald);">${CurrencyFormatter.format(p.accruedProfit, AppState.settings.currency)}</strong></td>
        <td>${CurrencyFormatter.format(p.paidProfit, AppState.settings.currency)}</td>
        <td><span class="badge badge-purple">${CurrencyFormatter.format(p.balance, AppState.settings.currency)}</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="UIController.recordPartnerWithdrawal('${p.id}')">تسجيل سحب</button>
        </td>
      </tr>
    `).join('');
  },

  renderAuditLogs() {
    const tbody = document.getElementById("auditLogsTableBody");
    if (!tbody) return;

    tbody.innerHTML = AppState.auditLogs.map(l => `
      <tr>
        <td>${new Date(l.date).toLocaleString('ar-EG')}</td>
        <td><strong>${l.user}</strong></td>
        <td><span class="badge badge-info">${l.action}</span></td>
        <td>${l.details}</td>
      </tr>
    `).join('');
  },

  renderSettings() {
    const s = AppState.settings;
    if (document.getElementById("setStoreName")) document.getElementById("setStoreName").value = s.storeName;
    if (document.getElementById("setStorePhone")) document.getElementById("setStorePhone").value = s.storePhone;
    if (document.getElementById("setStoreAddress")) document.getElementById("setStoreAddress").value = s.storeAddress;
    if (document.getElementById("setCurrency")) document.getElementById("setCurrency").value = s.currency;
    if (document.getElementById("setTheme")) document.getElementById("setTheme").value = s.theme;
    if (document.getElementById("setAdminPassword")) document.getElementById("setAdminPassword").value = s.adminPassword || "1234";
    if (document.getElementById("setGithubToken")) document.getElementById("setGithubToken").value = s.githubToken || "";
    if (document.getElementById("setGithubRepo")) document.getElementById("setGithubRepo").value = s.githubRepo || "Store-phone-management";
  }
};

/* ==========================================================================
   8. UI CONTROLLER & EVENT LISTENERS
   ========================================================================== */
const UIController = {
  init() {
    DataRepository.init();
    this.checkAuthentication();
    RenderEngine.init();
    POSCartEngine.recalculate();
  },

  checkAuthentication() {
    const session = sessionStorage.getItem(AUTH_KEY);
    if (session) {
      try {
        AppState.currentUser = JSON.parse(session);
        document.body.classList.remove("locked");
        this.updateHeaderProfile();
        return;
      } catch (e) {}
    }
    document.body.classList.add("locked");
  },

  handleLogin(e) {
    if (e) e.preventDefault();
    const userVal = document.getElementById("loginUsername").value.trim();
    const passVal = document.getElementById("loginPassword").value.trim();
    const roleVal = document.getElementById("loginRole").value;

    const validPass = AppState.settings.adminPassword || "1234";

    if (userVal.toLowerCase() === "admin" && passVal !== validPass) {
      document.getElementById("loginErrorAlert").style.display = "block";
      return;
    }

    document.getElementById("loginErrorAlert").style.display = "none";

    AppState.currentUser = {
      id: "usr_" + Date.now(),
      name: userVal === "admin" ? "المدير العام" : userVal,
      username: userVal,
      role: roleVal
    };

    sessionStorage.setItem(AUTH_KEY, JSON.stringify(AppState.currentUser));
    document.body.classList.remove("locked");
    this.updateHeaderProfile();
    AuditLogEngine.log("تسجيل دخول", `تم تسجيل الدخول بحساب ${userVal} (${roleVal}).`);
    this.showToast(`مرحباً بك! تم تسجيل الدخول بحساب ${userVal}`, "success");
  },

  handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
    AppState.currentUser = null;
    document.body.classList.add("locked");
    this.showToast("تم تسجيل الخروج بنجاح.", "info");
  },

  handlePurgeAllData() {
    if (confirm("هل أنت متأكد من التصفير الشامل والكامل لكافة البيانات والمبيعات والهواتف؟ لا يمكن التراجع عن هذا الإجراء.")) {
      DataRepository.purgeAllData();
      RenderEngine.init();
      POSCartEngine.clearCart();
      this.showToast("تم تصفير جميع البيانات بنجاح وجعل المتجر فارغاً تماماً!", "success");
    }
  },

  handleRestoreDemoData() {
    if (confirm("هل تريد استعادة البيانات التجريبية الأولية (الهواتف والإكسسوارات الافتراضية)؟")) {
      DataRepository.restoreDemoData();
      RenderEngine.init();
      POSCartEngine.clearCart();
      this.showToast("تمت استعادة البيانات التجريبية بنجاح!", "info");
    }
  },

  updateHeaderProfile() {
    if (!AppState.currentUser) return;
    const elName = document.getElementById("headerUserName");
    const elRole = document.getElementById("headerUserRole");
    const elAvatar = document.getElementById("headerUserAvatar");

    if (elName) elName.textContent = AppState.currentUser.name;
    if (elRole) elRole.textContent = AppState.currentUser.role;
    if (elAvatar) elAvatar.textContent = AppState.currentUser.username.slice(0, 3).toUpperCase();
  },

  openNewPhoneModal() {
    const elEditId = document.getElementById("editingPhoneId");
    if (elEditId) elEditId.value = "";

    if (document.getElementById("phoneName")) document.getElementById("phoneName").value = "";
    if (document.getElementById("phoneBrand")) document.getElementById("phoneBrand").value = "Apple";
    if (document.getElementById("phoneModel")) document.getElementById("phoneModel").value = "";
    if (document.getElementById("phoneImei1")) document.getElementById("phoneImei1").value = "";
    if (document.getElementById("phoneImei2")) document.getElementById("phoneImei2").value = "";
    if (document.getElementById("phoneSerial")) document.getElementById("phoneSerial").value = "";
    if (document.getElementById("phoneCondition")) document.getElementById("phoneCondition").value = "New";
    if (document.getElementById("phoneCost")) document.getElementById("phoneCost").value = "";
    if (document.getElementById("phonePrice")) document.getElementById("phonePrice").value = "";
    if (document.getElementById("phoneBattery")) document.getElementById("phoneBattery").value = "100";
    if (document.getElementById("phoneStock")) document.getElementById("phoneStock").value = "1";

    this.openModal("phoneModal");
  },

  editPhone(phoneId) {
    const phone = AppState.phones.find(p => p.id === phoneId);
    if (!phone) {
      this.showToast("تعذر العثور على بيانات الهاتف المحدد.", "danger");
      return;
    }

    if (document.getElementById("editingPhoneId")) document.getElementById("editingPhoneId").value = phone.id;
    if (document.getElementById("phoneName")) document.getElementById("phoneName").value = phone.name || "";
    if (document.getElementById("phoneBrand")) document.getElementById("phoneBrand").value = phone.brand || "Apple";
    if (document.getElementById("phoneModel")) document.getElementById("phoneModel").value = phone.model || "";
    if (document.getElementById("phoneImei1")) document.getElementById("phoneImei1").value = phone.imei1 || "";
    if (document.getElementById("phoneImei2")) document.getElementById("phoneImei2").value = phone.imei2 || "";
    if (document.getElementById("phoneSerial")) document.getElementById("phoneSerial").value = phone.serialNumber || "";
    if (document.getElementById("phoneCondition")) document.getElementById("phoneCondition").value = phone.condition || "New";
    if (document.getElementById("phoneCost")) document.getElementById("phoneCost").value = phone.purchasePrice || 0;
    if (document.getElementById("phonePrice")) document.getElementById("phonePrice").value = phone.sellingPrice || 0;
    if (document.getElementById("phoneBattery")) document.getElementById("phoneBattery").value = phone.batteryHealth || 100;
    if (document.getElementById("phoneStock")) document.getElementById("phoneStock").value = phone.stock || 1;

    this.openModal("phoneModal");
  },

  viewCustomerStatement(custId) {
    const cust = AppState.customers.find(c => c.id === custId);
    if (!cust) return;

    const body = document.getElementById("statementModalBody");
    if (!body) return;

    const sales = AppState.sales.filter(s => s.customerId === custId);

    body.innerHTML = `
      <div style="padding:16px; font-family:'Cairo', sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:2px solid var(--primary); padding-bottom:8px;">
          <h3 style="color:var(--primary); font-size:18px; font-weight:800; margin:0;">كشف حساب العميل: ${cust.name}</h3>
          <span class="badge badge-info">الحالة: ${cust.status || 'نشط'}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">الهاتف: ${cust.phone} | العنوان: ${cust.address || '-'}</p>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px; text-align:center;">
          <div style="background:var(--bg-input); padding:12px; border-radius:8px;">
            <div style="font-size:12px; color:var(--text-muted);">إجمالي المشتريات</div>
            <strong style="font-size:16px; color:var(--text-main);">${CurrencyFormatter.format(cust.totalPurchases, AppState.settings.currency)}</strong>
          </div>
          <div style="background:var(--bg-input); padding:12px; border-radius:8px;">
            <div style="font-size:12px; color:var(--text-muted);">إجمالي المدفوعات</div>
            <strong style="font-size:16px; color:var(--accent-emerald);">${CurrencyFormatter.format(cust.totalPaid, AppState.settings.currency)}</strong>
          </div>
          <div style="background:var(--bg-input); padding:12px; border-radius:8px;">
            <div style="font-size:12px; color:var(--text-muted);">الديون المستحقة</div>
            <strong style="font-size:16px; color:var(--accent-rose);">${CurrencyFormatter.format(cust.totalDebt, AppState.settings.currency)}</strong>
          </div>
        </div>

        <h4 style="font-size:14px; font-weight:700; margin-bottom:8px;">سجل الفواتير والعمليات:</h4>
        <table class="custom-table">
          <thead>
            <tr><th>الفاتورة</th><th>التاريخ</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th></tr>
          </thead>
          <tbody>
            ${sales.map(s => `
              <tr>
                <td>${s.invoiceNo}</td>
                <td>${new Date(s.date).toLocaleDateString('ar-EG')}</td>
                <td>${CurrencyFormatter.format(s.total, AppState.settings.currency)}</td>
                <td>${CurrencyFormatter.format(s.paid, AppState.settings.currency)}</td>
                <td style="color:var(--accent-rose); font-weight:700;">${CurrencyFormatter.format(s.remaining, AppState.settings.currency)}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا توجد عمليات مبيعات مسجلة</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const titleEl = document.getElementById("statementModalTitle");
    if (titleEl) titleEl.textContent = "كشف حساب العميل: " + cust.name;
    this.openModal("statementModal");
  },

  viewSupplierStatement(supId) {
    const sup = AppState.suppliers.find(s => s.id === supId);
    if (!sup) return;

    const body = document.getElementById("statementModalBody");
    if (!body) return;

    const purchases = AppState.purchases.filter(p => p.supplierId === supId);

    body.innerHTML = `
      <div style="padding:16px; font-family:'Cairo', sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:2px solid var(--primary); padding-bottom:8px;">
          <h3 style="color:var(--primary); font-size:18px; font-weight:800; margin:0;">كشف حساب المورد: ${sup.name}</h3>
          <span class="badge badge-purple">${sup.company || '-'}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">الهاتف: ${sup.phone} | البريد: ${sup.email || '-'}</p>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px; text-align:center;">
          <div style="background:var(--bg-input); padding:12px; border-radius:8px;">
            <div style="font-size:12px; color:var(--text-muted);">إجمالي المشتريات</div>
            <strong style="font-size:16px; color:var(--text-main);">${CurrencyFormatter.format(sup.totalPurchases, AppState.settings.currency)}</strong>
          </div>
          <div style="background:var(--bg-input); padding:12px; border-radius:8px;">
            <div style="font-size:12px; color:var(--text-muted);">إجمالي المدفوعات</div>
            <strong style="font-size:16px; color:var(--accent-emerald);">${CurrencyFormatter.format(sup.totalPaid, AppState.settings.currency)}</strong>
          </div>
          <div style="background:var(--bg-input); padding:12px; border-radius:8px;">
            <div style="font-size:12px; color:var(--text-muted);">المبالغ المستحقة (دين المورد)</div>
            <strong style="font-size:16px; color:var(--accent-rose);">${CurrencyFormatter.format(sup.totalDebt, AppState.settings.currency)}</strong>
          </div>
        </div>

        <h4 style="font-size:14px; font-weight:700; margin-bottom:8px;">سجل التعاملات والشحنات:</h4>
        <table class="custom-table">
          <thead>
            <tr><th>الفاتورة/الشحنة</th><th>التاريخ</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th></tr>
          </thead>
          <tbody>
            ${purchases.map(p => `
              <tr>
                <td>${p.invoiceNo || p.id}</td>
                <td>${new Date(p.date).toLocaleDateString('ar-EG')}</td>
                <td>${CurrencyFormatter.format(p.total, AppState.settings.currency)}</td>
                <td>${CurrencyFormatter.format(p.paid, AppState.settings.currency)}</td>
                <td style="color:var(--accent-rose); font-weight:700;">${CurrencyFormatter.format(p.remaining, AppState.settings.currency)}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا توجد مشتريات مسجلة حالياً لهذا المورد</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const titleEl = document.getElementById("statementModalTitle");
    if (titleEl) titleEl.textContent = "كشف حساب المورد: " + sup.name;
    this.openModal("statementModal");
  },

  toggleTokenVisibility() {
    const input = document.getElementById("setGithubToken");
    const icon = document.getElementById("tokenEyeIcon");
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      if (icon) icon.className = "fa-solid fa-eye-slash";
    } else {
      input.type = "password";
      if (icon) icon.className = "fa-solid fa-eye";
    }
  },

  cleanInputToken(inputEl) {
    if (!inputEl) return;
    const cleaned = cleanGitHubToken(inputEl.value);
    if (inputEl.value !== cleaned && cleaned.length > 0) {
      inputEl.value = cleaned;
    }
  },

  async testGitHubToken() {
    const inputToken = document.getElementById("setGithubToken")?.value || AppState.settings.githubToken;
    const token = cleanGitHubToken(inputToken);
    const repo = (document.getElementById("setGithubRepo")?.value || AppState.settings.githubRepo || "Store-phone-management").trim();
    const user = (AppState.settings.githubUser || "hammacheikhe-byte").trim();
    const statusEl = document.getElementById("githubSyncStatus");

    if (!token) {
      if (statusEl) {
        statusEl.style.background = "rgba(244,63,94,0.15)";
        statusEl.style.color = "var(--accent-rose)";
        statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> يرجى إدخال رمز GitHub Token في الخانة أعلاه قبل الاختبار.`;
      }
      this.showToast("يرجى إدخال التوكن أولاً.", "warning");
      return;
    }

    if (statusEl) {
      statusEl.style.background = "rgba(59,130,246,0.15)";
      statusEl.style.color = "var(--primary)";
      statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري فحص واختبار التوكن مع GitHub...`;
    }

    try {
      let authHeader = `Bearer ${token}`;
      let testRes = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": authHeader,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (testRes.status === 401) {
        authHeader = `token ${token}`;
        testRes = await fetch("https://api.github.com/user", {
          headers: {
            "Authorization": authHeader,
            "Accept": "application/vnd.github.v3+json"
          }
        });
      }

      if (!testRes.ok) {
        if (testRes.status === 401) {
          throw new Error("رمز التوكن غير صحيح أو انتهت صلاحيته (401 Unauthorized - Bad credentials)");
        } else if (testRes.status === 403) {
          throw new Error("التوكن غير مصرح له أو تجاوز حد الطلبات (403 Forbidden)");
        } else {
          throw new Error(`خطأ في الاستجابة من GitHub (رمز ${testRes.status})`);
        }
      }

      const userData = await testRes.json();
      const authenticatedUser = userData.login || user;

      const repoRes = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
        headers: {
          "Authorization": authHeader,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (repoRes.status === 404) {
        throw new Error(`التوكن صحيح للحساب "${authenticatedUser}"، لكن المستودع "${repo}" غير موجود بالحساب "${user}" أو ينقص التوكن صلاحية 'repo'`);
      }

      AppState.settings.githubToken = token;
      AppState.settings.githubRepo = repo;
      DataRepository.saveState();

      if (statusEl) {
        statusEl.style.background = "rgba(16,185,129,0.15)";
        statusEl.style.color = "var(--accent-emerald)";
        statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> تم التثبت من التوكن بنجاح 100%! التوكن نشط للحساب (${authenticatedUser}) ومصرح له بالمزامنة على المستودع (${repo}).`;
      }
      this.showToast(`تم التثبت من صحة التوكن والمستودع ${repo} بنجاح!`, "success");

    } catch (err) {
      if (statusEl) {
        statusEl.style.background = "rgba(244,63,94,0.15)";
        statusEl.style.color = "var(--accent-rose)";
        statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> تعذر الاعتماد: ${err.message}`;
      }
      this.showToast(`فشل اختبار التوكن: ${err.message}`, "danger");
    }
  },

  async syncWithGitHubCloud(silent = false) {
    const rawToken = document.getElementById("setGithubToken")?.value || AppState.settings.githubToken;
    const token = cleanGitHubToken(rawToken);
    const repo = (document.getElementById("setGithubRepo")?.value || AppState.settings.githubRepo || "Store-phone-management").trim();
    const user = (AppState.settings.githubUser || "hammacheikhe-byte").trim();

    if (!token) {
      if (!silent) this.showToast("يرجى إدخال GitHub Personal Access Token من الإعدادات أولاً.", "warning");
      return;
    }

    AppState.settings.githubToken = token;
    AppState.settings.githubRepo = repo;
    DataRepository.saveState();

    const statusEl = document.getElementById("githubSyncStatus");
    if (statusEl) {
      statusEl.style.background = "rgba(59,130,246,0.15)";
      statusEl.style.color = "var(--primary)";
      statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع ومزامنة شحنة البيانات إلى GitHub (${user}/${repo})...`;
    }

    try {
      const contentStr = utf8ToBase64(JSON.stringify(AppState, null, 2));
      const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/dashboard-pos-data.json`;

      let authHeader = `Bearer ${token}`;
      let getRes = await fetch(apiUrl, {
        headers: {
          "Authorization": authHeader,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (getRes.status === 401) {
        authHeader = `token ${token}`;
        getRes = await fetch(apiUrl, {
          headers: {
            "Authorization": authHeader,
            "Accept": "application/vnd.github.v3+json"
          }
        });
      }

      let sha = "";
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      } else if (getRes.status === 401) {
        throw new Error("رمز التوكن غير صحيح أو انتهت صلاحيته (401 Bad credentials)");
      }

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": authHeader,
          "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `Auto Sync database snapshot at ${new Date().toISOString()}`,
          content: contentStr,
          sha: sha || undefined
        })
      });

      if (putRes.ok) {
        if (statusEl) {
          statusEl.style.background = "rgba(16,185,129,0.15)";
          statusEl.style.color = "var(--accent-emerald)";
          statusEl.innerHTML = `<i class="fa-solid fa-cloud-check"></i> تمت المزامنة السحابية بنجاح! تم حفظ شحنة البيانات على سحابة GitHub (${repo}).`;
        }
        if (!silent) this.showToast("تمت المزامنة السحابية وحفظ نسخة البيانات على GitHub بنجاح!", "success");
        AuditLogEngine.log("مزامنة GitHub", `تم حفظ النسخة السحابية على مستودع ${repo}.`);
      } else {
        const errJson = await putRes.json().catch(() => ({}));
        let detailMsg = errJson.message || `رمز الاستجابة ${putRes.status}`;
        if (putRes.status === 404) {
          detailMsg = `المستودع "${repo}" غير موجود بالحساب "${user}" أو ينقص التوكن صلاحية 'repo'`;
        } else if (putRes.status === 401) {
          detailMsg = "التوكن غير صحيح أو انتهت صلاحيته";
        }
        throw new Error(detailMsg);
      }
    } catch (err) {
      if (statusEl) {
        statusEl.style.background = "rgba(244,63,94,0.15)";
        statusEl.style.color = "var(--accent-rose)";
        statusEl.innerHTML = `<i class="fa-solid fa-cloud-xmark"></i> تعذرت المزامنة: ${err.message}`;
      }
      if (!silent) this.showToast(`تعذر الاتصال بـ GitHub: ${err.message}`, "danger");
    }
  },

  switchPage(pageId) {
    document.querySelectorAll(".page-view").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".menu-item").forEach(el => el.classList.remove("active"));

    const targetPage = document.getElementById(pageId + "Page") || document.getElementById(pageId);
    if (targetPage) targetPage.classList.add("active");

    const targetMenu = document.querySelector(`[data-page="${pageId}"]`);
    if (targetMenu) targetMenu.classList.add("active");

    RenderEngine.renderDashboard();
    if (pageId === "inventory") RenderEngine.renderInventoryTable();
    if (pageId === "customers") RenderEngine.renderCustomersTable();
    if (pageId === "phones") RenderEngine.renderPhonesTable();
    if (pageId === "accessories") RenderEngine.renderAccessoriesTable();
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  },

  toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("mobile-open");
      } else {
        sidebar.classList.toggle("collapsed");
      }
    }
  },

  toggleTheme() {
    AppState.settings.theme = AppState.settings.theme === "dark" ? "light" : "dark";
    DataRepository.saveState();
    RenderEngine.applyThemeAndColors();
    this.showToast(`تم التبديل إلى الوضع ${AppState.settings.theme === 'dark' ? 'الداكن' : 'الفاتح'}`, "info");
  },

  saveSettingsFromForm(e) {
    if (e) e.preventDefault();
    AppState.settings.storeName = document.getElementById("setStoreName").value;
    AppState.settings.storePhone = document.getElementById("setStorePhone").value;
    AppState.settings.storeAddress = document.getElementById("setStoreAddress").value;
    AppState.settings.currency = document.getElementById("setCurrency").value;
    AppState.settings.theme = document.getElementById("setTheme").value;
    AppState.settings.adminPassword = document.getElementById("setAdminPassword").value || "1234";
    AppState.settings.githubToken = document.getElementById("setGithubToken").value.trim();
    AppState.settings.githubRepo = document.getElementById("setGithubRepo").value.trim();

    DataRepository.saveState();
    RenderEngine.applyThemeAndColors();
    RenderEngine.renderDashboard();
    this.showToast("تم حفظ الإعدادات ورمز GitHub Token بنجاح", "success");
  },

  savePhoneForm(e) {
    if (e) e.preventDefault();

    const imei1 = document.getElementById("phoneImei1").value;
    const imei2 = document.getElementById("phoneImei2").value;
    const editingId = document.getElementById("editingPhoneId")?.value;

    if (imei1 && !IMEIManager.isUnique(imei1, editingId)) {
      this.showToast("عفواً! رقم IMEI 1 مستخدم بالفعل لهاتف آخر بالمتجر.", "danger");
      return;
    }
    if (imei2 && !IMEIManager.isUnique(imei2, editingId)) {
      this.showToast("عفواً! رقم IMEI 2 مستخدم بالفعل لهاتف آخر بالمتجر.", "danger");
      return;
    }

    const phoneData = {
      id: editingId || ("ph_" + Date.now()),
      name: document.getElementById("phoneName").value,
      brand: document.getElementById("phoneBrand").value,
      model: document.getElementById("phoneModel").value,
      color: document.getElementById("phoneColor").value,
      storage: document.getElementById("phoneStorage").value,
      ram: document.getElementById("phoneRam").value,
      condition: document.getElementById("phoneCondition").value,
      batteryHealth: document.getElementById("phoneBattery").value,
      imei1: imei1,
      imei2: imei2,
      purchasePrice: Number(document.getElementById("phoneCost").value) || 0,
      sellingPrice: Number(document.getElementById("phonePrice").value) || 0,
      stock: Number(document.getElementById("phoneStock").value) || 1,
      status: "Available"
    };

    if (editingId) {
      const idx = AppState.phones.findIndex(p => p.id === editingId);
      if (idx !== -1) AppState.phones[idx] = { ...AppState.phones[idx], ...phoneData };
      AuditLogEngine.log("تعديل هاتف", `تم تعديل بيانات الهاتف ${phoneData.name} (IMEI: ${phoneData.imei1}).`);
    } else {
      AppState.phones.unshift(phoneData);
      AuditLogEngine.log("إضافة هاتف", `تمت إضافة هاتف جديد ${phoneData.name} (IMEI: ${phoneData.imei1}).`);
    }

    DataRepository.saveState();
    RenderEngine.renderPhonesTable();
    RenderEngine.renderPOSProducts();
    this.closeModal("phoneModal");
    this.showToast("تم حفظ بيانات الهاتف بنجاح", "success");
  },

  saveAccessoryForm(e) {
    if (e) e.preventDefault();
    const newAcc = {
      id: "acc_" + Date.now(),
      name: document.getElementById("accName").value,
      sku: document.getElementById("accSku").value,
      category: document.getElementById("accCategory").value,
      brand: "عام",
      purchasePrice: Number(document.getElementById("accCost").value) || 0,
      sellingPrice: Number(document.getElementById("accPrice").value) || 0,
      stock: Number(document.getElementById("accStock").value) || 10,
      minStock: 3
    };

    AppState.accessories.unshift(newAcc);
    DataRepository.saveState();
    RenderEngine.renderAccessoriesTable();
    RenderEngine.renderPOSProducts();
    this.closeModal("accessoryModal");
    this.showToast("تم حفظ الإكسسوار بنجاح", "success");
  },

  openNewCustomerModal() {
    if (document.getElementById("editingCustomerId")) document.getElementById("editingCustomerId").value = "";
    const title = document.getElementById("customerModalTitle");
    if (title) title.innerHTML = `<i class="fa-solid fa-user-plus"></i> إضافة عميل جديد`;
    if (document.getElementById("custName")) document.getElementById("custName").value = "";
    if (document.getElementById("custPhone")) document.getElementById("custPhone").value = "";
    if (document.getElementById("custAddress")) document.getElementById("custAddress").value = "";
    if (document.getElementById("custInitialDebt")) document.getElementById("custInitialDebt").value = "0";
    if (document.getElementById("custInitialDebtGroup")) document.getElementById("custInitialDebtGroup").style.display = "block";
    this.openModal("customerModal");
  },

  editCustomer(custId) {
    const cust = AppState.customers.find(c => c.id === custId);
    if (!cust) return;

    if (document.getElementById("editingCustomerId")) document.getElementById("editingCustomerId").value = cust.id;
    const title = document.getElementById("customerModalTitle");
    if (title) title.innerHTML = `<i class="fa-solid fa-user-pen"></i> تعديل بيانات العميل`;
    if (document.getElementById("custName")) document.getElementById("custName").value = cust.name;
    if (document.getElementById("custPhone")) document.getElementById("custPhone").value = cust.phone;
    if (document.getElementById("custAddress")) document.getElementById("custAddress").value = cust.address || "";
    if (document.getElementById("custInitialDebtGroup")) document.getElementById("custInitialDebtGroup").style.display = "none";
    this.openModal("customerModal");
  },

  deleteCustomer(custId) {
    const cust = AppState.customers.find(c => c.id === custId);
    if (!cust) return;
    if (!confirm(`هل أنت تأكد من حذف العميل "${cust.name}"؟`)) return;

    AppState.customers = AppState.customers.filter(c => c.id !== custId);
    DataRepository.saveState();
    RenderEngine.renderCustomersTable();
    RenderEngine.renderDashboard();
    RenderEngine.renderPOSCustomersDropdown();
    this.showToast(`تم حذف العميل ${cust.name} بنجاح.`, "info");
  },

  openDebtModal(custId) {
    const cust = AppState.customers.find(c => c.id === custId);
    if (!cust) return;

    if (document.getElementById("debtCustId")) document.getElementById("debtCustId").value = cust.id;
    if (document.getElementById("debtCustName")) document.getElementById("debtCustName").textContent = cust.name;
    if (document.getElementById("debtCustCurrentAmount")) document.getElementById("debtCustCurrentAmount").textContent = CurrencyFormatter.format(cust.totalDebt || 0, AppState.settings.currency);
    if (document.getElementById("debtAmountInput")) document.getElementById("debtAmountInput").value = "";
    if (document.getElementById("debtNotesInput")) document.getElementById("debtNotesInput").value = "";
    this.updateDebtModalFields();
    this.openModal("editDebtModal");
  },

  updateDebtModalFields() {
    const adjustType = document.getElementById("debtAdjustType")?.value || "pay";
    const label = document.getElementById("debtAmountLabel");
    if (label) {
      if (adjustType === "pay") label.textContent = "المبلغ المدفوع كاش لتسديد الدين (MRU):";
      else if (adjustType === "add") label.textContent = "المبلغ المراد إضافته على الدين (MRU):";
      else if (adjustType === "set") label.textContent = "قيمة رصيد الدين الصافي الجديد (MRU):";
    }
  },

  saveDebtAdjustment(e) {
    if (e) e.preventDefault();
    const custId = document.getElementById("debtCustId")?.value;
    const cust = AppState.customers.find(c => c.id === custId);
    if (!cust) {
      this.showToast("لم يتم العثور على العميل المحدد.", "danger");
      return;
    }

    const adjustType = document.getElementById("debtAdjustType")?.value || "pay";
    const amount = Number(document.getElementById("debtAmountInput")?.value) || 0;
    const method = document.getElementById("debtPaymentMethod")?.value || "cash";
    const notes = (document.getElementById("debtNotesInput")?.value || "").trim();

    const oldDebt = cust.totalDebt || 0;

    if (adjustType === "pay") {
      cust.totalPaid = (cust.totalPaid || 0) + amount;
      cust.totalDebt = Math.max(0, oldDebt - amount);
      AuditLogEngine.log("تسديد دين عميل", `تسديد دفعة بقيمة ${CurrencyFormatter.format(amount, AppState.settings.currency)} من العميل ${cust.name} (طريقة: ${method}). ${notes}`);
      this.showToast(`تم تسديد ${CurrencyFormatter.format(amount, AppState.settings.currency)} وتحديث رصيد العميل ${cust.name} بنجاح!`, "success");
    } else if (adjustType === "add") {
      cust.totalDebt = oldDebt + amount;
      AuditLogEngine.log("إضافة دين عميل", `إضافة مديونية جديدة بقيمة ${CurrencyFormatter.format(amount, AppState.settings.currency)} على العميل ${cust.name}. ${notes}`);
      this.showToast(`تمت إضافة دين بمبلغ ${CurrencyFormatter.format(amount, AppState.settings.currency)} على العميل ${cust.name}`, "warning");
    } else if (adjustType === "set") {
      cust.totalDebt = amount;
      AuditLogEngine.log("تعديل يدوي لدين عميل", `تعديل رصيد الدين للعميل ${cust.name} من ${CurrencyFormatter.format(oldDebt, AppState.settings.currency)} إلى ${CurrencyFormatter.format(amount, AppState.settings.currency)}. ${notes}`);
      this.showToast(`تم تعديل دين العميل ${cust.name} إلى ${CurrencyFormatter.format(amount, AppState.settings.currency)}`, "info");
    }

    DataRepository.saveState();
    RenderEngine.renderCustomersTable();
    RenderEngine.renderDashboard();
    RenderEngine.renderPOSCustomersDropdown();
    this.closeModal("editDebtModal");
  },

  quickAdjustStock(type, id) {
    if (type === "phone") {
      const phone = AppState.phones.find(p => p.id === id);
      if (!phone) return;
      const inputVal = prompt(`تعديل الكمية المتاحة بالمخزن للهاتف (${phone.name}):`, phone.stock);
      if (inputVal === null) return;
      const newQty = parseInt(inputVal, 10);
      if (isNaN(newQty) || newQty < 0) {
        this.showToast("يرجى إدخال عدد صحيح للكمية.", "warning");
        return;
      }
      phone.stock = newQty;
      DataRepository.saveState();
      RenderEngine.renderInventoryTable();
      RenderEngine.renderPhonesTable();
      RenderEngine.renderDashboard();
      this.showToast(`تم تحديث مخزون ${phone.name} إلى ${newQty} جهاز`, "success");
    } else if (type === "accessory") {
      const acc = AppState.accessories.find(a => a.id === id);
      if (!acc) return;
      const inputVal = prompt(`تعديل الكمية المتاحة بالمخزن للإكسسوار (${acc.name}):`, acc.stock);
      if (inputVal === null) return;
      const newQty = parseInt(inputVal, 10);
      if (isNaN(newQty) || newQty < 0) {
        this.showToast("يرجى إدخال عدد صحيح للكمية.", "warning");
        return;
      }
      acc.stock = newQty;
      DataRepository.saveState();
      RenderEngine.renderInventoryTable();
      RenderEngine.renderAccessoriesTable();
      RenderEngine.renderDashboard();
      this.showToast(`تم تحديث مخزون ${acc.name} إلى ${newQty} قطعة`, "success");
    }
  },

  saveCustomerForm(e) {
    if (e) e.preventDefault();
    const editingId = document.getElementById("editingCustomerId")?.value;
    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const address = document.getElementById("custAddress").value.trim();
    const initialDebt = Number(document.getElementById("custInitialDebt")?.value) || 0;

    if (editingId) {
      const cust = AppState.customers.find(c => c.id === editingId);
      if (cust) {
        cust.name = name;
        cust.phone = phone;
        cust.address = address;
        this.showToast(`تم تحديث بيانات العميل ${name} بنجاح.`, "success");
      }
    } else {
      const newCust = {
        id: "cust_" + Date.now(),
        name: name,
        phone: phone,
        address: address,
        totalPurchases: 0,
        totalPaid: 0,
        totalDebt: initialDebt,
        status: "Active"
      };
      AppState.customers.unshift(newCust);
      if (initialDebt > 0) {
        AuditLogEngine.log("إضافة عميل جديد", `تسجيل العميل ${name} مع مديونية أولية قدرها ${CurrencyFormatter.format(initialDebt, AppState.settings.currency)}.`);
      }
      this.showToast(`تم إضافة العميل ${name} بنجاح`, "success");
    }

    DataRepository.saveState();
    RenderEngine.renderCustomersTable();
    RenderEngine.renderPOSCustomersDropdown();
    RenderEngine.renderDashboard();
    this.closeModal("customerModal");
  },

  saveSupplierForm(e) {
    if (e) e.preventDefault();
    const newSup = {
      id: "sup_" + Date.now(),
      name: document.getElementById("supName").value,
      company: document.getElementById("supCompany").value,
      phone: document.getElementById("supPhone").value,
      totalPurchases: 0,
      totalPaid: 0,
      totalDebt: 0
    };

    AppState.suppliers.unshift(newSup);
    DataRepository.saveState();
    RenderEngine.renderSuppliersTable();
    this.closeModal("supplierModal");
    this.showToast("تم إضافة المورد بنجاح", "success");
  },

  saveExpenseForm(e) {
    if (e) e.preventDefault();
    const newExp = {
      id: "exp_" + Date.now(),
      date: document.getElementById("expDate").value || new Date().toISOString().slice(0,10),
      category: document.getElementById("expCategory").value,
      description: document.getElementById("expDesc").value,
      amount: Number(document.getElementById("expAmount").value) || 0,
      employee: AppState.currentUser ? AppState.currentUser.name : "المدير"
    };

    AppState.expenses.unshift(newExp);
    DataRepository.saveState();
    RenderEngine.renderExpensesTable();
    RenderEngine.renderDashboard();
    this.closeModal("expenseModal");
    this.showToast("تم تسجيل المصروف بنجاح", "success");
  },

  handlePOSCheckout() {
    try {
      const custId = document.getElementById("posCustomerSelect")?.value;
      const custObj = AppState.customers.find(c => c.id === custId);

      const sale = POSCartEngine.checkoutSale({
        customerId: custId,
        customerName: custObj ? custObj.name : "عميل نقدي",
        customerPhone: custObj ? custObj.phone : "-",
        subtotal: parseFloat(document.getElementById("cartSubtotal")?.textContent.replace(/[^0-9.]/g, '') || 0),
        discount: POSCartEngine.discount,
        tax: 0,
        total: parseFloat(document.getElementById("cartTotal")?.textContent.replace(/[^0-9.]/g, '') || 0),
        paid: Number(document.getElementById("posPaidInput")?.value) || parseFloat(document.getElementById("cartTotal")?.textContent.replace(/[^0-9.]/g, '') || 0),
        paymentMethod: document.getElementById("posPaymentMethod")?.value || "cash"
      });

      RenderEngine.renderDashboard();
      RenderEngine.renderPOSProducts();
      RenderEngine.renderSalesTable();
      this.viewInvoice(sale.id);
      this.showToast("تمت عملية البيع بنجاح وتوليد الفاتورة!", "success");
    } catch (err) {
      this.showToast(err.message, "danger");
    }
  },

  viewInvoice(saleId) {
    const sale = AppState.sales.find(s => s.id === saleId);
    if (!sale) return;

    const modalBody = document.getElementById("invoiceModalBody");
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div id="printableInvoice" style="background:#fff; color:#000; padding:24px; font-family:'Cairo', sans-serif;">
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #3b82f6; padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h2 style="color:#1e3a8a; font-size:22px; font-weight:800;">${AppState.settings.storeName}</h2>
            <p style="font-size:12px; color:#475569;">${AppState.settings.storeAddress} | هاتف: ${AppState.settings.storePhone}</p>
          </div>
          <div style="text-align:left;">
            <h3 style="color:#2563eb; font-size:18px;">فاتورة مبيعات</h3>
            <p style="font-size:12px; font-weight:700;">رقم: ${sale.invoiceNo}</p>
            <p style="font-size:11px; color:#64748b;">التاريخ: ${new Date(sale.date).toLocaleString('ar-EG')}</p>
          </div>
        </div>

        <div style="margin-bottom:16px; font-size:13px; background:#f8fafc; padding:10px; border-radius:6px;">
          <strong>العميل:</strong> ${sale.customerName} | <strong>الهاتف:</strong> ${sale.customerPhone} <br>
          <strong>الموظف المسؤول:</strong> ${sale.employeeName}
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:13px;">
          <thead>
            <tr style="background:#e2e8f0; text-align:right;">
              <th style="padding:8px; border:1px solid #cbd5e1;">المنتج</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">IMEI / SKU</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">الكمية</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">السعر</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td style="padding:8px; border:1px solid #cbd5e1;">${item.name}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700; color:#0284c7;">${item.imei || '-'}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${item.qty}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${CurrencyFormatter.format(item.unitPrice, AppState.settings.currency)}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">${CurrencyFormatter.format(item.total, AppState.settings.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; font-size:14px; margin-bottom:16px;">
          <div style="width:240px; background:#f1f5f9; padding:12px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between;"><span>الإجمالي:</span> <strong>${CurrencyFormatter.format(sale.subtotal, AppState.settings.currency)}</strong></div>
            <div style="display:flex; justify-content:space-between; color:#dc2626;"><span>الخصم:</span> <strong>${CurrencyFormatter.format(sale.discount, AppState.settings.currency)}</strong></div>
            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px; border-top:1px solid #cbd5e1; padding-top:6px; margin-top:6px; color:#16a34a;">
              <span>المدفوع:</span> <span>${CurrencyFormatter.format(sale.paid, AppState.settings.currency)}</span>
            </div>
            ${sale.remaining > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#b91c1c; font-weight:700; margin-top:4px;">
                <span>المتبقي (دين):</span> <span>${CurrencyFormatter.format(sale.remaining, AppState.settings.currency)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="text-align:center; font-size:11px; color:#64748b; border-top:1px dashed #cbd5e1; padding-top:8px;">
          ${AppState.settings.invoiceFooter}
        </div>
      </div>
    `;

    this.openModal("invoiceModal");
  },

  handleGlobalSearch(query) {
    const dropdown = document.getElementById("searchResultsDropdown");
    if (!dropdown) return;

    const term = (query || "").toLowerCase().trim();
    if (!term) {
      dropdown.classList.remove("active");
      return;
    }

    const matchedPhones = AppState.phones.filter(p => p.name.toLowerCase().includes(term) || (p.imei1 && p.imei1.includes(term)));
    const matchedSales = AppState.sales.filter(s => s.invoiceNo.toLowerCase().includes(term) || s.customerName.toLowerCase().includes(term));
    const matchedCustomers = AppState.customers.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));

    let html = "";
    matchedPhones.forEach(p => {
      html += `
        <div class="search-result-item" onclick="UIController.switchPage('phones'); UIController.closeGlobalSearch();">
          <div class="search-result-title"><i class="fa-solid fa-mobile-screen" style="color:var(--primary);"></i> ${p.name}</div>
          <div class="search-result-sub"><span>IMEI: ${p.imei1}</span> | <span>سعر البيع: ${CurrencyFormatter.format(p.sellingPrice, AppState.settings.currency)}</span></div>
        </div>
      `;
    });

    matchedSales.forEach(s => {
      html += `
        <div class="search-result-item" onclick="UIController.viewInvoice('${s.id}'); UIController.closeGlobalSearch();">
          <div class="search-result-title"><i class="fa-solid fa-receipt" style="color:var(--accent-emerald);"></i> الفاتورة: ${s.invoiceNo}</div>
          <div class="search-result-sub"><span>العميل: ${s.customerName}</span> | <span>الإجمالي: ${CurrencyFormatter.format(s.total, AppState.settings.currency)}</span></div>
        </div>
      `;
    });

    matchedCustomers.forEach(c => {
      html += `
        <div class="search-result-item" onclick="UIController.viewCustomerStatement('${c.id}'); UIController.closeGlobalSearch();">
          <div class="search-result-title"><i class="fa-solid fa-user" style="color:var(--accent-cyan);"></i> العميل: ${c.name}</div>
          <div class="search-result-sub"><span>الهاتف: ${c.phone}</span> | <span>الدين: ${CurrencyFormatter.format(c.totalDebt, AppState.settings.currency)}</span></div>
        </div>
      `;
    });

    dropdown.innerHTML = html || `<div style="padding:16px; text-align:center; color:var(--text-muted);">لا توجد نتائج مطابقة لـ "${term}"</div>`;
    dropdown.classList.add("active");
  },

  closeGlobalSearch() {
    const dropdown = document.getElementById("searchResultsDropdown");
    if (dropdown) dropdown.classList.remove("active");
  },

  printCurrentInvoice() {
    window.print();
  },

  exportReportCSV(type) {
    let csv = "InvoiceNo,Customer,Total,Paid,Remaining,Date\n";
    AppState.sales.forEach(s => {
      csv += `"${s.invoiceNo}","${s.customerName}",${s.total},${s.paid},${s.remaining},"${s.date}"\n`;
    });

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `report_${type}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    this.showToast("تم تصدير ملف الـ CSV بنجاح", "success");
  },

  recordPartnerWithdrawal(partnerId) {
    const partner = AppState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    const amount = prompt(`أدخل مبلغ السحب للشريك ${partner.name}:`);
    if (amount && !isNaN(amount) && Number(amount) > 0) {
      const drawVal = Number(amount);
      partner.paidProfit += drawVal;
      partner.balance = Math.max(0, partner.accruedProfit - partner.paidProfit);
      
      AppState.expenses.push({
        id: "exp_partner_" + Date.now(),
        date: new Date().toISOString().slice(0,10),
        category: "مسحوبات شركاء",
        description: `سحب أرباح للشريك ${partner.name}`,
        amount: drawVal,
        employee: AppState.currentUser ? AppState.currentUser.name : "الشريك"
      });

      DataRepository.saveState();
      RenderEngine.renderPartnersTable();
      RenderEngine.renderExpensesTable();
      RenderEngine.renderDashboard();
      this.showToast(`تم تسجيل سحب بمبلغ ${CurrencyFormatter.format(drawVal, AppState.settings.currency)} للشريك ${partner.name}`, "success");
    }
  },

  deletePhone(id) {
    if (confirm("هل أنت متأكد من حذف هذا الهاتف من المخزن؟")) {
      AppState.phones = AppState.phones.filter(p => p.id !== id);
      DataRepository.saveState();
      RenderEngine.renderPhonesTable();
      RenderEngine.renderPOSProducts();
      this.showToast("تم حذف الهاتف بنجاح", "info");
    }
  },

  deleteAccessory(id) {
    if (confirm("هل أنت متأكد من حذف هذا الإكسسوار؟")) {
      AppState.accessories = AppState.accessories.filter(a => a.id !== id);
      DataRepository.saveState();
      RenderEngine.renderAccessoriesTable();
      RenderEngine.renderPOSProducts();
      this.showToast("تم حذف الإكسسوار", "info");
    }
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "danger") icon = "fa-circle-exclamation";
    if (type === "warning") icon = "fa-triangle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-100%)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

/* ==========================================================================
   9. EXPORT ENGINE (PDF & EXCEL .XLSX ENGINE)
   ========================================================================== */
const ExportEngine = {
  exportToExcel(dataType) {
    let dataArray = [];
    const dateStr = new Date().toISOString().slice(0, 10);
    let fileName = `PHONE_STORE_${dataType.toUpperCase()}_${dateStr}.xlsx`;

    if (dataType === "phones") {
      dataArray = AppState.phones.map(p => ({
        "الكود": p.id,
        "اسم الهاتف": p.name,
        "الماركة": p.brand,
        "الموديل": p.model,
        "IMEI 1": p.imei1 || "-",
        "IMEI 2": p.imei2 || "-",
        "السيريال": p.serialNumber || "-",
        "حالة الجهاز": p.condition === "New" ? "جديد" : "مستعمل",
        "سعر الشراء (MRU)": p.purchasePrice,
        "سعر البيع (MRU)": p.sellingPrice,
        "الكمية بالمخزن": p.stock,
        "الحالة": p.status
      }));
    } else if (dataType === "sales") {
      dataArray = AppState.sales.map(s => ({
        "رقم الفاتورة": s.invoiceNo,
        "التاريخ": new Date(s.date).toLocaleString('ar-EG'),
        "اسم العميل": s.customerName,
        "هاتف العميل": s.customerPhone,
        "الموظف": s.employeeName,
        "عدد المنتجات": s.items ? s.items.length : 0,
        "المجموع (MRU)": s.subtotal,
        "الخصم (MRU)": s.discount,
        "الإجمالي الصافي (MRU)": s.total,
        "المدفوع (MRU)": s.paid,
        "المتبقي (دين)": s.remaining,
        "طريقة الدفع": s.paymentMethod
      }));
    } else if (dataType === "accessories") {
      dataArray = AppState.accessories.map(a => ({
        "رمز SKU": a.sku,
        "الاسم": a.name,
        "التصنيف": a.category,
        "الماركة": a.brand,
        "سعر الشراء (MRU)": a.purchasePrice,
        "سعر البيع (MRU)": a.sellingPrice,
        "الكمية المتبقية": a.stock
      }));
    } else if (dataType === "customers") {
      dataArray = AppState.customers.map(c => ({
        "اسم العميل": c.name,
        "الهاتف": c.phone,
        "العنوان": c.address || "-",
        "إجمالي المشتريات": c.totalPurchases,
        "إجمالي المدفوعات": c.totalPaid,
        "الديون المستحقة": c.totalDebt,
        "الحالة": c.status
      }));
    } else if (dataType === "suppliers") {
      dataArray = AppState.suppliers.map(s => ({
        "اسم المورد": s.name,
        "الشركة": s.company,
        "الهاتف": s.phone,
        "البريد": s.email || "-",
        "إجمالي المشتريات": s.totalPurchases,
        "إجمالي المدفوعات": s.totalPaid,
        "الديون المستحقة للمورد": s.totalDebt
      }));
    } else if (dataType === "expenses") {
      dataArray = AppState.expenses.map(e => ({
        "التاريخ": e.date,
        "التصنيف": e.category,
        "الوصف والبيان": e.description,
        "المبلغ (MRU)": e.amount,
        "المسؤول": e.employee
      }));
    } else if (dataType === "partners") {
      dataArray = AppState.partners.map(p => ({
        "اسم الشريك": p.name,
        "نسبة الشراكة": p.sharePercent + "%",
        "رأس المال (MRU)": p.capital,
        "الأرباح المستحقة": p.accruedProfit,
        "المسحوبات": p.paidProfit,
        "الرصيد المتبقي": p.balance
      }));
    } else if (dataType === "inventory") {
      let invArr = [];
      AppState.phones.forEach(p => {
        invArr.push({
          "الكود / IMEI": p.imei1 || p.barcode || p.id,
          "اسم المنتج": p.name,
          "النوع": "هاتف ذكي",
          "الماركة": p.brand,
          "سعر الشراء (MRU)": p.purchasePrice,
          "سعر البيع (MRU)": p.sellingPrice,
          "الكمية المتبقية": p.stock,
          "إجمالي تكلفة الأصناف": p.purchasePrice * p.stock,
          "حالة المخزون": p.stock > 0 ? "متوفر بالمخزن" : "نفذت الكمية"
        });
      });
      AppState.accessories.forEach(a => {
        invArr.push({
          "الكود / SKU": a.sku || a.id,
          "اسم المنتج": a.name,
          "النوع": "إكسسوار",
          "الماركة": a.brand || a.category,
          "سعر الشراء (MRU)": a.purchasePrice,
          "سعر البيع (MRU)": a.sellingPrice,
          "الكمية المتبقية": a.stock,
          "إجمالي تكلفة الأصناف": a.purchasePrice * a.stock,
          "حالة المخزون": a.stock > 0 ? "متوفر بالمخزن" : "نفذت الكمية"
        });
      });
      dataArray = invArr;
    }

    if (!dataArray.length) {
      UIController.showToast("لا توجد بيانات متاحة للتصدير في هذه القائمة.", "warning");
      return;
    }

    if (window.XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(dataArray);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, dataType.toUpperCase());
      XLSX.writeFile(workbook, fileName);
      UIController.showToast(`تم تصدير ملف Excel بنجاح (${fileName})!`, "success");
    } else {
      let csvContent = "\uFEFF";
      const headers = Object.keys(dataArray[0]);
      csvContent += headers.join(",") + "\n";
      dataArray.forEach(row => {
        csvContent += headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(".xlsx", ".csv");
      link.click();
      UIController.showToast("تم تصدير الملف بصيغة Excel CSV بنجاح!", "success");
    }
  },

  exportToPDF(containerId, title) {
    const element = document.getElementById(containerId);
    if (!element) {
      UIController.showToast("تعذر العثور على العنصر للتصدير.", "danger");
      return;
    }

    UIController.showToast("جاري تحويل وتجهيز ملف PDF...", "info");

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `${title}_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => {
        UIController.showToast("تم تحويل وتصدير ملف الـ PDF بنجاح!", "success");
      }).catch(err => {
        window.print();
      });
    } else {
      window.print();
    }
  },

  exportInvoicePDF() {
    const element = document.getElementById("printableInvoice");
    if (!element) {
      UIController.showToast("تعذر العثور على الفاتورة للتصدير.", "danger");
      return;
    }
    UIController.showToast("جاري تحويل وتجهيز الفاتورة بصيغة PDF...", "info");

    const opt = {
      margin:       [5, 5, 5, 5],
      filename:     `Invoice_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => {
        UIController.showToast("تم تحويل وتصدير الفاتورة بصيغة PDF بنجاح!", "success");
      }).catch(() => {
        window.print();
      });
    } else {
      window.print();
    }
  },

  exportStatementPDF() {
    const element = document.getElementById("statementModalBody");
    if (!element) {
      UIController.showToast("تعذر العثور على كشف الحساب.", "danger");
      return;
    }
    UIController.showToast("جاري تحويل وتجهيز كشف الحساب بصيغة PDF...", "info");

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `Statement_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => {
        UIController.showToast("تم تحويل وتصدير كشف الحساب بصيغة PDF بنجاح!", "success");
      }).catch(() => {
        window.print();
      });
    } else {
      window.print();
    }
  }
};

window.ExportEngine = ExportEngine;
window.exportToExcel = (type) => ExportEngine.exportToExcel(type);
window.exportToPDF = (id, title) => ExportEngine.exportToPDF(id, title);
window.UIController = UIController;
window.editPhone = (id) => UIController.editPhone(id);
window.viewCustomerStatement = (id) => UIController.viewCustomerStatement(id);
window.viewSupplierStatement = (id) => UIController.viewSupplierStatement(id);
window.openNewPhoneModal = () => UIController.openNewPhoneModal();
window.testGitHubToken = () => UIController.testGitHubToken();
window.openDebtModal = (id) => UIController.openDebtModal(id);
window.editCustomer = (id) => UIController.editCustomer(id);
window.deleteCustomer = (id) => UIController.deleteCustomer(id);
window.openNewCustomerModal = () => UIController.openNewCustomerModal();
window.quickAdjustStock = (type, id) => UIController.quickAdjustStock(type, id);

document.addEventListener("DOMContentLoaded", () => {
  UIController.init();
});
