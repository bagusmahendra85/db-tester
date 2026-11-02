export type DatabaseType = 'mysql' | 'postgres';

export interface ConnectionConfig {
  type: DatabaseType;
  host: string;
  port: number;
  user: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  rejectUnauthorized?: boolean;
  timeoutMs?: number;
}

export interface ConnectionTiming {
  tcpConnectMs: number;
  authHandshakeMs: number;
  queryPingMs: number;
  totalMs: number;
}

export interface ServerDetails {
  version: string;
  engine: string;
  uptime?: string;
  charset?: string;
  collation?: string;
  maxConnections?: number;
  currentConnections?: number;
  databases?: string[];
  systemVariables?: Record<string, string>;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  timing?: ConnectionTiming;
  server?: ServerDetails;
  error?: {
    code?: string;
    message: string;
    detail?: string;
    hint?: string;
    troubleshootingTip?: string;
  };
}

export interface QueryExecuteRequest {
  config: ConnectionConfig;
  sql: string;
  maxRows?: number;
}

export interface QueryExecuteResponse {
  success: boolean;
  executionTimeMs: number;
  rowCount?: number;
  columns?: string[];
  rows?: Record<string, unknown>[];
  affectedRows?: number;
  error?: string;
}

export interface BenchmarkRequest {
  config: ConnectionConfig;
  concurrency: number;
  iterations: number;
  query?: string;
}

export interface BenchmarkResult {
  success: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTimeMs: number;
  requestsPerSecond: number;
  latencies: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p99: number;
  };
  errorSample?: string;
}

export interface SavedProfile {
  id: string;
  name: string;
  config: ConnectionConfig;
  createdAt: number;
  lastTestedAt?: number;
  lastStatus?: 'success' | 'failed';
}

