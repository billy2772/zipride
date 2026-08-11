export interface Env {
  MONGO_ATLAS_URL?: string;
  MONGO_ATLAS_API_KEY?: string;
  MONGO_CLUSTER_NAME?: string;
  MONGO_DATABASE?: string;
}

export async function mongoFindOne(env: Env, collection: string, filter: Record<string, any>) {
  const endpoint = env.MONGO_ATLAS_URL || 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-api/endpoint/data/v1/action/findOne';
  const apiKey = env.MONGO_ATLAS_API_KEY || '';

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        dataSource: env.MONGO_CLUSTER_NAME || 'Cluster0',
        database: env.MONGO_DATABASE || 'zipride',
        collection,
        filter,
      }),
    });

    if (!response.ok) return null;
    const json: any = await response.json();
    return json?.document || null;
  } catch (err: any) {
    console.warn('[Mongo Data API Error]:', err.message);
    return null;
  }
}
