export function getWIB() {
  const now = new Date();
  
  // Vercel (Production) menggunakan UTC, Localhost menggunakan waktu lokal komputer
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Tambah 7 jam untuk konversi UTC ke WIB
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
  }
  
  return now;
}

// Tambahan: Helper untuk format tanggal ala Indonesia
export function formatToWIB(date, formatStr = 'dd/MM/yyyy HH:mm') {
  // Jika inputnya string dari DB, kita bungkus dulu jadi Date object
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Import format dari date-fns secara dinamis atau pastikan sudah terinstall
  const { format } = require('date-fns');
  const { id } = require('date-fns/locale');

  return format(d, formatStr, { locale: id });
}