import { connect } from '@tidbcloud/serverless';

export interface Env {
  DATABASE_URL?: string;
  TIDB_HOST?: string;
  TIDB_USER?: string;
  TIDB_PASSWORD?: string;
  TIDB_DATABASE?: string;
  JWT_SECRET?: string;
}

export function getTiDBConnection(env: Env) {
  const host = env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const user = env.TIDB_USER || 'cBAXK2TmpioAcwS.root';
  const password = env.TIDB_PASSWORD || '9B7vqd4Ze5YvGkUV';
  const database = env.TIDB_DATABASE || 'zipride';

  const connectionString = env.DATABASE_URL || `mysql://${user}:${password}@${host}:4000/${database}`;

  return connect({
    url: connectionString,
  });
}

export async function executeQuery<T = any>(env: Env, sql: string, params: any[] = []): Promise<T[]> {
  try {
    const conn = getTiDBConnection(env);
    const result = await conn.execute(sql, params);
    return (result || []) as T[];
  } catch (err: any) {
    console.error('[TiDB Serverless Error]:', err.message);
    throw err;
  }
}
