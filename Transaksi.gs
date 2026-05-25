// ============================================================
// KASIR WARUNG - Transaksi.gs
// ============================================================

const TransaksiManager = (() => {

  function save(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      const { items, diskon, metodePembayaran, catatan } = params;
      
      if (!items || items.length === 0) {
        return Utilities.response(false, 'Keranjang kosong');
      }
      
      const idTransaksi = Database.generateId('TRX');
      const nomorInvoice = generateInvoiceNumber();
      const tanggal = new Date();
      
      let subtotal = 0;
      let totalItem = 0;
      
      items.forEach(item => {
        subtotal += (parseFloat(item.harga) || 0) * (parseInt(item.jumlah) || 0);
        totalItem += parseInt(item.jumlah) || 0;
      });
      
      const diskonNominal = parseFloat(diskon) || 0;
      const total = subtotal - diskonNominal;
      
      // Simpan transaksi
      Database.appendRow('Transaksi', [
        idTransaksi, tanggal, nomorInvoice,
        user.nama, totalItem, subtotal, diskonNominal,
        total, metodePembayaran || 'Tunai', catatan || ''
      ]);
      
      // Simpan detail transaksi & update stok
      items.forEach(item => {
        const idDetail = Database.generateId('DTL');
        const itemSubtotal = (parseFloat(item.harga) || 0) * (parseInt(item.jumlah) || 0);
        
        Database.appendRow('DetailTransaksi', [
          idDetail, idTransaksi, item.id,
          item.nama, parseInt(item.jumlah) || 1,
          parseFloat(item.harga) || 0, itemSubtotal
        ]);
        
        // Update stok menu
        MenuManager.updateStok(item.id, parseInt(item.jumlah) || 1);
        
        // Update stok bahan baku via resep
        updateStokBahanBaku(item.id, parseInt(item.jumlah) || 1);
      });
      
      return Utilities.response(true, 'Transaksi berhasil disimpan', {
        idTransaksi,
        nomorInvoice,
        total,
        tanggal
      });
    } catch (e) {
      return Utilities.response(false, e.message);
    }
  }

  function getAll(params) {
    try {
      Auth.validateSession(params.token, null);
      
      let rows = Database.getAllRows('Transaksi');
      
      // Filter tanggal
      if (params.tanggalMulai || params.tanggalSelesai) {
        rows = rows.filter(row => {
          const tgl = new Date(row[1]);
          const mulai = params.tanggalMulai ? new Date(params.tanggalMulai) : null;
          const selesai = params.tanggalSelesai ? new Date(params.tanggalSelesai + 'T23:59:59') : null;
          if (mulai && tgl < mulai) return false;
          if (selesai && tgl > selesai) return false;
          return true;
        });
      }
      
      // Filter hari ini
      if (params.today) {
        rows = rows.filter(row => Utilities.isToday(row[1]));
      }
      
      const transaksi = rows.map(row => ({
        id: row[0],
        tanggal: row[1],
        nomorInvoice: row[2],
        namaKasir: row[3],
        totalItem: row[4],
        subtotal: row[5],
        diskon: row[6],
        total: row[7],
        metodePembayaran: row[8],
        catatan: row[9]
      }));
      
      // Sort terbaru dulu
      transaksi.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      
      // Pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 20;
      const total = transaksi.length;
      const start = (page - 1) * limit;
      const paged = transaksi.slice(start, start + limit);
      
      return Utilities.response(true, 'OK', { rows: paged, total, page, limit });
    } catch (e) {
      return Utilities.response(false, e.message);
    }
  }

  function getById(params) {
    try {
      Auth.validateSession(params.token, null);
      
      const found = Database.findRowById('Transaksi', params.id);
      if (!found) return Utilities.response(false, 'Transaksi tidak ditemukan');
      
      const trx = {
        id: found.data[0],
        tanggal: found.data[1],
        nomorInvoice: found.data[2],
        namaKasir: found.data[3],
        totalItem: found.data[4],
        subtotal: found.data[5],
        diskon: found.data[6],
        total: found.data[7],
        metodePembayaran: found.data[8],
        catatan: found.data[9]
      };
      
      // Get detail items
      const detailRows = Database.getAllRows('DetailTransaksi');
      trx.items = detailRows
        .filter(r => String(r[1]) === String(params.id))
        .map(r => ({
          idDetail: r[0],
          idTransaksi: r[1],
          idMenu: r[2],
          namaMenu: r[3],
          jumlah: r[4],
          harga: r[5],
          subtotal: r[6]
        }));
      
      return Utilities.response(true, 'OK', trx);
    } catch (e) {
      return Utilities.response(false, e.message);
    }
  }

  function remove(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      
      const found = Database.findRowById('Transaksi', params.id);
      if (!found) return Utilities.response(false, 'Transaksi tidak ditemukan');
      
      Database.deleteRow('Transaksi', found.rowIndex);
      
      // Hapus detail transaksi
      const detailSheet = Database.getSheet('DetailTransaksi');
      const detailData = detailSheet.getDataRange().getValues();
      const toDelete = [];
      for (let i = 1; i < detailData.length; i++) {
        if (String(detailData[i][1]) === String(params.id)) {
          toDelete.push(i + 1);
        }
      }
      toDelete.reverse().forEach(r => detailSheet.deleteRow(r));
      
      return Utilities.response(true, 'Transaksi berhasil dihapus');
    } catch (e) {
      return Utilities.response(false, e.message);
    }
  }

  function getNextInvoice(params) {
    try {
      const no = generateInvoiceNumber();
      return Utilities.response(true, 'OK', { nomorInvoice: no });
    } catch (e) {
      return Utilities.response(false, e.message);
    }
  }

  function generateInvoiceNumber() {
    const now = new Date();
    const tz = Session.getScriptTimeZone();
    const dateStr = Utilities.formatDate(now, tz, 'yyyyMMdd');
    const rows = Database.getAllRows('Transaksi');
    const todayTrx = rows.filter(r => {
      const d = new Date(r[1]);
      return Utilities.formatDate(d, tz, 'yyyyMMdd') === dateStr;
    });
    const seq = String(todayTrx.length + 1).padStart(3, '0');
    return 'INV' + dateStr + seq;
  }

  function updateStokBahanBaku(idMenu, jumlahMenu) {
    try {
      const resepRows = Database.getAllRows('Resep');
      const resepMenu = resepRows.filter(r => String(r[1]) === String(idMenu));
      
      resepMenu.forEach(resep => {
        const idBahan = resep[2];
        const jumlahPemakaian = (parseFloat(resep[3]) || 0) * jumlahMenu;
        
        const found = Database.findRowById('BahanBaku', idBahan);
        if (found) {
          const stokLama = parseFloat(found.data[2]) || 0;
          const stokBaru = Math.max(0, stokLama - jumlahPemakaian);
          const row = [...found.data];
          row[2] = stokBaru;
          row[7] = new Date();
          Database.updateRow('BahanBaku', found.rowIndex, row);
        }
      });
    } catch (e) {
      console.error('updateStokBahanBaku error:', e);
    }
  }

  return { save, getAll, getById, remove, getNextInvoice };
})();
