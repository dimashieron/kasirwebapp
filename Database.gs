// ============================================================
// KASIR WARUNG - Database.gs
// ============================================================

const Database = (() => {

  const SPREADSHEET_ID = ''; // Kosongkan = gunakan spreadsheet terikat
  
  const SHEETS_CONFIG = {
    Menu: {
      headers: ['ID Menu', 'Nama Menu', 'ID Kategori', 'Harga Jual', 'Harga Modal', 'Stok', 'Satuan', 'Foto', 'Status Aktif', 'Tanggal Dibuat'],
      sampleData: [
        ['MNU001', 'Nasi Goreng', 'KAT001', 15000, 8000, 50, 'porsi', '', 'aktif', new Date()],
        ['MNU002', 'Mie Goreng', 'KAT001', 13000, 7000, 40, 'porsi', '', 'aktif', new Date()],
        ['MNU003', 'Es Teh Manis', 'KAT002', 5000, 2000, 100, 'gelas', '', 'aktif', new Date()],
        ['MNU004', 'Kopi Hitam', 'KAT002', 7000, 3000, 80, 'gelas', '', 'aktif', new Date()],
        ['MNU005', 'Pisang Goreng', 'KAT003', 8000, 4000, 30, 'porsi', '', 'aktif', new Date()]
      ]
    },
    Transaksi: {
      headers: ['ID Transaksi', 'Tanggal', 'Nomor Invoice', 'Nama Kasir', 'Total Item', 'Subtotal', 'Diskon', 'Total', 'Metode Pembayaran', 'Catatan']
    },
    DetailTransaksi: {
      headers: ['ID Detail', 'ID Transaksi', 'ID Menu', 'Nama Menu', 'Jumlah', 'Harga', 'Subtotal']
    },
    BahanBaku: {
      headers: ['ID Bahan', 'Nama Bahan', 'Stok', 'Satuan', 'Harga Beli', 'Minimum Stok', 'Supplier', 'Tanggal Update'],
      sampleData: [
        ['BHN001', 'Beras', 25, 'kg', 12000, 5, 'Toko Sembako Jaya', new Date()],
        ['BHN002', 'Minyak Goreng', 10, 'liter', 18000, 3, 'Toko Sembako Jaya', new Date()],
        ['BHN003', 'Telur', 50, 'butir', 2000, 20, 'Pak Budi', new Date()],
        ['BHN004', 'Teh Celup', 5, 'kotak', 8000, 2, 'Toko Sembako Jaya', new Date()]
      ]
    },
    Resep: {
      headers: ['ID Resep', 'ID Menu', 'ID Bahan', 'Jumlah Pemakaian']
    },
    Pengeluaran: {
      headers: ['ID Pengeluaran', 'Tanggal', 'Kategori', 'Deskripsi', 'Nominal']
    },
    Supplier: {
      headers: ['ID Supplier', 'Nama Supplier', 'Nomor HP', 'Alamat', 'Catatan'],
      sampleData: [
        ['SUP001', 'Toko Sembako Jaya', '081234567890', 'Jl. Pasar No. 1', 'Supplier utama'],
        ['SUP002', 'Pak Budi', '082345678901', 'Jl. Peternakan No. 5', 'Supplier telur dan ayam']
      ]
    },
    Kategori: {
      headers: ['ID Kategori', 'Nama Kategori'],
      sampleData: [
        ['KAT001', 'Makanan'],
        ['KAT002', 'Minuman'],
        ['KAT003', 'Snack / Gorengan'],
        ['KAT004', 'Paket']
      ]
    },
    User: {
      headers: ['ID User', 'Nama', 'Username', 'Password', 'Role', 'Status', 'Tanggal Dibuat']
    }
  };

  function getSpreadsheet() {
    if (SPREADSHEET_ID) {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  function getSheet(name) {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      const config = SHEETS_CONFIG[name];
      if (config && config.headers) {
        sheet.appendRow(config.headers);
        formatHeaderRow(sheet);
      }
    }
    return sheet;
  }

  function formatHeaderRow(sheet) {
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
    headerRange.setBackground('#f9a8d4');
    headerRange.setFontWeight('bold');
    headerRange.setFontColor('#831843');
  }

  function initialize() {
    const ss = getSpreadsheet();
    
    Object.keys(SHEETS_CONFIG).forEach(sheetName => {
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        Logger.log('Created sheet: ' + sheetName);
      }
      
      const config = SHEETS_CONFIG[sheetName];
      
      // Set headers jika sheet kosong
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(config.headers);
        formatHeaderRow(sheet);
        
        // Insert sample data jika ada
        if (config.sampleData && config.sampleData.length > 0) {
          config.sampleData.forEach(row => sheet.appendRow(row));
        }
      }
      
      // Auto resize kolom
      if (sheet.getLastColumn() > 0) {
        sheet.autoResizeColumns(1, sheet.getLastColumn());
      }
    });
    
    // Buat user default
    const userSheet = ss.getSheetByName('User');
    if (userSheet.getLastRow() <= 1) {
      const now = new Date();
      userSheet.appendRow(['USR001', 'Administrator', 'admin', 'admin123', 'admin', 'aktif', now]);
      userSheet.appendRow(['USR002', 'Kasir Utama', 'kasir', 'kasir123', 'kasir', 'aktif', now]);
    }
    
    Logger.log('Database initialization complete');
  }

  function getAllRows(sheetName) {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    return data.filter(row => row[0] !== '');
  }

  function findRowById(sheetName, id, idColumnIndex = 0) {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColumnIndex]) === String(id)) {
        return { rowIndex: i + 1, data: data[i] };
      }
    }
    return null;
  }

  function appendRow(sheetName, rowData) {
    const sheet = getSheet(sheetName);
    sheet.appendRow(rowData);
  }

  function updateRow(sheetName, rowIndex, rowData) {
    const sheet = getSheet(sheetName);
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  }

  function deleteRow(sheetName, rowIndex) {
    const sheet = getSheet(sheetName);
    sheet.deleteRow(rowIndex);
  }

  function generateId(prefix) {
    const timestamp = new Date().getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return prefix + timestamp + random;
  }

  return { getSpreadsheet, getSheet, getAllRows, findRowById, appendRow, updateRow, deleteRow, generateId, initialize };
})();
