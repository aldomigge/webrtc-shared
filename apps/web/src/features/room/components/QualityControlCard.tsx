import { Paper, Group, Select, Badge } from '@mantine/core';
import { QUALITY_PROFILES, type QualityProfileKey } from '@screen-room/protocol';

export interface QualityControlCardProps {
  quality: QualityProfileKey;
  onChangeQuality: (newQuality: QualityProfileKey) => void;
}

export function QualityControlCard({ quality, onChangeQuality }: QualityControlCardProps) {
  const currentProfile = QUALITY_PROFILES[quality] || QUALITY_PROFILES.balanced;

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
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Select
          label="Qualidade da transmissão"
          size="sm"
          value={quality}
          onChange={(val) => val && onChangeQuality(val as QualityProfileKey)}
          data={[
            { value: 'economy', label: 'Economia · 720p / 15 FPS / 800 kbps' },
            { value: 'balanced', label: 'Equilibrado · 720p / 20 FPS / 1,5 Mbps' },
            { value: 'high', label: 'Alta qualidade · 1080p / 20 FPS / 3 Mbps' },
          ]}
          style={{ minWidth: 290 }}
        />

        <Badge color="teal" variant="light" size="lg" mt="xs">
          {currentProfile.label} · {currentProfile.maxFramerate} FPS ·{' '}
          {Math.round((currentProfile.maxBitrate / 1_000_000) * 10) / 10} Mbps
        </Badge>
      </Group>
    </Paper>
  );
}
