// ============================================================
// KASIR WARUNG - Dashboard.gs
// ============================================================

const Dashboard = (() => {

  function getData(params) {
    try {
      Auth.validateSession(params.token, null);
      const tz = Session.getScriptTimeZone();
      const now = new Date();
      const todayStr = Utilities.formatDate(now, tz, 'yyyyMMdd');

      // Transaksi hari ini
      const trxRows = Database.getAllRows('Transaksi');
      const todayTrx = trxRows.filter(r => {
        if (!r[1]) return false;
        return Utilities.formatDate(new Date(r[1]), tz, 'yyyyMMdd') === todayStr;
      });

      const totalPenjualan = todayTrx.reduce((sum, r) => sum + (parseFloat(r[7]) || 0), 0);
      const jumlahTransaksi = todayTrx.length;

      // Pengeluaran hari ini
      const pengeluaranRows = Database.getAllRows('Pengeluaran');
      const todayPengeluaran = pengeluaranRows.filter(r => {
        if (!r[1]) return false;
        return Utilities.formatDate(new Date(r[1]), tz, 'yyyyMMdd') === todayStr;
      });
      const totalPengeluaran = todayPengeluaran.reduce((sum, r) => sum + (parseFloat(r[4]) || 0), 0);

      // Produk terlaris (hari ini dari detail transaksi)
      const todayTrxIds = new Set(todayTrx.map(r => String(r[0])));
      const detailRows = Database.getAllRows('DetailTransaksi');
      const menuSales = {};
      detailRows.forEach(r => {
        if (todayTrxIds.has(String(r[1]))) {
          const id = r[2];
          const nama = r[3];
          const qty = parseInt(r[4]) || 0;
          if (!menuSales[id]) menuSales[id] = { id, nama, total: 0 };
          menuSales[id].total += qty;
        }
      });
      const produkTerlaris = Object.values(menuSales)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Stok hampir habis
      const menuRows = Database.getAllRows('Menu');
      const stokHampirHabis = menuRows
        .filter(r => parseFloat(r[5]) <= 5 && String(r[8]) === 'aktif')
        .map(r => ({ id: r[0], nama: r[1], stok: r[5], satuan: r[6] }))
        .slice(0, 5);

      // Bahan baku stok kritis
      const bahanRows = Database.getAllRows('BahanBaku');
      const bahanKritis = bahanRows
        .filter(r => parseFloat(r[2]) <= parseFloat(r[5]))
        .map(r => ({ id: r[0], nama: r[1], stok: r[2], minimum: r[5], satuan: r[3] }))
        .slice(0, 5);

      // Grafik penjualan 7 hari terakhir
      const grafik = getLast7DaysSales(trxRows, tz);

      return Utilities.response(true, 'OK', {
        totalPenjualan, jumlahTransaksi, totalPengeluaran,
        labaBersih: totalPenjualan - totalPengeluaran,
        produkTerlaris, stokHampirHabis, bahanKritis, grafik
      });
    } catch (e) {
      return Utilities.response(false, e.message);
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
        .filter(r => r[1] && Utilities.formatDate(new Date(r[1]), tz, 'yyyyMMdd') === dateStr)
        .reduce((sum, r) => sum + (parseFloat(r[7]) || 0), 0);
      
      result.push({ label: labelStr, total });
    }
    return result;
  }

  return { getData };
})();

// ============================================================
// BahanBakuManager
// ============================================================

const BahanBakuManager = (() => {

  function getAll(params) {
    try {
      Auth.validateSession(params.token, null);
      const rows = Database.getAllRows('BahanBaku');
      const data = rows.map(r => ({
        id: r[0], nama: r[1], stok: parseFloat(r[2]) || 0,
        satuan: r[3], hargaBeli: parseFloat(r[4]) || 0,
        minimumStok: parseFloat(r[5]) || 0, supplier: r[6],
        tanggalUpdate: r[7],
        statusKritis: (parseFloat(r[2]) || 0) <= (parseFloat(r[5]) || 0)
      }));
      return Utilities.response(true, 'OK', data);
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function add(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      if (!params.nama) return Utilities.response(false, 'Nama bahan wajib diisi');
      const id = Database.generateId('BHN');
      Database.appendRow('BahanBaku', [
        id, params.nama, parseFloat(params.stok) || 0, params.satuan || 'pcs',
        parseFloat(params.hargaBeli) || 0, parseFloat(params.minimumStok) || 0,
        params.supplier || '', new Date()
      ]);
      return Utilities.response(true, 'Bahan baku ditambahkan', { id });
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function update(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const found = Database.findRowById('BahanBaku', params.id);
      if (!found) return Utilities.response(false, 'Bahan tidak ditemukan');
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
      return Utilities.response(true, 'Bahan baku diupdate');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function remove(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const found = Database.findRowById('BahanBaku', params.id);
      if (!found) return Utilities.response(false, 'Bahan tidak ditemukan');
      Database.deleteRow('BahanBaku', found.rowIndex);
      return Utilities.response(true, 'Bahan baku dihapus');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  return { getAll, add, update, remove };
})();

// ============================================================
// ResepManager
// ============================================================

const ResepManager = (() => {

  function getAll(params) {
    try {
      Auth.validateSession(params.token, null);
      const rows = Database.getAllRows('Resep');
      const menuRows = Database.getAllRows('Menu');
      const bahanRows = Database.getAllRows('BahanBaku');
      const menuMap = {}; menuRows.forEach(r => menuMap[r[0]] = r[1]);
      const bahanMap = {}; bahanRows.forEach(r => bahanMap[r[0]] = { nama: r[1], satuan: r[3] });
      
      let data = rows.map(r => ({
        id: r[0], idMenu: r[1], idBahan: r[2],
        jumlahPemakaian: parseFloat(r[3]) || 0,
        namaMenu: menuMap[r[1]] || '-',
        namaBahan: bahanMap[r[2]] ? bahanMap[r[2]].nama : '-',
        satuanBahan: bahanMap[r[2]] ? bahanMap[r[2]].satuan : ''
      }));
      
      if (params.idMenu) data = data.filter(r => String(r.idMenu) === String(params.idMenu));
      return Utilities.response(true, 'OK', data);
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function save(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const { idMenu, idBahan, jumlahPemakaian } = params;
      if (!idMenu || !idBahan) return Utilities.response(false, 'ID Menu dan Bahan wajib diisi');
      const id = Database.generateId('RSP');
      Database.appendRow('Resep', [id, idMenu, idBahan, parseFloat(jumlahPemakaian) || 0]);
      return Utilities.response(true, 'Resep disimpan', { id });
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function remove(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const found = Database.findRowById('Resep', params.id);
      if (!found) return Utilities.response(false, 'Resep tidak ditemukan');
      Database.deleteRow('Resep', found.rowIndex);
      return Utilities.response(true, 'Resep dihapus');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  return { getAll, save, remove };
})();

// ============================================================
// PengeluaranManager
// ============================================================

const PengeluaranManager = (() => {

  function getAll(params) {
    try {
      Auth.validateSession(params.token, null);
      let rows = Database.getAllRows('Pengeluaran');
      if (params.tanggalMulai || params.tanggalSelesai) {
        rows = rows.filter(r => {
          const tgl = new Date(r[1]);
          const mulai = params.tanggalMulai ? new Date(params.tanggalMulai) : null;
          const selesai = params.tanggalSelesai ? new Date(params.tanggalSelesai + 'T23:59:59') : null;
          if (mulai && tgl < mulai) return false;
          if (selesai && tgl > selesai) return false;
          return true;
        });
      }
      const data = rows.map(r => ({
        id: r[0], tanggal: r[1], kategori: r[2],
        deskripsi: r[3], nominal: parseFloat(r[4]) || 0
      }));
      data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      return Utilities.response(true, 'OK', data);
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function add(params) {
    try {
      Auth.validateSession(params.token, null);
      if (!params.nominal || !params.kategori) return Utilities.response(false, 'Nominal dan kategori wajib');
      const id = Database.generateId('PGL');
      Database.appendRow('Pengeluaran', [
        id, params.tanggal ? new Date(params.tanggal) : new Date(),
        params.kategori, params.deskripsi || '',
        parseFloat(params.nominal) || 0
      ]);
      return Utilities.response(true, 'Pengeluaran ditambahkan', { id });
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function update(params) {
    try {
      Auth.validateSession(params.token, null);
      const found = Database.findRowById('Pengeluaran', params.id);
      if (!found) return Utilities.response(false, 'Pengeluaran tidak ditemukan');
      const row = [
        params.id,
        params.tanggal ? new Date(params.tanggal) : found.data[1],
        params.kategori || found.data[2],
        params.deskripsi || found.data[3],
        parseFloat(params.nominal) || found.data[4]
      ];
      Database.updateRow('Pengeluaran', found.rowIndex, row);
      return Utilities.response(true, 'Pengeluaran diupdate');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function remove(params) {
    try {
      Auth.validateSession(params.token, null);
      const found = Database.findRowById('Pengeluaran', params.id);
      if (!found) return Utilities.response(false, 'Pengeluaran tidak ditemukan');
      Database.deleteRow('Pengeluaran', found.rowIndex);
      return Utilities.response(true, 'Pengeluaran dihapus');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  return { getAll, add, update, remove };
})();

// ============================================================
// SupplierManager
// ============================================================

const SupplierManager = (() => {

  function getAll(params) {
    try {
      Auth.validateSession(params.token, null);
      const rows = Database.getAllRows('Supplier');
      const data = rows.map(r => ({ id: r[0], nama: r[1], nomorHp: r[2], alamat: r[3], catatan: r[4] }));
      return Utilities.response(true, 'OK', data);
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function add(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      if (!params.nama) return Utilities.response(false, 'Nama supplier wajib');
      const id = Database.generateId('SUP');
      Database.appendRow('Supplier', [id, params.nama, params.nomorHp || '', params.alamat || '', params.catatan || '']);
      return Utilities.response(true, 'Supplier ditambahkan', { id });
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function update(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const found = Database.findRowById('Supplier', params.id);
      if (!found) return Utilities.response(false, 'Supplier tidak ditemukan');
      const row = [params.id, params.nama || found.data[1], params.nomorHp || found.data[2], params.alamat || found.data[3], params.catatan || found.data[4]];
      Database.updateRow('Supplier', found.rowIndex, row);
      return Utilities.response(true, 'Supplier diupdate');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function remove(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const found = Database.findRowById('Supplier', params.id);
      if (!found) return Utilities.response(false, 'Supplier tidak ditemukan');
      Database.deleteRow('Supplier', found.rowIndex);
      return Utilities.response(true, 'Supplier dihapus');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  return { getAll, add, update, remove };
})();

// ============================================================
// UserManager
// ============================================================

const UserManager = (() => {

  function getAll(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const rows = Database.getAllRows('User');
      const data = rows.map(r => ({
        id: r[0], nama: r[1], username: r[2],
        role: r[4], status: r[5], tanggalDibuat: r[6]
      }));
      return Utilities.response(true, 'OK', data);
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function add(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      if (!params.nama || !params.username || !params.password) return Utilities.response(false, 'Nama, username, dan password wajib');
      const id = Database.generateId('USR');
      Database.appendRow('User', [id, params.nama, params.username, params.password, params.role || 'kasir', params.status || 'aktif', new Date()]);
      return Utilities.response(true, 'User ditambahkan', { id });
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function update(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      const found = Database.findRowById('User', params.id);
      if (!found) return Utilities.response(false, 'User tidak ditemukan');
      const row = [
        params.id, params.nama || found.data[1], params.username || found.data[2],
        params.password || found.data[3], params.role || found.data[4],
        params.status || found.data[5], found.data[6]
      ];
      Database.updateRow('User', found.rowIndex, row);
      return Utilities.response(true, 'User diupdate');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function remove(params) {
    try {
      const user = Auth.validateSession(params.token, null);
      if (user.role !== 'admin') return Utilities.response(false, 'Akses ditolak');
      if (String(params.id) === String(user.id)) return Utilities.response(false, 'Tidak dapat menghapus akun sendiri');
      const found = Database.findRowById('User', params.id);
      if (!found) return Utilities.response(false, 'User tidak ditemukan');
      Database.deleteRow('User', found.rowIndex);
      return Utilities.response(true, 'User dihapus');
    } catch (e) { return Utilities.response(false, e.message); }
  }

  return { getAll, add, update, remove };
})();

// ============================================================
// LaporanManager
// ============================================================

const LaporanManager = (() => {

  function get(params) {
    try {
      Auth.validateSession(params.token, null);
      const tz = Session.getScriptTimeZone();
      const { periode, tanggalMulai, tanggalSelesai } = params;
      
      let mulai, selesai;
      const now = new Date();
      
      if (periode === 'harian') {
        mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (periode === 'mingguan') {
        const dayOfWeek = now.getDay();
        mulai = new Date(now);
        mulai.setDate(now.getDate() - dayOfWeek);
        mulai.setHours(0, 0, 0, 0);
        selesai = new Date(mulai);
        selesai.setDate(mulai.getDate() + 6);
        selesai.setHours(23, 59, 59);
      } else if (periode === 'bulanan') {
        mulai = new Date(now.getFullYear(), now.getMonth(), 1);
        selesai = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (tanggalMulai && tanggalSelesai) {
        mulai = new Date(tanggalMulai);
        selesai = new Date(tanggalSelesai + 'T23:59:59');
      } else {
        mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }
      
      const trxRows = Database.getAllRows('Transaksi');
      const filtered = trxRows.filter(r => {
        if (!r[1]) return false;
        const d = new Date(r[1]);
        return d >= mulai && d <= selesai;
      });
      
      const totalPenjualan = filtered.reduce((s, r) => s + (parseFloat(r[7]) || 0), 0);
      const totalTransaksi = filtered.length;
      const totalDiskon = filtered.reduce((s, r) => s + (parseFloat(r[6]) || 0), 0);
      
      // Pengeluaran
      const pengeluaranRows = Database.getAllRows('Pengeluaran');
      const filteredPengeluaran = pengeluaranRows.filter(r => {
        if (!r[1]) return false;
        const d = new Date(r[1]);
        return d >= mulai && d <= selesai;
      });
      const totalPengeluaran = filteredPengeluaran.reduce((s, r) => s + (parseFloat(r[4]) || 0), 0);
      
      // Hitung modal dari detail transaksi
      const detailRows = Database.getAllRows('DetailTransaksi');
      const menuRows = Database.getAllRows('Menu');
      const menuMap = {}; menuRows.forEach(r => menuMap[r[0]] = parseFloat(r[4]) || 0);
      const trxIds = new Set(filtered.map(r => String(r[0])));
      
      let totalModal = 0;
      detailRows.forEach(r => {
        if (trxIds.has(String(r[1]))) {
          const modal = (menuMap[r[2]] || 0) * (parseInt(r[4]) || 0);
          totalModal += modal;
        }
      });
      
      const labaKotor = totalPenjualan - totalModal;
      const labaBersih = labaKotor - totalPengeluaran;
      
      // Detail transaksi untuk tabel
      const transaksi = filtered
        .sort((a, b) => new Date(b[1]) - new Date(a[1]))
        .map(r => ({
          id: r[0], tanggal: r[1], nomorInvoice: r[2],
          namaKasir: r[3], totalItem: r[4], subtotal: r[5],
          diskon: r[6], total: r[7], metodePembayaran: r[8]
        }));
      
      // Perbandingan per metode pembayaran
      const metodeSummary = {};
      filtered.forEach(r => {
        const m = r[8] || 'Tunai';
        if (!metodeSummary[m]) metodeSummary[m] = { metode: m, jumlah: 0, total: 0 };
        metodeSummary[m].jumlah++;
        metodeSummary[m].total += parseFloat(r[7]) || 0;
      });
      
      return Utilities.response(true, 'OK', {
        periode: { mulai, selesai },
        totalPenjualan, totalTransaksi, totalDiskon,
        totalPengeluaran, totalModal, labaKotor, labaBersih,
        transaksi, metodeSummary: Object.values(metodeSummary)
      });
    } catch (e) { return Utilities.response(false, e.message); }
  }

  function exportToSheet(params) {
    return Utilities.response(true, 'Export via browser');
  }

  return { get, export: exportToSheet };
})();
