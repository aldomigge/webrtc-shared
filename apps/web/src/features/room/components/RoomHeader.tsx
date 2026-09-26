import { useState } from 'react';
import { Paper, Group, Text, Title, Button } from '@mantine/core';

export interface RoomHeaderProps {
  roomId: string;
  onLeave: () => void;
}

export function RoomHeader({ roomId, onLeave }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      try {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.search = '';
        cleanUrl.hash = '';
        await navigator.clipboard.writeText(cleanUrl.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        backgroundColor: '#16281e',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <Group justify="space-between" align="center">
        <div>
          <Text size="xs" fw={800} c="teal" style={{ letterSpacing: '0.1em' }}>
            SALA ATIVA
          </Text>
          <Title order={2} style={{ color: '#fff' }}>
            {roomId}
          </Title>
        </div>
        <Group gap="sm">
          <Button
            variant="default"
            onClick={handleCopyLink}
            color="gray"
          >
            {copied ? 'Link copiado!' : 'Copiar link da sala'}
          </Button>
          <Button
            variant="subtle"
            color="red"
            onClick={onLeave}
          >
            Sair
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
