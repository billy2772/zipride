import { connect } from '@tidbcloud/serverless';

export interface Env {
  DATABASE_URL?: string;
  TIDB_HOST?: string;
  TIDB_USER?: string;
  TIDB_PASSWORD?: string;
  TIDB_DATABASE?: string;
  JWT_SECRET?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_UPLOAD_PRESET?: string;
  MONGO_ATLAS_URL?: string;
  MONGO_ATLAS_API_KEY?: string;
  MONGO_CLUSTER_NAME?: string;
  MONGO_DATABASE?: string;
}

export function getTiDBConnection(env: Env) {
  const host = env.TIDB_HOST;
  const user = env.TIDB_USER;
  const password = env.TIDB_PASSWORD;
  const database = env.TIDB_DATABASE || 'zipride';

  if (!host || !user || !password) {
    throw new Error('TiDB credentials (TIDB_HOST, TIDB_USER, TIDB_PASSWORD) must be provided in environment bindings.');
  }

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
