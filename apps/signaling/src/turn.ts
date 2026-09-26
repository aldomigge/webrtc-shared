import { readFileSync } from 'node:fs';
import { createHmac, randomUUID } from 'node:crypto';
import type { TurnCredentialsResponse } from '@screen-room/protocol';

export function turnSecret(): string {
  try {
    return readFileSync(process.env.TURN_SECRET_FILE || '/etc/screen-room/turn-secret', 'utf8').trim();
  } catch {
    return process.env.TURN_SECRET || '';
  }
}

export function turnCredentials(): TurnCredentialsResponse {
  const secret = turnSecret();
  if (!secret) return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const username = `${Math.floor(Date.now() / 1000) + 3600}:${randomUUID()}`;
  const credential = createHmac('sha1', secret).update(username).digest('base64');
  const host = process.env.TURN_HOST || '169.58.238.52';
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: [`turn:${host}:3478?transport=udp`, `turn:${host}:3478?transport=tcp`], username, credential }
    ]
  };
}
