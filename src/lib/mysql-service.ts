import mysql from 'mysql2/promise';
import { ConnectionConfig, ConnectionTestResponse, QueryExecuteResponse } from './types';
import { getTroubleshootingTip } from './troubleshooting';

export async function testMySQLConnection(config: ConnectionConfig): Promise<ConnectionTestResponse> {
  const timeoutMs = config.timeoutMs || 5000;
  const startConnect = performance.now();

  let connection: mysql.Connection | null = null;
  try {
    const sslOption = config.ssl
      ? {
          rejectUnauthorized: config.rejectUnauthorized ?? false,
        }
      : undefined;

    connection = await Promise.race([
      mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password || '',
        database: config.database || undefined,
        ssl: sslOption,
        connectTimeout: timeoutMs,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    const connectEnd = performance.now();
    const connectTimeMs = Math.round(connectEnd - startConnect);

    // Query Ping & Info
    const pingStart = performance.now();
    const [versionRows] = await connection.query('SELECT VERSION() AS version');
    const pingEnd = performance.now();
    const queryPingMs = Math.round(pingEnd - pingStart);

    let rawVersion = 'Unknown';
    if (Array.isArray(versionRows) && versionRows.length > 0) {
      const row = versionRows[0] as Record<string, unknown>;
      rawVersion = String(row.version || 'Unknown');
    }

    const isMariaDB = rawVersion.toLowerCase().includes('mariadb');
    const engine = isMariaDB ? 'MariaDB' : 'MySQL';

    // Fetch server status & variables
    let uptime: string | undefined;
    let maxConnections: number | undefined;
    let currentConnections: number | undefined;
    let charset: string | undefined;
    const systemVariables: Record<string, string> = {};

    try {
      const [varRows] = await connection.query(
        "SHOW VARIABLES WHERE Variable_name IN ('version_comment', 'max_connections', 'character_set_server', 'collation_server')"
      );
      if (Array.isArray(varRows)) {
        for (const item of varRows as Record<string, string>[]) {
          systemVariables[item.Variable_name] = item.Value;
        }
        if (systemVariables['max_connections']) {
          maxConnections = parseInt(systemVariables['max_connections'], 10);
        }
        if (systemVariables['character_set_server']) {
          charset = `${systemVariables['character_set_server']} (${systemVariables['collation_server'] || ''})`;
        }
      }

      const [statusRows] = await connection.query(
        "SHOW STATUS WHERE Variable_name IN ('Uptime', 'Threads_connected')"
      );
      if (Array.isArray(statusRows)) {
        for (const item of statusRows as Record<string, string>[]) {
          if (item.Variable_name === 'Uptime') {
            const sec = parseInt(item.Value, 10);
            const days = Math.floor(sec / 86400);
            const hours = Math.floor((sec % 86400) / 3600);
            const mins = Math.floor((sec % 3600) / 60);
            uptime = `${days}d ${hours}h ${mins}m (${sec}s)`;
          }
          if (item.Variable_name === 'Threads_connected') {
            currentConnections = parseInt(item.Value, 10);
          }
        }
      }
    } catch {
      // Ignore if user doesn't have privileges for SHOW STATUS/VARIABLES
    }

    // Fetch database list if accessible
    const databases: string[] = [];
    try {
      const [dbRows] = await connection.query('SHOW DATABASES');
      if (Array.isArray(dbRows)) {
        for (const row of dbRows as Record<string, string>[]) {
          databases.push(row.Database);
        }
      }
    } catch {
      // Ignore if user cannot list databases
    }

    const totalTimeMs = Math.round(performance.now() - startConnect);

    return {
      success: true,
      message: `Berhasil terhubung ke ${engine} server (${rawVersion})!`,
      timing: {
        tcpConnectMs: Math.max(1, Math.round(connectTimeMs / 2)),
        authHandshakeMs: Math.max(1, Math.round(connectTimeMs / 2)),
        queryPingMs,
        totalMs: totalTimeMs,
      },
      server: {
        version: rawVersion,
        engine,
        uptime,
        charset,
        maxConnections,
        currentConnections,
        databases,
        systemVariables,
      },
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; sqlMessage?: string };
    return {
      success: false,
      message: errorObj.sqlMessage || errorObj.message || 'Gagal terhubung ke remote server.',
      error: {
        code: errorObj.code,
        message: errorObj.sqlMessage || errorObj.message || String(err),
        troubleshootingTip: getTroubleshootingTip(err, 'mysql', config.host, config.port),
      },
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore
      }
    }
  }
}

export async function executeMySQLQuery(
  config: ConnectionConfig,
  sql: string,
  maxRows = 100
): Promise<QueryExecuteResponse> {
  const timeoutMs = config.timeoutMs || 10000;
  const start = performance.now();
  let connection: mysql.Connection | null = null;

  try {
    const sslOption = config.ssl
      ? {
          rejectUnauthorized: config.rejectUnauthorized ?? false,
        }
      : undefined;

    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password || '',
      database: config.database || undefined,
      ssl: sslOption,
      connectTimeout: timeoutMs,
    });

    const [results, fields] = await connection.query(sql);
    const executionTimeMs = Math.round(performance.now() - start);

    if (Array.isArray(results)) {
      const columns = fields ? fields.map((f) => f.name) : (results.length > 0 ? Object.keys(results[0] as object) : []);
      const rows = (results as Record<string, unknown>[]).slice(0, maxRows);
      return {
        success: true,
        executionTimeMs,
        rowCount: results.length,
        columns,
        rows,
      };
    } else {
      const resultHeader = results as mysql.ResultSetHeader;
      return {
        success: true,
        executionTimeMs,
        affectedRows: resultHeader.affectedRows,
        rowCount: resultHeader.affectedRows,
        columns: ['affectedRows', 'insertId', 'warningStatus'],
        rows: [
          {
            affectedRows: resultHeader.affectedRows,
            insertId: resultHeader.insertId,
            warningStatus: resultHeader.warningStatus,
          },
        ],
      };
    }
  } catch (err: unknown) {
    const errorObj = err as { message?: string; sqlMessage?: string };
    return {
      success: false,
      executionTimeMs: Math.round(performance.now() - start),
      error: errorObj.sqlMessage || errorObj.message || String(err),
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore
      }
    }
  }
}

