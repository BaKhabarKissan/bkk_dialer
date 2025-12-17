"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

// Get initials from name or number
function getInitials(name, number) {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (number) {
    return number.slice(-2);
  }
  return "?";
}

// Format phone number for display
function formatPhoneNumber(number) {
  if (!number) return "Unknown";
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return number;
}

export default function CallDialog({
  isOpen,
  direction, // "incoming" | "outgoing"
  status, // "ringing" | "connecting" | "in_call"
  callerName,
  callerNumber,
  onAnswer,
  onReject,
  onHangup,
  onToggleMute,
  onToggleSpeaker,
  isMuted = false,
  isSpeakerMuted = false,
}) {
  const [callDuration, setCallDuration] = useState(0);
  const [pulseIndex, setPulseIndex] = useState(0);
  const prevStatusRef = useRef(status);

  // Call duration timer
  useEffect(() => {
    // Reset duration when transitioning to in_call from another state
    if (status === "in_call" && prevStatusRef.current !== "in_call") {
      queueMicrotask(() => setCallDuration(0));
    }
    prevStatusRef.current = status;

    if (status !== "in_call") {
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Pulse animation for ringing
  useEffect(() => {
    if (status !== "ringing" && status !== "connecting") return;

    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 3);
    }, 300);

    return () => clearInterval(interval);
  }, [status]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const isIncoming = direction === "incoming";
      const isRinging = status === "ringing";
      const isInCall = status === "in_call";

      switch (e.key) {
        case "Enter":
          if (isIncoming && isRinging && onAnswer) {
            e.preventDefault();
            onAnswer();
          }
          break;
        case "Escape":
          e.preventDefault();
          if (isIncoming && isRinging && onReject) {
            onReject();
          } else if (onHangup) {
            onHangup();
          }
          break;
        case "m":
        case "M":
          if (isInCall && onToggleMute) {
            e.preventDefault();
            onToggleMute();
          }
          break;
        case "s":
        case "S":
          if (isInCall && onToggleSpeaker) {
            e.preventDefault();
            onToggleSpeaker();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, direction, status, onAnswer, onReject, onHangup, onToggleMute, onToggleSpeaker]);

  // Format duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isIncoming = direction === "incoming";
  const isRinging = status === "ringing";
  const isConnecting = status === "connecting";
  const isInCall = status === "in_call";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center gap-6 p-8"
          >
            {/* Call Direction Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              {isIncoming ? (
                <>
                  <PhoneIncoming className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Incoming Call</span>
                </>
              ) : (
                <>
                  <PhoneOutgoing className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">
                    {isConnecting ? "Calling..." : isInCall ? "On Call" : "Outgoing Call"}
                  </span>
                </>
              )}
            </motion.div>

            {/* Avatar with Pulse Animation */}
            <div className="relative">
              {/* Pulse rings for ringing state */}
              {(isRinging || isConnecting) && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "absolute inset-0 rounded-full border-2",
                        isIncoming ? "border-blue-500/30" : "border-green-500/30"
                      )}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{
                        scale: [1, 1.5, 2],
                        opacity: [0.5, 0.25, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </>
              )}

              {/* Avatar */}
              <motion.div
                animate={
                  isRinging
                    ? {
                        scale: [1, 1.05, 1],
                        rotate: [0, -5, 5, -5, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 0.5,
                  repeat: isRinging ? Infinity : 0,
                  repeatDelay: 0.5,
                }}
              >
                <Avatar className={cn(
                  "w-32 h-32 border-4",
                  isIncoming ? "border-blue-500/50" : "border-green-500/50",
                  isInCall && "border-green-500"
                )}>
                  <AvatarFallback className={cn(
                    "text-3xl font-bold",
                    isIncoming ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"
                  )}>
                    {getInitials(callerName, callerNumber)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* In-call indicator */}
              {isInCall && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Phone className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>

            {/* Caller Info */}
            <div className="text-center space-y-2">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold"
              >
                {callerName || formatPhoneNumber(callerNumber) || "Unknown"}
              </motion.h2>
              {callerName && callerNumber && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-muted-foreground font-mono"
                >
                  {formatPhoneNumber(callerNumber)}
                </motion.p>
              )}

              {/* Call Status / Duration */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-2 mt-4"
              >
                {isRinging && isIncoming && (
                  <span className="text-blue-500 animate-pulse font-medium">
                    Ringing...
                  </span>
                )}
                {isRinging && !isIncoming && (
                  <span className="text-green-500 animate-pulse font-medium">
                    Ringing
                    <span className="inline-flex ml-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ opacity: pulseIndex >= i ? 1 : 0.3 }}
                          className="mx-px"
                        >
                          •
                        </motion.span>
                      ))}
                    </span>
                  </span>
                )}
                {isConnecting && (
                  <span className="text-amber-500 animate-pulse font-medium">
                    Connecting...
                  </span>
                )}
                {isInCall && (
                  <div className="flex items-center gap-2 text-green-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-mono text-lg">{formatDuration(callDuration)}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mt-4"
            >
              {/* Incoming Call: Answer & Reject */}
              {isIncoming && isRinging && (
                <>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="h-16 w-16 rounded-full shadow-lg"
                      onClick={onReject}
                    >
                      <PhoneOff className="w-7 h-7" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
                      onClick={onAnswer}
                    >
                      <Phone className="w-7 h-7" />
                    </Button>
                  </motion.div>
                </>
              )}

              {/* Outgoing Call (Ringing/Connecting): Hangup */}
              {!isIncoming && (isRinging || isConnecting) && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-16 w-16 rounded-full shadow-lg"
                    onClick={onHangup}
                  >
                    <PhoneOff className="w-7 h-7" />
                  </Button>
                </motion.div>
              )}

              {/* In Call: Mute & Hangup */}
              {isInCall && (
                <>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant={isMuted ? "default" : "outline"}
                      className={cn(
                        "h-14 w-14 rounded-full shadow-lg",
                        isMuted && "bg-primary"
                      )}
                      onClick={onToggleMute}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="h-16 w-16 rounded-full shadow-lg"
                      onClick={onHangup}
                    >
                      <PhoneOff className="w-7 h-7" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant={isSpeakerMuted ? "default" : "outline"}
                      className={cn(
                        "h-14 w-14 rounded-full shadow-lg",
                        isSpeakerMuted && "bg-primary"
                      )}
                      onClick={onToggleSpeaker}
                    >
                      {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Keyboard Hints */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-muted-foreground mt-4 space-x-4"
            >
              {isIncoming && isRinging && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
                    Answer
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                    Reject
                  </span>
                </>
              )}
              {isInCall && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">M</kbd>
                    Mute
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">S</kbd>
                    Speaker
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                    Hangup
                  </span>
                </>
              )}
              {!isIncoming && !isInCall && (
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                  Cancel
                </span>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
