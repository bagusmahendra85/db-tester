import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DB Server Tester | MariaDB, MySQL & PostgreSQL',
  description: 'Aplikasi penguji dan diagnostik koneksi remote database MariaDB, MySQL, dan PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
