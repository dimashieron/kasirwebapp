// ============================================================
// KASIR WARUNG - Dashboard.gs
// ============================================================

const Dashboard = (() => {

  function getData() {
    try {
      const tz = Session.getScriptTimeZone();
      const now = new Date();
      const todayStr = Utilities.formatDate(now, tz, 'yyyyMMdd');

      const trxRows = Database.getAllRows('Transaksi');
      const todayTrx = trxRows.filter(function(r) {
        if (!r[1]) return false;
        return Utilities.formatDate(new Date(r[1]), tz, 'yyyyMMdd') === todayStr;
      });

      const totalPenjualan = todayTrx.reduce(function(s, r) {
        return s + (parseFloat(r[7]) || 0);
      }, 0);
      const jumlahTransaksi = todayTrx.length;

      const pengeluaranRows = Database.getAllRows('Pengeluaran');
      const todayPengeluaran = pengeluaranRows.filter(function(r) {
        if (!r[1]) return false;
        return Utilities.formatDate(new Date(r[1]), tz, 'yyyyMMdd') === todayStr;
      });
      const totalPengeluaran = todayPengeluaran.reduce(function(s, r) {
        return s + (parseFloat(r[4]) || 0);
      }, 0);

      const todayTrxIds = {};
      todayTrx.forEach(function(r) { todayTrxIds[String(r[0])] = true; });

      const detailRows = Database.getAllRows('DetailTransaksi');
      const menuSales = {};
      detailRows.forEach(function(r) {
        if (todayTrxIds[String(r[1])]) {
          const id = r[2];
          const nama = r[3];
          const qty = parseInt(r[4]) || 0;
          if (!menuSales[id]) menuSales[id] = { id: id, nama: nama, total: 0 };
          menuSales[id].total += qty;
        }
      });
      const produkTerlaris = Object.values(menuSales)
        .sort(function(a, b) { return b.total - a.total; })
        .slice(0, 5);

      const menuRows = Database.getAllRows('Menu');
      const stokHampirHabis = menuRows
        .filter(function(r) { return parseFloat(r[5]) <= 5 && String(r[8]) === 'aktif'; })
        .map(function(r) { return { id: r[0], nama: r[1], stok: r[5], satuan: r[6] }; })
        .slice(0, 5);

      const bahanRows = Database.getAllRows('BahanBaku');
      const bahanKritis = bahanRows
        .filter(function(r) { return parseFloat(r[2]) <= parseFloat(r[5]); })
        .map(function(r) { return { id: r[0], nama: r[1], stok: r[2], minimum: r[5], satuan: r[3] }; })
        .slice(0, 5);

      const grafik = getLast7DaysSales(trxRows, tz);

      return Utils.response(true, 'OK', {
        totalPenjualan: totalPenjualan,
        jumlahTransaksi: jumlahTransaksi,
        totalPengeluaran: totalPengeluaran,
        labaBersih: totalPenjualan - totalPengeluaran,
        produkTerlaris: produkTerlaris,
        stokHampirHabis: stokHampirHabis,
        bahanKritis: bahanKritis,
        grafik: grafik
      });
    } catch(e) {
      return Utils.response(false, e.message);
    }
  }

  function getLast7DaysSales(trxRows, tz) {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = Utilities.formatDate(d, tz, 'yyyyMMdd');
      const labelStr = Utilities.formatDate(d, tz, 'dd/MM');
      const total = trxRows
        .filter(function(r) {
          if (!r[1]) return false;
          return Utilities.formatDate(new Date(r[1]), tz, 'yyyyMMdd') === dateStr;
        })
        .reduce(function(s, r) {
          return s + (parseFloat(r[7]) || 0);
        }, 0);
      result.push({ label: labelStr, total: total });
    }
    return result;
  }

  return { getData: getData };
})();


// ============================================================
// BahanBakuManager
// ============================================================

const BahanBakuManager = (() => {

  function getAll() {
    try {
      const rows = Database.getAllRows('BahanBaku');
      const data = rows.map(function(r) {
        return {
          id: r[0], nama: r[1],
          stok: parseFloat(r[2]) || 0,
          satuan: r[3],
          hargaBeli: parseFloat(r[4]) || 0,
          minimumStok: parseFloat(r[5]) || 0,
          supplier: r[6],
          tanggalUpdate: r[7],
          statusKritis: (parseFloat(r[2]) || 0) <= (parseFloat(r[5]) || 0)
        };
      });
      return Utils.response(true, 'OK', data);
    } catch(e) { return Utils.response(false, e.message); }
  }

  function add(params) {
    try {
      if (!params.nama) return Utils.response(false, 'Nama bahan wajib');
      const id = Database.generateId('BHN');
      Database.appendRow('BahanBaku', [
        id, params.nama,
        parseFloat(params.stok) || 0,
        params.satuan || 'pcs',
        parseFloat(params.hargaBeli) || 0,
        parseFloat(params.minimumStok) || 0,
        params.supplier || '',
        new Date()
      ]);
      return Utils.response(true, 'Bahan baku ditambahkan', { id: id });
    } catch(e) { return Utils.response(false, e.message); }
  }

  function update(params) {
    try {
      const found = Database.findRowById('BahanBaku', params.id);
      if (!found) return Utils.response(false, 'Bahan tidak ditemukan');
      const row = [
        params.id,
        params.nama || found.data[1],
        parseFloat(params.stok) !== undefined ? parseFloat(params.stok) : found.data[2],
        params.satuan || found.data[3],
        parseFloat(params.hargaBeli) || found.data[4],
        parseFloat(params.minimumStok) !== undefined ? parseFloat(params.minimumStok) : found.data[5],
        params.supplier || found.data[6],
        new Date()
      ];
      Database.updateRow('BahanBaku', found.rowIndex, row);
      return Utils.response(true, 'Bahan baku diupdate');
    } catch(e) { return Utils.response(false, e.message); }
  }

  function remove(params) {
    try {
      const found = Database.findRowById('BahanBaku', params.id);
      if (!found) return Utils.response(false, 'Bahan tidak ditemukan');
      Database.deleteRow('BahanBaku', found.rowIndex);
      return Utils.response(true, 'Bahan baku dihapus');
    } catch(e) { return Utils.response(false, e.message); }
  }

  return { getAll: getAll, add: add, update: update, remove: remove };
})();


// ============================================================
// ResepManager
// ============================================================

const ResepManager = (() => {

  function getAll(params) {
    try {
      const rows = Database.getAllRows('Resep');
      const menuRows = Database.getAllRows('Menu');
      const bahanRows = Database.getAllRows('BahanBaku');
      const menuMap = {};
      menuRows.forEach(function(r) { menuMap[r[0]] = r[1]; });
      const bahanMap = {};
      bahanRows.forEach(function(r) { bahanMap[r[0]] = { nama: r[1], satuan: r[3] }; });

      let data = rows.map(function(r) {
        return {
          id: r[0], idMenu: r[1], idBahan: r[2],
          jumlahPemakaian: parseFloat(r[3]) || 0,
          namaMenu: menuMap[r[1]] || '-',
          namaBahan: bahanMap[r[2]] ? bahanMap[r[2]].nama : '-',
          satuanBahan: bahanMap[r[2]] ? bahanMap[r[2]].satuan : ''
        };
      });

      if (params && params.idMenu) {
        data = data.filter(function(r) { return String(r.idMenu) === String(params.idMenu); });
      }
      return Utils.response(true, 'OK', data);
    } catch(e) { return Utils.response(false, e.message); }
  }

  function save(params) {
    try {
      if (!params.idMenu || !params.idBahan) return Utils.response(false, 'ID Menu dan Bahan wajib');
      const id = Database.generateId('RSP');
      Database.appendRow('Resep', [id, params.idMenu, params.idBahan, parseFloat(params.jumlahPemakaian) || 0]);
      return Utils.response(true, 'Resep disimpan', { id: id });
    } catch(e) { return Utils.response(false, e.message); }
  }

  function remove(params) {
    try {
      const found = Database.findRowById('Resep', params.id);
      if (!found) return Utils.response(false, 'Resep tidak ditemukan');
      Database.deleteRow('Resep', found.rowIndex);
      return Utils.response(true, 'Resep dihapus');
    } catch(e) { return Utils.response(false, e.message); }
  }

  return { getAll: getAll, save: save, remove: remove };
})();


// ============================================================
// PengeluaranManager
// ============================================================

const PengeluaranManager = (() => {

  function getAll(params) {
    try {
      let rows = Database.getAllRows('Pengeluaran');
      if (params && (params.tanggalMulai || params.tanggalSelesai)) {
        rows = rows.filter(function(r) {
          if (!r[1]) return false;
          const tgl = new Date(r[1]);
          const mulai = params.tanggalMulai ? new Date(params.tanggalMulai) : null;
          const selesai = params.tanggalSelesai ? new Date(params.tanggalSelesai + 'T23:59:59') : null;
          if (mulai && tgl < mulai) return false;
          if (selesai && tgl > selesai) return false;
          return true;
        });
      }
      const data = rows.map(function(r) {
        return { id: r[0], tanggal: r[1], kategori: r[2], deskripsi: r[3], nominal: parseFloat(r[4]) || 0 };
      });
      data.sort(function(a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
      return Utils.response(true, 'OK', data);
    } catch(e) { return Utils.response(false, e.message); }
  }

  function add(params) {
    try {
      if (!params.nominal || !params.kategori) return Utils.response(false, 'Nominal dan kategori wajib');
      const id = Database.generateId('PGL');
      Database.appendRow('Pengeluaran', [
        id,
        params.tanggal ? new Date(params.tanggal) : new Date(),
        params.kategori,
        params.deskripsi || '',
        parseFloat(params.nominal) || 0
      ]);
      return Utils.response(true, 'Pengeluaran ditambahkan', { id: id });
    } catch(e) { return Utils.response(false, e.message); }
  }

  function update(params) {
    try {
      const found = Database.findRowById('Pengeluaran', params.id);
      if (!found) return Utils.response(false, 'Tidak ditemukan');
      const row = [
        params.id,
        params.tanggal ? new Date(params.tanggal) : found.data[1],
        params.kategori || found.data[2],
        params.deskripsi || found.data[3],
        parseFloat(params.nominal) || found.data[4]
      ];
      Database.updateRow('Pengeluaran', found.rowIndex, row);
      return Utils.response(true, 'Pengeluaran diupdate');
    } catch(e) { return Utils.response(false, e.message); }
  }

  function remove(params) {
    try {
      const found = Database.findRowById('Pengeluaran', params.id);
      if (!found) return Utils.response(false, 'Tidak ditemukan');
      Database.deleteRow('Pengeluaran', found.rowIndex);
      return Utils.response(true, 'Pengeluaran dihapus');
    } catch(e) { return Utils.response(false, e.message); }
  }

  return { getAll: getAll, add: add, update: update, remove: remove };
})();


// ============================================================
// SupplierManager
// ============================================================

const SupplierManager = (() => {

  function getAll() {
    try {
      const rows = Database.getAllRows('Supplier');
      const data = rows.map(function(r) {
        return { id: r[0], nama: r[1], nomorHp: r[2], alamat: r[3], catatan: r[4] };
      });
      return Utils.response(true, 'OK', data);
    } catch(e) { return Utils.response(false, e.message); }
  }

  function add(params) {
    try {
      if (!params.nama) return Utils.response(false, 'Nama supplier wajib');
      const id = Database.generateId('SUP');
      Database.appendRow('Supplier', [id, params.nama, params.nomorHp || '', params.alamat || '', params.catatan || '']);
      return Utils.response(true, 'Supplier ditambahkan', { id: id });
    } catch(e) { return Utils.response(false, e.message); }
  }

  function update(params) {
    try {
      const found = Database.findRowById('Supplier', params.id);
      if (!found) return Utils.response(false, 'Tidak ditemukan');
      Database.updateRow('Supplier', found.rowIndex, [
        params.id,
        params.nama || found.data[1],
        params.nomorHp || found.data[2],
        params.alamat || found.data[3],
        params.catatan || found.data[4]
      ]);
      return Utils.response(true, 'Supplier diupdate');
    } catch(e) { return Utils.response(false, e.message); }
  }

  function remove(params) {
    try {
      const found = Database.findRowById('Supplier', params.id);
      if (!found) return Utils.response(false, 'Tidak ditemukan');
      Database.deleteRow('Supplier', found.rowIndex);
      return Utils.response(true, 'Supplier dihapus');
    } catch(e) { return Utils.response(false, e.message); }
  }

  return { getAll: getAll, add: add, update: update, remove: remove };
})();


// ============================================================
// LaporanManager
// ============================================================

const LaporanManager = (() => {

  function get(params) {
    try {
      const tz = Session.getScriptTimeZone();
      const now = new Date();
      const periode = params.periode || 'harian';
      let mulai, selesai;

      if (periode === 'harian') {
        mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (periode === 'mingguan') {
        const day = now.getDay();
        mulai = new Date(now);
        mulai.setDate(now.getDate() - day);
        mulai.setHours(0, 0, 0, 0);
        selesai = new Date(mulai);
        selesai.setDate(mulai.getDate() + 6);
        selesai.setHours(23, 59, 59);
      } else if (periode === 'bulanan') {
        mulai = new Date(now.getFullYear(), now.getMonth(), 1);
        selesai = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else {
        mulai = params.tanggalMulai ? new Date(params.tanggalMulai) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        selesai = params.tanggalSelesai ? new Date(params.tanggalSelesai + 'T23:59:59') : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }

      const trxRows = Database.getAllRows('Transaksi');
      const filtered = trxRows.filter(function(r) {
        if (!r[1]) return false;
        const d = new Date(r[1]);
        return d >= mulai && d <= selesai;
      });

      const totalPenjualan = filtered.reduce(function(s, r) { return s + (parseFloat(r[7]) || 0); }, 0);
      const totalDiskon = filtered.reduce(function(s, r) { return s + (parseFloat(r[6]) || 0); }, 0);

      const pengeluaranRows = Database.getAllRows('Pengeluaran');
      const filteredPengeluaran = pengeluaranRows.filter(function(r) {
        if (!r[1]) return false;
        const d = new Date(r[1]);
        return d >= mulai && d <= selesai;
      });
      const totalPengeluaran = filteredPengeluaran.reduce(function(s, r) { return s + (parseFloat(r[4]) || 0); }, 0);

      const detailRows = Database.getAllRows('DetailTransaksi');
      const menuRows = Database.getAllRows('Menu');
      const menuMap = {};
      menuRows.forEach(function(r) { menuMap[r[0]] = parseFloat(r[4]) || 0; });
      const trxIds = {};
      filtered.forEach(function(r) { trxIds[String(r[0])] = true; });

      let totalModal = 0;
      detailRows.forEach(function(r) {
        if (trxIds[String(r[1])]) {
          totalModal += (menuMap[r[2]] || 0) * (parseInt(r[4]) || 0);
        }
      });

      const labaKotor = totalPenjualan - totalModal;
      const labaBersih = labaKotor - totalPengeluaran;

      const transaksi = filtered
        .sort(function(a, b) { return new Date(b[1]) - new Date(a[1]); })
        .map(function(r) {
          return {
            id: r[0], tanggal: r[1], nomorInvoice: r[2],
            namaKasir: r[3], totalItem: r[4], subtotal: r[5],
            diskon: r[6], total: r[7], metodePembayaran: r[8]
          };
        });

      const metodeSummary = {};
      filtered.forEach(function(r) {
        const m = r[8] || 'Tunai';
        if (!metodeSummary[m]) metodeSummary[m] = { metode: m, jumlah: 0, total: 0 };
        metodeSummary[m].jumlah++;
        metodeSummary[m].total += parseFloat(r[7]) || 0;
      });

      return Utils.response(true, 'OK', {
        totalPenjualan: totalPenjualan,
        totalTransaksi: filtered.length,
        totalDiskon: totalDiskon,
        totalPengeluaran: totalPengeluaran,
        totalModal: totalModal,
        labaKotor: labaKotor,
        labaBersih: labaBersih,
        transaksi: transaksi,
        metodeSummary: Object.values(metodeSummary)
      });
    } catch(e) { return Utils.response(false, e.message); }
  }

  return { get: get };
})();
