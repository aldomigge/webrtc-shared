import { Accordion, Code, Text } from '@mantine/core';
import type { DiagnosticEntry } from '../types';

export interface DiagnosticsAccordionProps {
  entries: DiagnosticEntry[];
}

export function DiagnosticsAccordion({ entries }: DiagnosticsAccordionProps) {
  const formattedLines =
    entries.length === 0
      ? 'Aguardando eventos…'
      : entries
          .map((e) => {
            const detailStr = Object.entries(e.details)
              .map(([k, v]) => `${k}=${String(v)}`)
              .join(' ');
            return `${e.timestamp} ${e.event} ${detailStr}`.trim();
          })
          .join('\n');

  return (
    <Accordion variant="separated">
      <Accordion.Item
        value="diagnostics"
        style={{
          backgroundColor: '#16281e',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Accordion.Control>
          <Text size="sm" fw={600} style={{ color: '#fff' }}>
            Diagnóstico da conexão ({entries.length} eventos)
          </Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Code
            block
            style={{
              backgroundColor: '#0d1610',
              color: '#57de81',
              maxHeight: 250,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.8rem',
            }}
          >
            {formattedLines}
          </Code>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
