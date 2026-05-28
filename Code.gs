const APP_NAME = 'Kasir Warung';

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  const output = template.evaluate();
  output.setTitle(APP_NAME);
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function serverCall(action, params) {
  try {
    switch (action) {
      case 'login':            return Auth.login(params);
      case 'logout':           return Auth.logout(params);
      case 'getDashboardData': return Dashboard.getData(params);
      case 'getMenu':          return MenuManager.getAll(params);
      case 'addMenu':          return MenuManager.add(params);
      case 'updateMenu':       return MenuManager.update(params);
      case 'deleteMenu':       return MenuManager.remove(params);
      case 'getKategori':      return MenuManager.getKategori(params);
      case 'addKategori':      return MenuManager.addKategori(params);
      case 'saveTransaksi':    return TransaksiManager.save(params);
      case 'getTransaksi':     return TransaksiManager.getAll(params);
      case 'getTransaksiById': return TransaksiManager.getById(params);
      case 'deleteTransaksi':  return TransaksiManager.remove(params);
      case 'getBahanBaku':     return BahanBakuManager.getAll(params);
      case 'addBahanBaku':     return BahanBakuManager.add(params);
      case 'updateBahanBaku':  return BahanBakuManager.update(params);
      case 'deleteBahanBaku':  return BahanBakuManager.remove(params);
      case 'getResep':         return ResepManager.getAll(params);
      case 'saveResep':        return ResepManager.save(params);
      case 'deleteResep':      return ResepManager.remove(params);
      case 'getPengeluaran':   return PengeluaranManager.getAll(params);
      case 'addPengeluaran':   return PengeluaranManager.add(params);
      case 'updatePengeluaran':return PengeluaranManager.update(params);
      case 'deletePengeluaran':return PengeluaranManager.remove(params);
      case 'getSupplier':      return SupplierManager.getAll(params);
      case 'addSupplier':      return SupplierManager.add(params);
      case 'updateSupplier':   return SupplierManager.update(params);
      case 'deleteSupplier':   return SupplierManager.remove(params);
      case 'getLaporan':       return LaporanManager.get(params);
      default: return {success:false, message:'Action tidak dikenal', data:null};
    }
  } catch(err) {
    return {success:false, message:err.message, data:null};
  }
}

function setupDatabase() {
  Database.initialize();
}

function resetAndSetup() {
  Database.initialize();
}
