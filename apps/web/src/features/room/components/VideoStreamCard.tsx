import { Paper, Group, Text, Badge, Box } from '@mantine/core';
import { useMediaStreamVideo } from '../hooks/useMediaStreamVideo';

export interface VideoStreamCardProps {
  id: string;
  label: string;
  stream: MediaStream;
  isLocal?: boolean;
}

export function VideoStreamCard({ id, label, stream, isLocal = false }: VideoStreamCardProps) {
  // Local stream is always muted to prevent audio feedback loops
  const videoRef = useMediaStreamVideo(stream, isLocal);
  const hasAudio = stream.getAudioTracks().length > 0;

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        backgroundColor: '#16281e',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      <Group justify="space-between" align="center" mb="xs">
        <Group gap="xs">
          <Text size="sm" fw={700} style={{ color: '#fff' }}>
            {label}
          </Text>
          {isLocal && (
            <Badge color="teal" variant="light" size="xs">
              sua tela
            </Badge>
          )}
        </Group>

        <Badge color={hasAudio ? 'teal' : 'gray'} variant="outline" size="xs">
          {hasAudio ? 'Áudio da tela ativo' : 'Somente vídeo'}
        </Badge>
      </Group>

      <Box
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#0a140e',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 280,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '70vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </Box>
    </Paper>
  );
}
