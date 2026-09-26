import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Container, Stack, Notification, Box } from '@mantine/core';
import { useRoomSession } from '../features/room/hooks/useRoomSession';
import { RoomHeader } from '../features/room/components/RoomHeader';
import { ShareControlCard } from '../features/room/components/ShareControlCard';
import { QualityControlCard } from '../features/room/components/QualityControlCard';
import { NetworkStatsCard } from '../features/room/components/NetworkStatsCard';
import { VideoGrid } from '../features/room/components/VideoGrid';
import { DiagnosticsAccordion } from '../features/room/components/DiagnosticsAccordion';

export const Route = createFileRoute('/room/$roomId')({
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = useParams({ from: '/room/$roomId' });
  const navigate = useNavigate();

  const displayName = typeof window !== 'undefined' ? sessionStorage.getItem('screen_room_display_name') || undefined : undefined;

  const session = useRoomSession({
    roomId,
    displayName,
  });

  const handleLeave = () => {
    navigate({ to: '/' });
  };

  return (
    <Container size="md" py="lg">
      <Stack gap="lg">
        {session.toastMessage && (
          <Box
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            <Notification
              color="teal"
              withCloseButton={false}
              style={{
                backgroundColor: '#16281e',
                border: '1px solid rgba(87, 222, 129, 0.4)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              {session.toastMessage}
            </Notification>
          </Box>
        )}

        <RoomHeader roomId={roomId} onLeave={handleLeave} />

        <ShareControlCard
          isSharing={session.isSharing}
          hasAudioTrack={session.hasAudioTrack}
          isAudioMuted={session.isAudioMuted}
          errorMessage={session.errorMessage}
          onStartShare={session.startSharing}
          onStopShare={session.stopSharing}
          onToggleMute={session.toggleAudioMute}
          onDismissError={session.clearError}
        />

        <QualityControlCard
          quality={session.quality}
          onChangeQuality={session.changeQuality}
        />

        <NetworkStatsCard
          connectionStatus={session.connectionStatus}
          participantCount={session.participantCount}
          networkStats={session.networkStats}
          isSharing={session.isSharing}
        />

        <VideoGrid
          localStream={session.localStream}
          remoteStreams={session.remoteStreams}
        />

        <DiagnosticsAccordion entries={session.diagnostics} />
      </Stack>
    </Container>
  );
}
