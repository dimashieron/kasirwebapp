// ============================================================
// KASIR WARUNG - Menu.gs
// ============================================================

const MenuManager = (() => {

  const HEADERS = ['ID Menu', 'Nama Menu', 'ID Kategori', 'Harga Jual', 'Harga Modal', 'Stok', 'Satuan', 'Foto', 'Status Aktif', 'Tanggal Dibuat'];

  function rowToMenu(row) {
    return {
      id: row[0],
      nama: row[1],
      idKategori: row[2],
      hargaJual: parseFloat(row[3]) || 0,
      hargaModal: parseFloat(row[4]) || 0,
      stok: parseFloat(row[5]) || 0,
      satuan: row[6],
      foto: row[7],
      statusAktif: row[8],
      tanggalDibuat: row[9]
    };
  }

  function getAll(params) {
    try {
      const rows = Database.getAllRows('Menu');
      const kategoriRows = Database.getAllRows('Kategori');
      
      const kategoriMap = {};
      kategoriRows.forEach(k => { kategoriMap[k[0]] = k[1]; });
      
      let menus = rows.map(row => {
        const m = rowToMenu(row);
        m.namaKategori = kategoriMap[m.idKategori] || '-';
        return m;
      });
      
      // Filter
      if (params && params.search) {
        const q = params.search.toLowerCase();
        menus = menus.filter(m => m.nama.toLowerCase().includes(q));
      }
      if (params && params.kategori) {
        menus = menus.filter(m => m.idKategori === params.kategori);
      }
      if (params && params.aktif) {
        menus = menus.filter(m => m.statusAktif === 'aktif');
      }
      
      return Utils.response(true, 'OK', menus);
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function getById(params) {
    try {
      const found = Database.findRowById('Menu', params.id);
      if (!found) return Utils.response(false, 'Menu tidak ditemukan');
      
      const menu = rowToMenu(found.data);
      return Utils.response(true, 'OK', menu);
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function add(params) {
    try {
      
      if (user.role !== 'admin') return Utils.response(false, 'Akses ditolak');
      
      const { nama, idKategori, hargaJual, hargaModal, stok, satuan, foto, statusAktif } = params;
      if (!nama || !hargaJual) return Utils.response(false, 'Nama dan harga wajib diisi');
      
      const id = Database.generateId('MNU');
      const row = [
        id, nama, idKategori || '', 
        parseFloat(hargaJual) || 0,
        parseFloat(hargaModal) || 0,
        parseFloat(stok) || 0,
        satuan || 'pcs',
        foto || '',
        statusAktif || 'aktif',
        new Date()
      ];
      
      Database.appendRow('Menu', row);
      return Utils.response(true, 'Menu berhasil ditambahkan', { id });
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function update(params) {
    try {
      
      if (user.role !== 'admin') return Utils.response(false, 'Akses ditolak');
      
      const found = Database.findRowById('Menu', params.id);
      if (!found) return Utils.response(false, 'Menu tidak ditemukan');
      
      const row = [
        params.id,
        params.nama || found.data[1],
        params.idKategori || found.data[2],
        parseFloat(params.hargaJual) || found.data[3],
        parseFloat(params.hargaModal) || found.data[4],
        parseFloat(params.stok) !== undefined ? parseFloat(params.stok) : found.data[5],
        params.satuan || found.data[6],
        params.foto !== undefined ? params.foto : found.data[7],
        params.statusAktif || found.data[8],
        found.data[9]
      ];
      
      Database.updateRow('Menu', found.rowIndex, row);
      return Utils.response(true, 'Menu berhasil diupdate');
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function remove(params) {
    try {
      
      if (user.role !== 'admin') return Utils.response(false, 'Akses ditolak');
      
      const found = Database.findRowById('Menu', params.id);
      if (!found) return Utils.response(false, 'Menu tidak ditemukan');
      
      Database.deleteRow('Menu', found.rowIndex);
      return Utils.response(true, 'Menu berhasil dihapus');
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function updateStok(idMenu, jumlah) {
    const found = Database.findRowById('Menu', idMenu);
    if (!found) return;
    
    const stokLama = parseFloat(found.data[5]) || 0;
    const stokBaru = Math.max(0, stokLama - jumlah);
    
    const row = [...found.data];
    row[5] = stokBaru;
    Database.updateRow('Menu', found.rowIndex, row);
  }

  // Kategori
  function getKategori(params) {
    try {
      const rows = Database.getAllRows('Kategori');
      const kategori = rows.map(r => ({ id: r[0], nama: r[1] }));
      return Utils.response(true, 'OK', kategori);
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function addKategori(params) {
    try {
      
      if (user.role !== 'admin') return Utils.response(false, 'Akses ditolak');
      
      if (!params.nama) return Utils.response(false, 'Nama kategori wajib diisi');
      
      const id = Database.generateId('KAT');
      Database.appendRow('Kategori', [id, params.nama]);
      return Utils.response(true, 'Kategori ditambahkan', { id });
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  function deleteKategori(params) {
    try {
      
      if (user.role !== 'admin') return Utils.response(false, 'Akses ditolak');
      
      const found = Database.findRowById('Kategori', params.id);
      if (!found) return Utils.response(false, 'Kategori tidak ditemukan');
      
      Database.deleteRow('Kategori', found.rowIndex);
      return Utils.response(true, 'Kategori dihapus');
    } catch (e) {
      return Utils.response(false, e.message);
    }
  }

  return { getAll, getById, add, update, remove, updateStok, getKategori, addKategori, deleteKategori };
})();
