export async function handleWebSocketRequest(request: Request): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new (globalThis as any).WebSocketPair();
  const [client, server] = Object.values(webSocketPair) as [WebSocket, WebSocket];

  server.accept();

  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (data.type === 'auth:register') {
        server.send(JSON.stringify({ type: 'auth:ack', status: 'connected', userId: data.userId }));
      } else if (data.type === 'driver:location_update') {
        server.send(JSON.stringify({ type: 'location:ack', timestamp: Date.now() }));
      }
    } catch (e) {
      server.send(JSON.stringify({ type: 'error', message: 'Invalid WebSocket JSON payload' }));
    }
  });

  server.addEventListener('close', () => {
    console.log('[Edge WebSocket]: Client disconnected.');
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  } as any);
}
