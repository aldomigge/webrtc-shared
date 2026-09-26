import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type QualityProfileKey,
  isOfferSignal,
  isAnswerSignal,
  isIceSignal,
  QUALITY_PROFILES,
} from '@screen-room/protocol';
import type {
  ConnectionState,
  DiagnosticEntry,
  NetworkMetrics,
  RemoteStreamEntry,
} from '../types';
import { DiagnosticsLogger } from '../diagnostics/diagnostics-logger';
import { SignalingClient } from '../signaling/signaling-client';
import { PeerManager } from '../webrtc/peer-manager';
import { fetchIceConfiguration } from '../webrtc/ice-config';
import { StatsCollector } from '../stats/stats-collector';
import {
  captureDisplayMedia,
  formatSharingErrorMessage,
  setStreamAudioMuted,
  stopAllTracks,
} from '../media/display-media';

export interface UseRoomSessionOptions {
  roomId: string;
  displayName?: string;
}

export function useRoomSession({ roomId, displayName }: UseRoomSessionOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('connecting');
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [hasAudioTrack, setHasAudioTrack] = useState<boolean>(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamEntry[]>([]);
  const [quality, setQuality] = useState<QualityProfileKey>('balanced');
  const [networkStats, setNetworkStats] = useState<NetworkMetrics | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loggerRef = useRef<DiagnosticsLogger | null>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const statsCollectorRef = useRef<StatsCollector | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const qualityRef = useRef<QualityProfileKey>('balanced');

  localStreamRef.current = localStream;
  qualityRef.current = quality;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const logger = new DiagnosticsLogger();
    loggerRef.current = logger;
    const unsubscribeLogger = logger.subscribe(setDiagnostics);

    const peerId = `p_${crypto.randomUUID().replace(/-/g, '')}`;
    logger.log('session-init', { roomId, peerId, displayName: displayName || 'Anonymous' });

    let isDisposed = false;

    // Create PeerManager
    const peerManager = new PeerManager({
      rtcConfig: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      onSendSignal: (target, data) => {
        signalingRef.current?.relaySignal(target, data);
      },
      onRemoteStreamAdd: (remotePeerId, stream) => {
        setRemoteStreams((prev) => {
          const filtered = prev.filter((item) => item.peerId !== remotePeerId);
          return [...filtered, { peerId: remotePeerId, stream }];
        });
      },
      onRemoteStreamRemove: (remotePeerId) => {
        setRemoteStreams((prev) => prev.filter((item) => item.peerId !== remotePeerId));
      },
      logger,
    });
    peerManagerRef.current = peerManager;

    // Create StatsCollector with auto-downgrade handler
    const statsCollector = new StatsCollector({
      peerManager,
      onStats: (metrics) => {
        if (!isDisposed) setNetworkStats(metrics);
      },
      onDegradation: (lossPercent) => {
        const curQuality = qualityRef.current;
        if (curQuality === 'economy') return;
        const nextQuality: QualityProfileKey = curQuality === 'high' ? 'balanced' : 'economy';
        logger.log('quality-downgrade', { from: curQuality, to: nextQuality, loss: lossPercent });
        setQuality(nextQuality);
        peerManager.applyQuality(nextQuality);
        showToast('Rede instável: qualidade de transmissão reduzida automaticamente.');
      },
      logger,
    });
    statsCollectorRef.current = statsCollector;

    // Create SignalingClient
    const signaling = new SignalingClient({
      onStateChange: (state) => {
        if (isDisposed) return;
        setConnectionStatus(state);
        if (state === 'connected') {
          signaling.join(roomId, peerId);
        }
      },
      onMessage: (message) => {
        if (isDisposed) return;
        if (message.type === 'peers') {
          setParticipantCount(Math.max(1, message.count));
        } else if (message.type === 'peer-joined') {
          setParticipantCount(Math.max(1, message.count));
          if (localStreamRef.current) {
            peerManager.createAndSendOffer(message.peerId).catch((err) => {
              logger.log('offer-error', { peer: message.peerId, message: err?.message });
            });
          }
        } else if (message.type === 'peer-left') {
          setParticipantCount(Math.max(1, message.count));
          peerManager.removePeer(message.peerId);
        } else if (message.type === 'signal') {
          const { from, data } = message;
          if (isOfferSignal(data)) {
            peerManager.handleOffer(from, data.sdp as RTCSessionDescriptionInit);
          } else if (isAnswerSignal(data)) {
            peerManager.handleAnswer(from, data.sdp as RTCSessionDescriptionInit);
          } else if (isIceSignal(data)) {
            peerManager.handleRemoteIce(from, data.candidate as RTCIceCandidateInit);
          }
        } else if (message.type === 'error') {
          setErrorMessage(message.message);
          showToast(message.message);
        }
      },
      onError: (err) => {
        if (!isDisposed) {
          setErrorMessage(err.message || 'Erro de conexão no signaling');
        }
      },
      logger,
    });
    signalingRef.current = signaling;

    // Load ICE configuration asynchronously
    fetchIceConfiguration(undefined, logger).then((config) => {
      if (!isDisposed) {
        peerManager.setRtcConfig(config);
      }
    });

    // Start signaling connection
    signaling.connect();

    return () => {
      isDisposed = true;
      unsubscribeLogger();
      stopAllTracks(localStreamRef.current);
      statsCollector.stop();
      peerManager.closeAll();
      signaling.disconnect();
    };
  }, [roomId, displayName, showToast]);

  const stopSharing = useCallback(() => {
    if (localStreamRef.current) {
      stopAllTracks(localStreamRef.current);
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsSharing(false);
    setIsAudioMuted(false);
    setHasAudioTrack(false);

    peerManagerRef.current?.detachLocalStream().catch(console.error);
    statsCollectorRef.current?.stop();
    loggerRef.current?.log('screen-stopped');
  }, []);

  const startSharing = useCallback(async () => {
    setErrorMessage(null);
    try {
      loggerRef.current?.log('screen-capture-request', { quality: qualityRef.current });
      const stream = await captureDisplayMedia(qualityRef.current);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsSharing(true);

      const hasAudio = stream.getAudioTracks().length > 0;
      setHasAudioTrack(hasAudio);
      setIsAudioMuted(false);

      loggerRef.current?.log('screen-captured', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      // Listen for browser native stop button
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopSharing();
        });
      }

      // Attach to peer manager and start stats
      if (peerManagerRef.current) {
        await peerManagerRef.current.attachLocalStream(stream);
      }
      statsCollectorRef.current?.start();

      showToast(
        hasAudio
          ? 'Compartilhando tela com áudio.'
          : 'Compartilhando somente tela. Para áudio, escolha uma aba com som.',
      );
    } catch (err: any) {
      const msg = formatSharingErrorMessage(err);
      setErrorMessage(msg);
      showToast(msg);
      loggerRef.current?.log('screen-capture-error', { error: err?.name, message: err?.message });
    }
  }, [stopSharing, showToast]);

  const toggleAudioMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextMuted = !isAudioMuted;
    setStreamAudioMuted(localStreamRef.current, nextMuted);
    setIsAudioMuted(nextMuted);
    loggerRef.current?.log('screen-audio', { muted: nextMuted });
    showToast(nextMuted ? 'Áudio da tela mutado.' : 'Áudio da tela reativado.');
  }, [isAudioMuted, showToast]);

  const changeQuality = useCallback(
    async (newQuality: QualityProfileKey) => {
      setQuality(newQuality);
      if (peerManagerRef.current) {
        await peerManagerRef.current.applyQuality(newQuality);
      }
      const profile = QUALITY_PROFILES[newQuality];
      showToast(`Qualidade alterada para ${profile.label}.`);
    },
    [showToast],
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    connectionStatus,
    participantCount,
    localStream,
    isSharing,
    isAudioMuted,
    hasAudioTrack,
    remoteStreams,
    quality,
    networkStats,
    diagnostics,
    errorMessage,
    toastMessage,
    startSharing,
    stopSharing,
    toggleAudioMute,
    changeQuality,
    clearError,
  };
}
