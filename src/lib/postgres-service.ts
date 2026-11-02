import { Client, FieldDef } from 'pg';
import { ConnectionConfig, ConnectionTestResponse, QueryExecuteResponse } from './types';
import { getTroubleshootingTip } from './troubleshooting';

export async function testPostgresConnection(config: ConnectionConfig): Promise<ConnectionTestResponse> {
  const timeoutMs = config.timeoutMs || 5000;
  const startConnect = performance.now();

  const sslOption = config.ssl
    ? {
        rejectUnauthorized: config.rejectUnauthorized ?? false,
      }
    : false;

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password || '',
    database: config.database || 'postgres',
    ssl: sslOption,
    connectionTimeoutMillis: timeoutMs,
  });

  try {
    await client.connect();
    const connectEnd = performance.now();
    const connectTimeMs = Math.round(connectEnd - startConnect);

    // Query Ping & Server Info
    const pingStart = performance.now();
    const versionRes = await client.query('SELECT version()');
    const pingEnd = performance.now();
    const queryPingMs = Math.round(pingEnd - pingStart);

    const rawVersion = versionRes.rows[0]?.version || 'PostgreSQL';

    // Fetch server status & variables
    let uptime: string | undefined;
    let maxConnections: number | undefined;
    let currentConnections: number | undefined;
    let charset: string | undefined;
    const systemVariables: Record<string, string> = {};

    try {
      const maxConnRes = await client.query('SHOW max_connections');
      if (maxConnRes.rows[0]?.max_connections) {
        maxConnections = parseInt(String(maxConnRes.rows[0].max_connections), 10);
        systemVariables['max_connections'] = String(maxConnRes.rows[0].max_connections);
      }

      const encRes = await client.query('SHOW server_encoding');
      if (encRes.rows[0]?.server_encoding) {
        charset = String(encRes.rows[0].server_encoding);
        systemVariables['server_encoding'] = charset;
      }

      const uptimeRes = await client.query(
        "SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) AS uptime"
      );
      if (uptimeRes.rows[0]?.uptime) {
        const u = uptimeRes.rows[0].uptime;
        uptime = typeof u === 'object' ? JSON.stringify(u) : String(u);
      }

      const activeConnRes = await client.query('SELECT count(*)::int AS count FROM pg_stat_activity');
      if (activeConnRes.rows[0]?.count) {
        currentConnections = parseInt(String(activeConnRes.rows[0].count), 10);
      }
    } catch {
      // Ignore if user lacks permissions
    }

    // List databases
    const databases: string[] = [];
    try {
      const dbRes = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname');
      for (const row of dbRes.rows) {
        if (row.datname) databases.push(String(row.datname));
      }
    } catch {
      // Ignore
    }

    const totalTimeMs = Math.round(performance.now() - startConnect);

    return {
      success: true,
      message: `Berhasil terhubung ke PostgreSQL server!`,
      timing: {
        tcpConnectMs: Math.max(1, Math.round(connectTimeMs / 2)),
        authHandshakeMs: Math.max(1, Math.round(connectTimeMs / 2)),
        queryPingMs,
        totalMs: totalTimeMs,
      },
      server: {
        version: rawVersion,
        engine: 'PostgreSQL',
        uptime,
        charset,
        maxConnections,
        currentConnections,
        databases,
        systemVariables,
      },
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; detail?: string; hint?: string };
    return {
      success: false,
      message: errorObj.message || 'Gagal terhubung ke remote PostgreSQL server.',
      error: {
        code: errorObj.code,
        message: errorObj.message || String(err),
        detail: errorObj.detail,
        hint: errorObj.hint,
        troubleshootingTip: getTroubleshootingTip(err, 'postgres', config.host, config.port),
      },
    };
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

export async function executePostgresQuery(
  config: ConnectionConfig,
  sql: string,
  maxRows = 100
): Promise<QueryExecuteResponse> {
  const timeoutMs = config.timeoutMs || 10000;
  const start = performance.now();

  const sslOption = config.ssl
    ? {
        rejectUnauthorized: config.rejectUnauthorized ?? false,
      }
    : false;

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password || '',
    database: config.database || 'postgres',
    ssl: sslOption,
    connectionTimeoutMillis: timeoutMs,
  });

  try {
    await client.connect();
    const res = await client.query(sql);
    const executionTimeMs = Math.round(performance.now() - start);

    if (Array.isArray(res)) {
      // Multi-statement response
      const last = res[res.length - 1];
      const columns = last.fields ? last.fields.map((f: FieldDef) => f.name) : [];
      return {
        success: true,
        executionTimeMs,
        rowCount: last.rowCount || 0,
        columns,
        rows: last.rows.slice(0, maxRows),
      };
    } else {
      const columns = res.fields ? res.fields.map((f: FieldDef) => f.name) : [];
      return {
        success: true,
        executionTimeMs,
        rowCount: res.rowCount || 0,
        columns,
        rows: res.rows.slice(0, maxRows),
        affectedRows: typeof res.rowCount === 'number' ? res.rowCount : undefined,
      };
    }
  } catch (err: unknown) {
    const errorObj = err as { message?: string; detail?: string };
    return {
      success: false,
      executionTimeMs: Math.round(performance.now() - start),
      error: errorObj.detail ? `${errorObj.message} - ${errorObj.detail}` : (errorObj.message || String(err)),
    };
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}
