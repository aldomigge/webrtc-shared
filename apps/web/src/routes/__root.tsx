import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
  AppShell,
  Group,
  Text,
  Badge,
  Anchor,
} from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from '../theme';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#122218' },
      { title: 'Screen Room — tela e áudio, sem microfone' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="pt-BR" {...mantineHtmlProps}>
      <head>
        <HeadContent />
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <AppShell
            header={{ height: 60 }}
            padding="md"
            styles={{
              main: {
                minHeight: '100vh',
                backgroundColor: 'var(--mantine-color-dark-8)',
              },
            }}
          >
            <AppShell.Header
              style={{
                backgroundColor: '#122218',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1.5rem',
              }}
            >
              <Group justify="space-between" style={{ width: '100%' }}>
                <Anchor
                  href="/"
                  underline="never"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                  }}
                >
                  <span style={{ color: '#57de81' }}>▣</span> Screen Room
                </Anchor>
                <Badge
                  color="gray"
                  variant="dot"
                  size="lg"
                  styles={{
                    root: { textTransform: 'none', fontWeight: 600 },
                  }}
                >
                  Pronto para conectar
                </Badge>
              </Group>
            </AppShell.Header>
            <AppShell.Main>
              <Outlet />
            </AppShell.Main>
          </AppShell>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
