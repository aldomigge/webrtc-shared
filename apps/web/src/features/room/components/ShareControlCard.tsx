import { Paper, Group, Text, Button, Alert, Stack } from '@mantine/core';

export interface ShareControlCardProps {
  isSharing: boolean;
  hasAudioTrack: boolean;
  isAudioMuted: boolean;
  errorMessage: string | null;
  onStartShare: () => void;
  onStopShare: () => void;
  onToggleMute: () => void;
  onDismissError: () => void;
}

export function ShareControlCard({
  isSharing,
  hasAudioTrack,
  isAudioMuted,
  errorMessage,
  onStartShare,
  onStopShare,
  onToggleMute,
  onDismissError,
}: ShareControlCardProps) {
  let title = 'Pronto para compartilhar?';
  let description = 'Sua tela e o áudio da tela serão enviados para todos na sala.';

  if (isSharing) {
    if (hasAudioTrack) {
      title = 'Você está compartilhando tela e áudio';
      description = 'Para interromper, use o botão do navegador ou o botão abaixo.';
    } else {
      title = 'Você está compartilhando somente a tela';
      description = 'Para compartilhar áudio, selecione uma aba do navegador e marque “Compartilhar áudio”.';
    }
  }

  return (
    <Stack gap="xs">
      {errorMessage && (
        <Alert
          color="red"
          variant="light"
          title="Erro de compartilhamento"
          withCloseButton
          onClose={onDismissError}
        >
          {errorMessage}
        </Alert>
      )}

      <Paper
        withBorder
        p="lg"
        radius="md"
        style={{
          backgroundColor: '#16281e',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <div style={{ maxWidth: '65%' }}>
            <Text fw={700} size="md" style={{ color: '#fff' }}>
              {title}
            </Text>
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          </div>

          <Group gap="sm">
            {isSharing && (
              <Button
                variant={isAudioMuted ? 'filled' : 'default'}
                color={isAudioMuted ? 'red' : 'gray'}
                size="md"
                onClick={onToggleMute}
                disabled={!hasAudioTrack}
                title={
                  !hasAudioTrack
                    ? 'A transmissão atual não contém trilha de áudio'
                    : isAudioMuted
                      ? 'Reativar áudio da tela'
                      : 'Mutar áudio da tela'
                }
              >
                {isAudioMuted ? 'Ativar áudio da tela' : 'Mutar áudio da tela'}
              </Button>
            )}

            <Button
              color={isSharing ? 'red' : 'teal'}
              size="md"
              style={{ fontWeight: 700 }}
              onClick={isSharing ? onStopShare : onStartShare}
            >
              {isSharing ? 'Parar compartilhamento' : 'Compartilhar tela ↗'}
            </Button>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
