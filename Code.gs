// ============================================================
// KASIR WARUNG - Code.gs (Main Entry Point)
// ============================================================

const APP_VERSION = '1.0.0';
const APP_NAME = 'Kasir Warung';

// ============================================================
// WEB APP ENTRY POINTS
// ============================================================

function doGet(e) {
  const page = e.parameter.page || 'app';
  
  if (page === 'app') {
    const template = HtmlService.createTemplateFromFile('index');
    template.appName = APP_NAME;
    template.version = APP_VERSION;
    
    const output = template.evaluate();
    output.setTitle(APP_NAME);
    output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    output.addMetaTag('mobile-web-app-capable', 'yes');
    output.addMetaTag('apple-mobile-web-app-capable', 'yes');
    output.addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    output.addMetaTag('apple-mobile-web-app-title', APP_NAME);
    output.addMetaTag('theme-color', '#f9a8d4');
    output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    return output;
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// SERVER-SIDE ROUTER
// ============================================================

function serverCall(action, params) {
  try {
    switch (action) {
      // Auth
      case 'login': return Auth.login(params);
      case 'logout': return Auth.logout(params);
      case 'checkSession': return Auth.checkSession(params);
      case 'changePassword': return Auth.changePassword(params);
      
      // Dashboard
      case 'getDashboardData': return Dashboard.getData(params);
      
      // Menu
      case 'getMenu': return MenuManager.getAll(params);
      case 'addMenu': return MenuManager.add(params);
      case 'updateMenu': return MenuManager.update(params);
      case 'deleteMenu': return MenuManager.remove(params);
      case 'getMenuById': return MenuManager.getById(params);
      
      // Kategori
      case 'getKategori': return MenuManager.getKategori(params);
      case 'addKategori': return MenuManager.addKategori(params);
      case 'deleteKategori': return MenuManager.deleteKategori(params);
      
      // Transaksi
      case 'saveTransaksi': return TransaksiManager.save(params);
      case 'getTransaksi': return TransaksiManager.getAll(params);
      case 'getTransaksiById': return TransaksiManager.getById(params);
      case 'deleteTransaksi': return TransaksiManager.remove(params);
      case 'getNextInvoice': return TransaksiManager.getNextInvoice(params);
      
      // Bahan Baku
      case 'getBahanBaku': return BahanBakuManager.getAll(params);
      case 'addBahanBaku': return BahanBakuManager.add(params);
      case 'updateBahanBaku': return BahanBakuManager.update(params);
      case 'deleteBahanBaku': return BahanBakuManager.remove(params);
      
      // Resep
      case 'getResep': return ResepManager.getAll(params);
      case 'saveResep': return ResepManager.save(params);
      case 'deleteResep': return ResepManager.remove(params);
      
      // Pengeluaran
      case 'getPengeluaran': return PengeluaranManager.getAll(params);
      case 'addPengeluaran': return PengeluaranManager.add(params);
      case 'updatePengeluaran': return PengeluaranManager.update(params);
      case 'deletePengeluaran': return PengeluaranManager.remove(params);
      
      // Supplier
      case 'getSupplier': return SupplierManager.getAll(params);
      case 'addSupplier': return SupplierManager.add(params);
      case 'updateSupplier': return SupplierManager.update(params);
      case 'deleteSupplier': return SupplierManager.remove(params);
      
      // User
      case 'getUsers': return UserManager.getAll(params);
      case 'addUser': return UserManager.add(params);
      case 'updateUser': return UserManager.update(params);
      case 'deleteUser': return UserManager.remove(params);
      
      // Laporan
      case 'getLaporan': return LaporanManager.get(params);
      case 'exportLaporan': return LaporanManager.export(params);
      
      default:
        return Utilities.response(false, 'Action tidak dikenali: ' + action);
    }
  } catch (err) {
    console.error('serverCall error [' + action + ']:', err);
    return Utilities.response(false, 'Server error: ' + err.message);
  }
}

// ============================================================
// SETUP - Run once to initialize spreadsheet
// ============================================================

function setupDatabase() {
  Database.initialize();
  Logger.log('Database initialized successfully');
}

function resetAndSetup() {
  Database.initialize();
  Auth.createDefaultUsers();
  Logger.log('Setup complete. Default users created.');
}
