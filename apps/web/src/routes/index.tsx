import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  ActionIcon,
  Stack,
  Alert,
} from '@mantine/core';
import { normalizeRoom, generateSecureRoomId } from '@screen-room/protocol';

export const Route = createFileRoute('/')({
  component: LobbyPage,
});

function LobbyPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(generateSecureRoomId);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const normalized = normalizeRoom(roomId);
      if (typeof window !== 'undefined') {
        if (displayName.trim()) {
          sessionStorage.setItem('screen_room_display_name', displayName.trim());
        } else {
          sessionStorage.removeItem('screen_room_display_name');
        }
      }
      navigate({
        to: '/room/$roomId',
        params: { roomId: normalized },
      });
    } catch (err: any) {
      setError(err?.message || 'Nome de sala inválido.');
    }
  };

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <div>
          <Text
            size="xs"
            fw={800}
            c="teal"
            style={{ letterSpacing: '0.1em' }}
          >
            WEBRTC · APENAS TELA
          </Text>
          <Title order={1} mt="xs" fw={800} style={{ color: '#fff' }}>
            Compartilhe sua tela.<br />Sem microfone.
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            Crie uma sala e envie o link. Qualquer pessoa com o link pode assistir à tela e ao áudio compartilhados.
          </Text>
        </div>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          withBorder
          p="xl"
          radius="md"
          style={{
            backgroundColor: '#16281e',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Stack gap="md">
            {error && (
              <Alert color="red" variant="light" title="Atenção">
                {error}
              </Alert>
            )}

            <TextInput
              label="Nome da sala"
              required
              placeholder="ex.: demonstracao"
              value={roomId}
              onChange={(e) => setRoomId(e.currentTarget.value)}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  title="Gerar nome de sala aleatório"
                  onClick={() => setRoomId(generateSecureRoomId())}
                >
                  ↻
                </ActionIcon>
              }
            />

            <TextInput
              label="Seu nome (opcional)"
              placeholder="Ex.: Ana"
              value={displayName}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
            />

            <Button
              type="submit"
              color="teal"
              size="md"
              fullWidth
              style={{ fontWeight: 700 }}
            >
              Entrar na sala →
            </Button>

            <Text size="xs" c="dimmed" ta="center">
              Você poderá compartilhar tela e áudio na próxima etapa. O microfone nunca é solicitado.
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
