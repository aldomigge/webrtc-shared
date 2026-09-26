import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createSignalServer } from '../server.js';

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const queue = [];
    const waiters = [];
    socket.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (waiters.length > 0) {
        waiters.shift()(parsed);
      } else {
        queue.push(parsed);
      }
    });
    socket._nextMessage = () => {
      if (queue.length > 0) return Promise.resolve(queue.shift());
      return new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error('Mensagem não recebida')), 1000);
        waiters.push((msg) => { clearTimeout(timer); res(msg); });
      });
    };
    socket.once('open', () => resolve(socket)); socket.once('error', reject);
  });
}
function nextMessage(socket) {
  return socket._nextMessage();
}

test('signal server reports presence count and only existing peers receive peer-joined', async (t) => {
  const app = createSignalServer({ port: 0, host: '127.0.0.1' }); await app.ready; t.after(() => app.close());
  const url = `ws://127.0.0.1:${app.port}/signal`;
  const host = await connect(url); const viewer = await connect(url); const third = await connect(url);
  t.after(() => [host, viewer, third].forEach((socket) => socket.close()));

  host.send(JSON.stringify({ type: 'join', roomId: 'demo', peerId: 'host' }));
  assert.deepEqual(await nextMessage(host), { type: 'peers', peers: [], count: 1 });
  viewer.send(JSON.stringify({ type: 'join', roomId: 'demo', peerId: 'viewer' }));
  assert.deepEqual(await nextMessage(viewer), { type: 'peers', peers: ['host'], count: 2 });
  assert.deepEqual(await nextMessage(host), { type: 'peer-joined', peerId: 'viewer', count: 2 });
  third.send(JSON.stringify({ type: 'join', roomId: 'demo', peerId: 'third' }));
  assert.deepEqual(await nextMessage(third), { type: 'peers', peers: ['host', 'viewer'], count: 3 });
  assert.deepEqual(await nextMessage(host), { type: 'peer-joined', peerId: 'third', count: 3 });
  assert.deepEqual(await nextMessage(viewer), { type: 'peer-joined', peerId: 'third', count: 3 });
});

test('signal server relays targeted signaling data', async (t) => {
  const app = createSignalServer({ port: 0, host: '127.0.0.1' }); await app.ready; t.after(() => app.close());
  const url = `ws://127.0.0.1:${app.port}/signal`; const host = await connect(url); const viewer = await connect(url);
  t.after(() => [host, viewer].forEach((socket) => socket.close()));
  host.send(JSON.stringify({ type: 'join', roomId: 'relay', peerId: 'host' })); await nextMessage(host);
  viewer.send(JSON.stringify({ type: 'join', roomId: 'relay', peerId: 'viewer' })); await nextMessage(viewer); await nextMessage(host);
  const offer = { type: 'signal', target: 'viewer', data: { type: 'offer', sdp: 'fake' } };
  const received = nextMessage(viewer);
  host.send(JSON.stringify(offer));
  assert.deepEqual(await received, { type: 'signal', from: 'host', data: offer.data });
});
