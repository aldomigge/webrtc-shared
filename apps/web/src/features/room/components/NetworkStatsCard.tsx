import { Group, Text, Badge } from '@mantine/core';
import type { ConnectionState, NetworkMetrics } from '../types';

export interface NetworkStatsCardProps {
  connectionStatus: ConnectionState;
  participantCount: number;
  networkStats: NetworkMetrics | null;
  isSharing: boolean;
}

export function NetworkStatsCard({
  connectionStatus,
  participantCount,
  networkStats,
  isSharing,
}: NetworkStatsCardProps) {
  let statsText = 'Rede: aguardando conexão WebRTC';

  if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
    statsText = 'Rede: desconectado';
  } else if (networkStats) {
    statsText = `Rede: ${networkStats.bitrateKbps} kbps · perda ${networkStats.lossPercent.toFixed(1)}% · RTT ${networkStats.rttMs || '–'} ms · ${networkStats.activeConnections} conexão(ões)`;
  } else if (isSharing) {
    statsText = 'Rede: aguardando métricas do espectador…';
  } else {
    statsText = 'Rede: aguardando transmissão';
  }

  const viewers = Math.max(0, participantCount - 1);
  const presenceText =
    viewers === 0
      ? 'Você está sozinho na sala'
      : `${viewers} ${viewers === 1 ? 'outro participante' : 'outros participantes'} na sala`;

  const statusBadge =
    connectionStatus === 'connected' ? (
      <Badge color="teal" variant="dot" size="sm">
        Conectado
      </Badge>
    ) : connectionStatus === 'connecting' ? (
      <Badge color="yellow" variant="dot" size="sm">
        Conectando…
      </Badge>
    ) : (
      <Badge color="red" variant="dot" size="sm">
        Desconectado
      </Badge>
    );

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Group gap="xs">
        {statusBadge}
        <Text size="xs" c="dimmed">
          {statsText}
        </Text>
      </Group>

      <Group gap="xs">
        <Text size="xs" fw={600} style={{ color: '#fff' }}>
          {presenceText}
        </Text>
        <Text size="xs" c="dimmed">
          · Microfone bloqueado por design
        </Text>
      </Group>
    </Group>
  );
}
