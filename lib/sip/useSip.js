"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import JsSIP from "jssip";
import { saveRecording } from "@/lib/recordingsStorage";

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

// Map settings codec IDs to WebRTC codec mimeTypes/patterns
// Only includes codecs supported by modern browsers
const codecMapping = {
  opus: { mimeType: "audio/opus", clockRate: 48000 },
  g722: { mimeType: "audio/G722", clockRate: 8000 },
  pcmu: { mimeType: "audio/PCMU", clockRate: 8000 },
  pcma: { mimeType: "audio/PCMA", clockRate: 8000 },
};

export default function useSip(config, settings = {}) {
  const [registrationStatus, setRegistrationStatus] = useState(
    RegistrationStatus.UNREGISTERED
  );
  const [callStatus, setCallStatus] = useState(CallStatus.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDirection, setCallDirection] = useState(null);
  const [remoteNumber, setRemoteNumber] = useState("");
  const [error, setError] = useState(null);

  const uaRef = useRef(null);
  const sessionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const ringtoneAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const uaIdRef = useRef(0);
  const autoAnswerTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const currentRecordingIdRef = useRef(null);
  const onRecordingSavedRef = useRef(null);

  // Debug logging helper
  const log = useCallback((...args) => {
    if (settings.enableDebugLog) {
      console.log("[SIP]", ...args);
    }
  }, [settings.enableDebugLog]);

  // Configure JsSIP debug based on settings
  useEffect(() => {
    if (settings.enableDebugLog) {
      JsSIP.debug.enable("JsSIP:*");
    } else {
      JsSIP.debug.disable("JsSIP:*");
    }
  }, [settings.enableDebugLog]);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio();
        ringtoneAudioRef.current.loop = true;
      }
    }
  }, []);

  // Update ringtone settings when they change
  useEffect(() => {
    if (ringtoneAudioRef.current && settings.ringtone) {
      ringtoneAudioRef.current.src = settings.ringtone;
      ringtoneAudioRef.current.volume = (settings.ringtoneVolume || 70) / 100;
    }
  }, [settings.ringtone, settings.ringtoneVolume]);

  // Update speaker device when setting changes
  useEffect(() => {
    if (remoteAudioRef.current && settings.speaker && settings.speaker !== "default") {
      if (typeof remoteAudioRef.current.setSinkId === "function") {
        remoteAudioRef.current.setSinkId(settings.speaker).catch(err => {
          log("Failed to set speaker device:", err);
        });
      }
    }
  }, [settings.speaker, log]);

  // Build ICE servers configuration from settings
  const getIceServers = useCallback(() => {
    const iceServers = [];

    // Add STUN server
    if (settings.stunServer) {
      iceServers.push({ urls: settings.stunServer });
    } else {
      // Default fallback
      iceServers.push({ urls: "stun:stun.l.google.com:19302" });
    }

    // Add TURN server if configured
    if (settings.turnServer) {
      const turnConfig = { urls: settings.turnServer };
      if (settings.turnUsername) {
        turnConfig.username = settings.turnUsername;
      }
      if (settings.turnPassword) {
        turnConfig.credential = settings.turnPassword;
      }
      iceServers.push(turnConfig);
    }

    log("ICE servers:", iceServers);
    return iceServers;
  }, [settings.stunServer, settings.turnServer, settings.turnUsername, settings.turnPassword, log]);

  // Build media constraints from settings
  const getMediaConstraints = useCallback(() => {
    const audioConstraints = {
      echoCancellation: settings.echoCancellation !== false,
      noiseSuppression: settings.noiseSuppression !== false,
      autoGainControl: settings.autoGainControl !== false,
    };

    // Add specific microphone if selected
    if (settings.microphone && settings.microphone !== "default") {
      audioConstraints.deviceId = { exact: settings.microphone };
    }

    log("Audio constraints:", audioConstraints);

    return {
      audio: audioConstraints,
      video: false,
    };
  }, [settings.echoCancellation, settings.noiseSuppression, settings.autoGainControl, settings.microphone, log]);

  // Apply codec preferences to a peer connection
  const applyCodecPreferences = useCallback((peerConnection) => {
    if (!settings.enabledAudioCodecs || settings.enabledAudioCodecs.length === 0) {
      log("No codec preferences set, using browser defaults");
      return;
    }

    // Check if setCodecPreferences is supported
    const transceivers = peerConnection.getTransceivers();
    const audioTransceiver = transceivers.find(t => t.receiver?.track?.kind === "audio" || t.sender?.track?.kind === "audio");

    if (!audioTransceiver) {
      log("No audio transceiver found yet");
      return;
    }

    if (typeof audioTransceiver.setCodecPreferences !== "function") {
      log("setCodecPreferences not supported by browser");
      return;
    }

    // Get available codecs from browser
    const capabilities = RTCRtpReceiver.getCapabilities?.("audio");
    if (!capabilities?.codecs) {
      log("Could not get audio codec capabilities");
      return;
    }

    const availableCodecs = capabilities.codecs;
    log("Available browser codecs:", availableCodecs.map(c => `${c.mimeType}/${c.clockRate}`));

    // Build preferred codec list based on user settings
    const preferredCodecs = [];

    for (const codecId of settings.enabledAudioCodecs) {
      const mapping = codecMapping[codecId];
      if (!mapping) continue;

      // Find matching codecs from available list
      const matches = availableCodecs.filter(codec =>
        codec.mimeType.toLowerCase() === mapping.mimeType.toLowerCase()
      );

      preferredCodecs.push(...matches);
    }

    // Add any remaining codecs not in the preference list (required for proper negotiation)
    for (const codec of availableCodecs) {
      if (!preferredCodecs.some(p => p.mimeType === codec.mimeType && p.clockRate === codec.clockRate && p.sdpFmtpLine === codec.sdpFmtpLine)) {
        preferredCodecs.push(codec);
      }
    }

    if (preferredCodecs.length > 0) {
      try {
        audioTransceiver.setCodecPreferences(preferredCodecs);
        log("Applied codec preferences:", preferredCodecs.slice(0, settings.enabledAudioCodecs.length).map(c => `${c.mimeType}/${c.clockRate}`));
      } catch (err) {
        log("Failed to set codec preferences:", err);
      }
    }
  }, [settings.enabledAudioCodecs, log]);

  // Play ringtone
  const playRingtone = useCallback(() => {
    if (ringtoneAudioRef.current && settings.soundEvents !== false) {
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch(err => {
        log("Failed to play ringtone:", err);
      });
    }
  }, [settings.soundEvents, log]);

  // Stop ringtone
  const stopRingtone = useCallback(() => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((title, body) => {
    if (settings.showNotifications && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
          }
        });
      }
    }
  }, [settings.showNotifications]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!sessionRef.current) return;

    try {
      const peerConnection = sessionRef.current.connection;
      if (!peerConnection) return;

      // Get remote stream
      const remoteStream = new MediaStream();
      peerConnection.getReceivers().forEach(receiver => {
        if (receiver.track) {
          remoteStream.addTrack(receiver.track);
        }
      });

      // Get local stream
      const localStream = localStreamRef.current;

      // Create mixed stream for recording both sides
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      if (localStream) {
        const localSource = audioContext.createMediaStreamSource(localStream);
        localSource.connect(destination);
      }

      if (remoteStream.getAudioTracks().length > 0) {
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        remoteSource.connect(destination);
      }

      // Use WebM format (browser's native recording format)
      const mimeType = "audio/webm;codecs=opus";

      // Generate recording ID
      const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      currentRecordingIdRef.current = recordingId;

      recordedChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(destination.stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const recId = currentRecordingIdRef.current;

        try {
          // Save to IndexedDB
          await saveRecording(recId, blob);
          log("Recording saved to storage:", recId);

          // Notify callback if set
          if (onRecordingSavedRef.current) {
            onRecordingSavedRef.current(recId);
          }
        } catch (err) {
          log("Failed to save recording:", err);
        }

        currentRecordingIdRef.current = null;
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      log("Recording started with ID:", recordingId);
    } catch (err) {
      log("Failed to start recording:", err);
    }
  }, [log]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      log("Recording stopped");
    }
  }, [log]);

  // Cleanup after call ends
  const cleanupCall = useCallback(() => {
    // Stop ringtone
    stopRingtone();

    // Clear auto-answer timer
    if (autoAnswerTimerRef.current) {
      clearTimeout(autoAnswerTimerRef.current);
      autoAnswerTimerRef.current = null;
    }

    // Stop recording
    stopRecording();

    // Cleanup local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Cleanup remote audio
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
    setIsRecording(false);
  }, [stopRingtone, stopRecording]);

  // Setup session event handlers
  const setupSessionEvents = useCallback((session) => {
    session.on("progress", () => {
      log("Call progress");
      setCallStatus(CallStatus.RINGING);
    });

    session.on("accepted", () => {
      log("Call accepted");
      stopRingtone();
      setCallStatus(CallStatus.IN_CALL);

      // Start recording if enabled
      if (settings.callRecording) {
        // Small delay to ensure streams are ready
        setTimeout(() => startRecording(), 500);
      }
    });

    session.on("confirmed", () => {
      log("Call confirmed");
      setCallStatus(CallStatus.IN_CALL);
    });

    session.on("ended", (e) => {
      log("Call ended:", e?.cause);
      cleanupCall();
    });

    session.on("failed", (e) => {
      log("Call failed:", e?.cause);
      setError(`Call failed: ${e.cause}`);
      cleanupCall();
    });

    session.on("peerconnection", (e) => {
      const peerconnection = e.peerconnection;

      // Apply codec preferences before negotiation
      peerconnection.addEventListener("negotiationneeded", () => {
        applyCodecPreferences(peerconnection);
      });

      // Also try to apply immediately if transceivers exist
      setTimeout(() => applyCodecPreferences(peerconnection), 0);

      peerconnection.ontrack = (event) => {
        log("Remote track received");
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };
    });

    session.on("hold", () => {
      log("Call on hold");
      setIsOnHold(true);
      setCallStatus(CallStatus.ON_HOLD);
    });

    session.on("unhold", () => {
      log("Call resumed");
      setIsOnHold(false);
      setCallStatus(CallStatus.IN_CALL);
    });
  }, [cleanupCall, stopRingtone, startRecording, settings.callRecording, applyCodecPreferences, log]);

  // Handle auto-answer
  const setupAutoAnswer = useCallback((session) => {
    if (settings.autoAnswer === "off" || session.direction !== "incoming") {
      return;
    }

    let delay = 0;
    switch (settings.autoAnswer) {
      case "immediate":
        delay = 100;
        break;
      case "3sec":
        delay = 3000;
        break;
      case "5sec":
        delay = 5000;
        break;
      case "10sec":
        delay = 10000;
        break;
      default:
        return;
    }

    log(`Auto-answer scheduled in ${delay}ms`);

    autoAnswerTimerRef.current = setTimeout(() => {
      if (sessionRef.current && sessionRef.current.status === 4) {
        log("Auto-answering call");
        const options = {
          mediaConstraints: getMediaConstraints(),
          pcConfig: {
            iceServers: getIceServers(),
          },
        };
        sessionRef.current.answer(options);
      }
    }, delay);
  }, [settings.autoAnswer, getMediaConstraints, getIceServers, log]);

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
        wsUrl = `wss://${wsUrl}`;
      }

      log("Connecting to WebSocket:", wsUrl);
      const socket = new JsSIP.WebSocketInterface(wsUrl);

      // Extract domain from server URL
      const serverDomain = config.server
        .replace(/^wss?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/:\d+$/, "");

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

      const isCurrentUa = () => currentUaId === uaIdRef.current;

      ua.on("connecting", () => {
        if (!isCurrentUa()) return;
        log("Connecting...");
        setRegistrationStatus(RegistrationStatus.REGISTERING);
        setError(null);
      });

      ua.on("connected", () => {
        if (!isCurrentUa()) return;
        log("WebSocket connected");
      });

      ua.on("disconnected", () => {
        if (!isCurrentUa()) return;
        log("Disconnected");
        if (!wasRegistered) {
          setRegistrationStatus(RegistrationStatus.FAILED);
          setError("Connection failed - check server address and port");
        } else {
          setRegistrationStatus(RegistrationStatus.UNREGISTERED);
        }
      });

      ua.on("registered", () => {
        if (!isCurrentUa()) return;
        log("Registered successfully");
        wasRegistered = true;
        setRegistrationStatus(RegistrationStatus.REGISTERED);
        setError(null);
      });

      ua.on("unregistered", () => {
        if (!isCurrentUa()) return;
        log("Unregistered");
        setRegistrationStatus(RegistrationStatus.UNREGISTERED);
      });

      ua.on("registrationFailed", (e) => {
        if (!isCurrentUa()) return;
        log("Registration failed:", e.cause);
        setRegistrationStatus(RegistrationStatus.FAILED);
        setError(`Registration failed: ${e.cause}`);
      });

      ua.on("newRTCSession", (data) => {
        if (!isCurrentUa()) return;
        const session = data.session;

        log("New session:", session.direction);

        // Handle busy / single call mode
        if (sessionRef.current) {
          if (session.direction === "incoming") {
            log("Rejecting incoming call - already in call");
            session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
          }
          return;
        }

        sessionRef.current = session;
        setCallDirection(session.direction);

        if (session.direction === "incoming") {
          const caller = session.remote_identity.uri.user;
          const callerDisplay = session.remote_identity.display_name || caller;
          setRemoteNumber(caller);
          setCallStatus(CallStatus.RINGING);

          // Play ringtone
          playRingtone();

          // Show notification
          showNotification("Incoming Call", `Call from ${callerDisplay}`);

          // Setup auto-answer
          setupAutoAnswer(session);
        }

        setupSessionEvents(session);
      });

      ua.start();
      uaRef.current = ua;
    } catch (err) {
      log("Connection error:", err);
      setError(`Connection error: ${err.message}`);
      setRegistrationStatus(RegistrationStatus.FAILED);
    }
  }, [config, setupSessionEvents, playRingtone, showNotification, setupAutoAnswer, log]);

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
        log("Calling:", number);
        setCallStatus(CallStatus.CONNECTING);
        setRemoteNumber(number);
        setError(null);

        const options = {
          mediaConstraints: getMediaConstraints(),
          pcConfig: {
            iceServers: getIceServers(),
          },
        };

        // Store local stream reference when call starts
        const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
        localStreamRef.current = stream;

        const targetUri = `sip:${number}@${config.domain || config.server}`;
        uaRef.current.call(targetUri, options);
      } catch (err) {
        log("Call error:", err);
        setError(`Call error: ${err.message}`);
        cleanupCall();
      }
    },
    [registrationStatus, config, cleanupCall, getMediaConstraints, getIceServers, log]
  );

  // Answer incoming call
  const answer = useCallback(async () => {
    const session = sessionRef.current;
    if (session && session.direction === "incoming" && session.status === 4) {
      log("Answering call");
      stopRingtone();

      // Clear auto-answer timer if manually answering
      if (autoAnswerTimerRef.current) {
        clearTimeout(autoAnswerTimerRef.current);
        autoAnswerTimerRef.current = null;
      }

      try {
        // Get local stream
        const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
        localStreamRef.current = stream;

        const options = {
          mediaConstraints: getMediaConstraints(),
          pcConfig: {
            iceServers: getIceServers(),
          },
        };
        session.answer(options);
      } catch (err) {
        log("Answer error:", err);
        setError(`Failed to answer: ${err.message}`);
      }
    }
  }, [stopRingtone, getMediaConstraints, getIceServers, log]);

  // End call
  const hangup = useCallback(() => {
    log("Hanging up");
    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
  }, [log]);

  // Reject incoming call
  const reject = useCallback(() => {
    const session = sessionRef.current;
    if (session && session.direction === "incoming" && (session.status === 4 || session.status === 3)) {
      log("Rejecting call");
      stopRingtone();

      // Clear auto-answer timer
      if (autoAnswerTimerRef.current) {
        clearTimeout(autoAnswerTimerRef.current);
        autoAnswerTimerRef.current = null;
      }

      session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
    }
  }, [stopRingtone, log]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (sessionRef.current) {
      if (isMuted) {
        sessionRef.current.unmute({ audio: true });
        log("Unmuted");
      } else {
        sessionRef.current.mute({ audio: true });
        log("Muted");
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted, log]);

  // Toggle speaker (mute/unmute remote audio)
  const toggleSpeaker = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerMuted(remoteAudioRef.current.muted);
      log("Speaker:", remoteAudioRef.current.muted ? "muted" : "unmuted");
    }
  }, [log]);

  // Toggle hold
  const toggleHold = useCallback(() => {
    if (sessionRef.current) {
      if (isOnHold) {
        sessionRef.current.unhold();
        log("Unholding");
      } else {
        sessionRef.current.hold();
        log("Holding");
      }
    }
  }, [isOnHold, log]);

  // Send DTMF tone
  const sendDTMF = useCallback((tone) => {
    if (sessionRef.current && callStatus === CallStatus.IN_CALL) {
      log("Sending DTMF:", tone);

      // Determine DTMF transport method based on settings
      const options = {};
      if (settings.dtmfMethod && settings.dtmfMethod !== "auto") {
        switch (settings.dtmfMethod) {
          case "rfc2833":
            options.transportType = "RFC2833";
            break;
          case "info":
            options.transportType = "INFO";
            break;
        }
      }

      sessionRef.current.sendDTMF(tone, options);
    }
  }, [callStatus, settings.dtmfMethod, log]);

  // Toggle recording manually
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Set callback for when recording is saved
  const setOnRecordingSaved = useCallback((callback) => {
    onRecordingSavedRef.current = callback;
  }, []);

  // Get current recording ID (useful for associating with call logs)
  const getCurrentRecordingId = useCallback(() => {
    return currentRecordingIdRef.current;
  }, []);

  // Disconnect UA
  const disconnect = useCallback(() => {
    log("Disconnecting");
    uaIdRef.current += 1;

    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
    }
    setRegistrationStatus(RegistrationStatus.UNREGISTERED);
  }, [log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAnswerTimerRef.current) {
        clearTimeout(autoAnswerTimerRef.current);
      }
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
    isRecording,
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
    toggleRecording,
    setOnRecordingSaved,
    getCurrentRecordingId,
  };
}
