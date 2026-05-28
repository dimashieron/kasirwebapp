// ============================================================
// KASIR WARUNG - Auth.gs
// ============================================================

const Auth = (() => {

  const SESSION_CACHE_PREFIX = 'session_';
  const SESSION_DURATION = 6 * 60 * 60; // 6 jam dalam detik

  function login(params) {
    const { username, password } = params;
    
    if (!username || !password) {
      return Utils.response(false, 'Username dan password wajib diisi');
    }
    
    const sheet = Database.getSheet('User');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const uname = String(row[2]).trim().toLowerCase();
      const pwd = String(row[3]).trim();
      const status = String(row[5]).trim().toLowerCase();
      
      if (uname === username.toLowerCase() && pwd === password) {
        if (status !== 'aktif') {
          return Utils.response(false, 'Akun tidak aktif. Hubungi Admin.');
        }
        
        const user = {
          id: row[0],
          nama: row[1],
          username: row[2],
          role: row[4]
        };
        
        const token = generateToken(user.id);
        saveSession(token, user);
        
        return Utils.response(true, 'Login berhasil', { token, user });
      }
    }
    
    return Utils.response(false, 'Username atau password salah');
  }

  function logout(params) {
    const { token } = params;
    if (token) {
      const cache = CacheService.getScriptCache();
      cache.remove(SESSION_CACHE_PREFIX + token);
    }
    return Utils.response(true, 'Logout berhasil');
  }

  function checkSession(params) {
    const { token } = params;
    if (!token) return Utils.response(false, 'Tidak ada sesi');
    
    const user = getSession(token);
    if (!user) return Utils.response(false, 'Sesi tidak valid atau sudah habis');
    
    // Perpanjang sesi
    saveSession(token, user);
    return Utils.response(true, 'Sesi valid', { user });
  }

  function changePassword(params) {
    const { token, oldPassword, newPassword } = params;
    const user = getSession(token);
    if (!user) return Utils.response(false, 'Tidak terautentikasi');
    
    const sheet = Database.getSheet('User');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(user.id)) {
        if (String(data[i][3]) !== oldPassword) {
          return Utils.response(false, 'Password lama salah');
        }
        sheet.getRange(i + 1, 4).setValue(newPassword);
        return Utils.response(true, 'Password berhasil diubah');
      }
    }
    return Utils.response(false, 'User tidak ditemukan');
  }

  function generateToken(userId) {
    return Utilities.getUuid() + '_' + userId + '_' + new Date().getTime();
  }

  function saveSession(token, user) {
    const cache = CacheService.getScriptCache();
    cache.put(SESSION_CACHE_PREFIX + token, JSON.stringify(user), SESSION_DURATION);
  }

  function getSession(token) {
    try {
      const cache = CacheService.getScriptCache();
      const data = cache.get(SESSION_CACHE_PREFIX + token);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function validateSession(token, requiredRole) {
    const user = getSession(token);
    if (!user) throw new Error('Sesi tidak valid. Silakan login ulang.');
    if (requiredRole && user.role !== 'admin' && user.role !== requiredRole) {
      throw new Error('Akses ditolak. Hak akses tidak cukup.');
    }
    return user;
  }

  function createDefaultUsers() {
    const sheet = Database.getSheet('User');
    const data = sheet.getDataRange().getValues();
    
    // Cek apakah sudah ada user
    if (data.length > 1) {
      Logger.log('Users already exist, skipping default user creation');
      return;
    }
    
    const now = new Date();
    const users = [
      ['USR001', 'Administrator', 'admin', 'admin123', 'admin', 'aktif', now],
      ['USR002', 'Kasir Utama', 'kasir', 'kasir123', 'kasir', 'aktif', now]
    ];
    
    users.forEach(u => sheet.appendRow(u));
    Logger.log('Default users created: admin/admin123, kasir/kasir123');
  }

  return { login, logout, checkSession, changePassword, getSession, validateSession, createDefaultUsers };
})();
