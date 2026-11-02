export function getTroubleshootingTip(err: unknown, type: 'mysql' | 'postgres', host: string, port: number): string {
  const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const errCode = (err as { code?: string })?.code || '';

  if (errMsg.includes('econnrefused') || errCode === 'ECONNREFUSED') {
    return `Koneksi ditolak pada ${host}:${port}. Pastikan:
1. Layanan server database sedang berjalan.
2. Port ${port} dibuka pada firewall (UFW, iptables, Security Group cloud).
3. Untuk MySQL/MariaDB: Pastikan 'bind-address = 0.0.0.0' di /etc/mysql/my.cnf (bukan 127.0.0.1).
4. Untuk PostgreSQL: Pastikan 'listen_addresses = \\'*\\'' di postgresql.conf.`;
  }

  if (errMsg.includes('etimedout') || errMsg.includes('timeout') || errCode === 'ETIMEDOUT') {
    return `Koneksi time out saat menghubungkan ke ${host}:${port}.
Kemungkinan besar port diblokir oleh firewall host, router ISP, atau cloud security group (AWS, GCP, DigitalOcean).`;
  }

  if (errMsg.includes('enotfound') || errCode === 'ENOTFOUND') {
    return `Hostname '${host}' tidak dapat diselesaikan oleh DNS. Periksa kembali ejaan domain atau IP address.`;
  }

  if (
    errMsg.includes('access denied') ||
    errMsg.includes('password authentication failed') ||
    errCode === 'ER_ACCESS_DENIED_ERROR' ||
    errCode === '28P01' ||
    errCode === '28000'
  ) {
    if (type === 'mysql') {
      return `Autentikasi gagal (Username atau Password salah, atau user tidak memiliki izin akses remote).
Periksa izin remote: GRANT ALL PRIVILEGES ON *.* TO 'username'@'%' IDENTIFIED BY 'password'; FLUSH PRIVILEGES;`;
    } else {
      return `Autentikasi PostgreSQL gagal.
Periksa konfigurasi file 'pg_hba.conf' di server PostgreSQL untuk mengizinkan akses host remote dengan metode 'scram-sha-256' atau 'md5'.`;
    }
  }

  if (errMsg.includes('database') && (errMsg.includes('does not exist') || errMsg.includes('unknown database'))) {
    return `Nama database yang ditentukan tidak ditemukan di server. Coba kosongkan nama database atau buat database terlebih dahulu.`;
  }

  if (errMsg.includes('self-signed certificate') || errMsg.includes('ssl')) {
    return `Terjadi kendala SSL/TLS. Jika server menggunakan sertifikat self-signed, aktifkan opsi 'Allow Self-Signed / Insecure SSL' di konfigurasi koneksi.`;
  }

  return `Periksa kembali kredensial, konektivitas jaringan ke remote host, serta log error server database.`;
}

