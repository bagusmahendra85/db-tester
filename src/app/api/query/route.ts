import { NextRequest, NextResponse } from 'next/server';
import { QueryExecuteRequest } from '@/lib/types';
import { executeMySQLQuery } from '@/lib/mysql-service';
import { executePostgresQuery } from '@/lib/postgres-service';

export async function POST(req: NextRequest) {
  try {
    const { config, sql, maxRows }: QueryExecuteRequest = await req.json();

    if (!sql || !sql.trim()) {
      return NextResponse.json({ success: false, error: 'Query SQL tidak boleh kosong.' }, { status: 400 });
    }

    if (!config?.host || !config?.port || !config?.user) {
      return NextResponse.json(
        { success: false, error: 'Konfigurasi koneksi belum lengkap.' },
        { status: 400 }
      );
    }

    if (config.type === 'mysql') {
      const result = await executeMySQLQuery(config, sql, maxRows || 100);
      return NextResponse.json(result);
    } else if (config.type === 'postgres') {
      const result = await executePostgresQuery(config, sql, maxRows || 100);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: `Tipe database tidak didukung: ${config.type}` },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        executionTimeMs: 0,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
