import { loadAssistantConfig, protocol } from './config.mjs';

// Configuration/liveness only: this probe does not invoke either model or reserve money.
try {
  const config = loadAssistantConfig();
  const response = await fetch(new URL(protocol.health, `http://${config.bindHost}:${config.port}`), {
    redirect: 'error', signal: AbortSignal.timeout(config.bodyTimeoutMs),
  });
  if (!response.ok || !response.body) throw new Error('Unavailable');
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > config.upstreamBytes) throw new Error('Oversized health response');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  if (JSON.parse(Buffer.concat(chunks).toString('utf8')).status !== 'configured') throw new Error('Unavailable');
} catch {
  process.exitCode = 1;
}
