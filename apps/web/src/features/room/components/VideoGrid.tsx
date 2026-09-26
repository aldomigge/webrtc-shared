import { Stack, Paper, Title, Text, Box } from '@mantine/core';
import type { RemoteStreamEntry } from '../types';
import { VideoStreamCard } from './VideoStreamCard';

export interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: RemoteStreamEntry[];
}

export function VideoGrid({ localStream, remoteStreams }: VideoGridProps) {
  const hasStreams = Boolean(localStream) || remoteStreams.length > 0;

  if (!hasStreams) {
    return (
      <Paper
        withBorder
        p="xl"
        radius="md"
        style={{
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#122218',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              fontSize: '2.5rem',
              color: 'rgba(255, 255, 255, 0.2)',
              lineHeight: 1,
            }}
          >
            ▣
          </Box>
          <Title order={3} size="h4" style={{ color: '#fff' }}>
            Nenhuma tela sendo compartilhada
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Quando alguém iniciar o compartilhamento, a tela aparecerá aqui.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {localStream && (
        <VideoStreamCard
          key="local"
          id="local"
          label="Você"
          stream={localStream}
          isLocal={true}
        />
      )}

      {remoteStreams.map((item) => (
        <VideoStreamCard
          key={item.peerId}
          id={item.peerId}
          label={`Participante (${item.peerId.slice(0, 8)})`}
          stream={item.stream}
          isLocal={false}
        />
      ))}
    </Stack>
  );
}
