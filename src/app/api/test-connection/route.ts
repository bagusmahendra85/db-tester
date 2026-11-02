import { NextRequest, NextResponse } from 'next/server';
import { ConnectionConfig } from '@/lib/types';
import { testMySQLConnection } from '@/lib/mysql-service';
import { testPostgresConnection } from '@/lib/postgres-service';

export async function POST(req: NextRequest) {
  try {
    const config: ConnectionConfig = await req.json();

    if (!config.host || !config.port || !config.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parameter wajib belum lengkap: Host, Port, dan User harus diisi.',
        },
        { status: 400 }
      );
    }

    if (config.type === 'mysql') {
      const result = await testMySQLConnection(config);
      return NextResponse.json(result);
    } else if (config.type === 'postgres') {
      const result = await testPostgresConnection(config);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: `Tipe database tidak didukung: ${config.type}` },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error saat menguji koneksi.',
        error: { message: errorMsg },
      },
      { status: 500 }
    );
  }
}
