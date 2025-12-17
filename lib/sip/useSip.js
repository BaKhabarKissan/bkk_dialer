"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import JsSIP from "jssip";

// Disable JsSIP debug logs in production
JsSIP.debug.disable("JsSIP:*");

export const CallStatus = {
  IDLE: "idle",
  CONNECTING: "connecting",
  RINGING: "ringing",
  IN_CALL: "in_call",
  ON_HOLD: "on_hold",
  ENDED: "ended",
};

export const RegistrationStatus = {
  UNREGISTERED: "unregistered",
  REGISTERING: "registering",
  REGISTERED: "registered",
  FAILED: "failed",
};

export default function useSip(config) {
  const [registrationStatus, setRegistrationStatus] = useState(
    RegistrationStatus.UNREGISTERED
  );
  const [callStatus, setCallStatus] = useState(CallStatus.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDirection, setCallDirection] = useState(null);
  const [remoteNumber, setRemoteNumber] = useState("");
  const [error, setError] = useState(null);

  const uaRef = useRef(null);
  const sessionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const uaIdRef = useRef(0); // Track current UA instance to prevent stale event handlers

  // Initialize remote audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !remoteAudioRef.current) {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
    }
  }, []);

  // Cleanup after call ends
  const cleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    sessionRef.current = null;
    setCallStatus(CallStatus.IDLE);
    setCallDirection(null);
    setRemoteNumber("");
    setIsMuted(false);
    setIsSpeakerMuted(false);
    setIsOnHold(false);
  }, []);

  // Setup session event handlers
  const setupSessionEvents = useCallback((session) => {
    session.on("progress", () => {
      setCallStatus(CallStatus.RINGING);
    });

    session.on("accepted", () => {
      setCallStatus(CallStatus.IN_CALL);
    });

    session.on("confirmed", () => {
      setCallStatus(CallStatus.IN_CALL);
    });

    session.on("ended", () => {
      cleanupCall();
    });

    session.on("failed", (e) => {
      setError(`Call failed: ${e.cause}`);
      cleanupCall();
    });

    session.on("peerconnection", (e) => {
      const peerconnection = e.peerconnection;

      peerconnection.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };
    });

    session.on("hold", () => {
      setIsOnHold(true);
      setCallStatus(CallStatus.ON_HOLD);
    });

    session.on("unhold", () => {
      setIsOnHold(false);
      setCallStatus(CallStatus.IN_CALL);
    });
  }, [cleanupCall]);

  // Initialize JsSIP User Agent
  const connect = useCallback(() => {
    if (!config?.server || !config?.username || !config?.password) {
      setError("Missing SIP configuration");
      return;
    }

    try {
      // Cleanup existing UA
      if (uaRef.current) {
        uaRef.current.stop();
        uaRef.current = null;
      }

      // Increment UA ID to invalidate any pending events from old UA instances
      uaIdRef.current += 1;
      const currentUaId = uaIdRef.current;

      // Build WebSocket URL - handle various input formats
      let wsUrl = config.server.trim();
      if (!wsUrl.startsWith("wss://") && !wsUrl.startsWith("ws://")) {
        // Default to wss:// if no protocol specified
        wsUrl = `wss://${wsUrl}`;
      }

      console.log("Connecting to WebSocket:", wsUrl);
      const socket = new JsSIP.WebSocketInterface(wsUrl);

      // Extract domain from server URL (remove protocol and path)
      const serverDomain = config.server
        .replace(/^wss?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/:\d+$/, ""); // Remove port for SIP URI

      const sipDomain = config.domain || serverDomain;

      const configuration = {
        sockets: [socket],
        uri: `sip:${config.username}@${sipDomain}`,
        password: config.password,
        display_name: config.displayName || config.username,
        register: true,
        session_timers: false,
      };

      const ua = new JsSIP.UA(configuration);

      let wasRegistered = false;

      // Helper to check if this UA is still the current one
      const isCurrentUa = () => currentUaId === uaIdRef.current;

      ua.on("connecting", () => {
        if (!isCurrentUa()) return;
        setRegistrationStatus(RegistrationStatus.REGISTERING);
        setError(null);
      });

      ua.on("connected", () => {
        if (!isCurrentUa()) return;
        console.log("WebSocket connected");
      });

      ua.on("disconnected", (e) => {
        if (!isCurrentUa()) return;
        // If we never successfully registered, mark as FAILED to prevent auto-reconnect loop
        if (!wasRegistered) {
          setRegistrationStatus(RegistrationStatus.FAILED);
          setError("Connection failed - check server address and port");
        } else {
          setRegistrationStatus(RegistrationStatus.UNREGISTERED);
        }
      });

      ua.on("registered", () => {
        if (!isCurrentUa()) return;
        wasRegistered = true;
        setRegistrationStatus(RegistrationStatus.REGISTERED);
        setError(null);
      });

      ua.on("unregistered", () => {
        if (!isCurrentUa()) return;
        setRegistrationStatus(RegistrationStatus.UNREGISTERED);
      });

      ua.on("registrationFailed", (e) => {
        if (!isCurrentUa()) return;
        setRegistrationStatus(RegistrationStatus.FAILED);
        setError(`Registration failed: ${e.cause}`);
      });

      ua.on("newRTCSession", (data) => {
        if (!isCurrentUa()) return;
        const session = data.session;

        if (sessionRef.current) {
          if (session.direction === "incoming") {
            session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
          }
          return;
        }

        sessionRef.current = session;
        setCallDirection(session.direction);

        if (session.direction === "incoming") {
          const caller = session.remote_identity.uri.user;
          setRemoteNumber(caller);
          setCallStatus(CallStatus.RINGING);
        }

        setupSessionEvents(session);
      });

      ua.start();
      uaRef.current = ua;
    } catch (err) {
      setError(`Connection error: ${err.message}`);
      setRegistrationStatus(RegistrationStatus.FAILED);
    }
  }, [config, setupSessionEvents]);

  // Make outgoing call
  const call = useCallback(
    async (number) => {
      if (!uaRef.current || registrationStatus !== RegistrationStatus.REGISTERED) {
        setError("Not registered");
        return;
      }

      if (sessionRef.current) {
        setError("Already in a call");
        return;
      }

      try {
        setCallStatus(CallStatus.CONNECTING);
        setRemoteNumber(number);
        setError(null);

        const options = {
          mediaConstraints: { audio: true, video: false },
          pcConfig: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
        };

        const targetUri = `sip:${number}@${config.domain || config.server}`;
        uaRef.current.call(targetUri, options);
      } catch (err) {
        setError(`Call error: ${err.message}`);
        cleanupCall();
      }
    },
    [registrationStatus, config, cleanupCall]
  );

  // Answer incoming call
  const answer = useCallback(() => {
    const session = sessionRef.current;
    // Check session exists and is in a state that can be answered (STATUS_WAITING_FOR_ANSWER = 4)
    if (session && session.direction === "incoming" && session.status === 4) {
      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      };
      session.answer(options);
    }
  }, []);

  // End call
  const hangup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
  }, []);

  // Reject incoming call
  const reject = useCallback(() => {
    const session = sessionRef.current;
    // Check session exists and is in a state that can be rejected
    if (session && session.direction === "incoming" && (session.status === 4 || session.status === 3)) {
      session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (sessionRef.current) {
      if (isMuted) {
        sessionRef.current.unmute({ audio: true });
      } else {
        sessionRef.current.mute({ audio: true });
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle speaker (mute/unmute remote audio)
  const toggleSpeaker = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerMuted(remoteAudioRef.current.muted);
    }
  }, []);

  // Toggle hold
  const toggleHold = useCallback(() => {
    if (sessionRef.current) {
      if (isOnHold) {
        sessionRef.current.unhold();
      } else {
        sessionRef.current.hold();
      }
    }
  }, [isOnHold]);

  // Send DTMF tone
  const sendDTMF = useCallback((tone) => {
    if (sessionRef.current && callStatus === CallStatus.IN_CALL) {
      sessionRef.current.sendDTMF(tone);
    }
  }, [callStatus]);

  // Disconnect UA
  const disconnect = useCallback(() => {
    // Increment UA ID to invalidate any pending events from this UA
    uaIdRef.current += 1;

    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
    }
    setRegistrationStatus(RegistrationStatus.UNREGISTERED);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.terminate();
      }
      if (uaRef.current) {
        uaRef.current.stop();
        uaRef.current = null;
      }
    };
  }, []);

  return {
    // Status
    registrationStatus,
    callStatus,
    isMuted,
    isSpeakerMuted,
    isOnHold,
    callDirection,
    remoteNumber,
    error,
    isRegistered: registrationStatus === RegistrationStatus.REGISTERED,
    isInCall: [CallStatus.CONNECTING, CallStatus.RINGING, CallStatus.IN_CALL, CallStatus.ON_HOLD].includes(callStatus),

    // Actions
    connect,
    disconnect,
    call,
    answer,
    hangup,
    reject,
    toggleMute,
    toggleSpeaker,
    toggleHold,
    sendDTMF,
  };
}
