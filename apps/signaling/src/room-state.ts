import { normalizeRoom, normalizePeer } from '@screen-room/protocol';

export class RoomRegistry {
  #rooms = new Map<string, Set<string>>();

  join(roomId: unknown, peerId: unknown): string[] {
    const room = normalizeRoom(roomId);
    const peer = normalizePeer(peerId);
    const peers = this.#rooms.get(room) ?? new Set<string>();
    const existingPeers = [...peers];
    peers.add(peer);
    this.#rooms.set(room, peers);
    return existingPeers;
  }

  leave(roomId: unknown, peerId: unknown): string[] {
    const room = normalizeRoom(roomId);
    const peer = normalizePeer(peerId);
    const peers = this.#rooms.get(room);
    if (!peers) return [];
    peers.delete(peer);
    const remaining = [...peers];
    if (peers.size === 0) this.#rooms.delete(room);
    return remaining;
  }

  peers(roomId: unknown): string[] {
    const room = normalizeRoom(roomId);
    return [...(this.#rooms.get(room) ?? [])];
  }

  has(roomId: unknown): boolean {
    return this.#rooms.has(normalizeRoom(roomId));
  }
}
