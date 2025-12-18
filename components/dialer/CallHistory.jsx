"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Phone,
  Clock,
  Trash2,
  Calendar,
  Dot,
  Play,
  Square,
  Download,
  Mic,
} from "lucide-react";
import { useCallLogs } from "@/lib/store/hooks";
import { getRecording, downloadRecording, deleteRecording } from "@/lib/recordingsStorage";

// Helper to format duration
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper to format time
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Helper to get date label
function getDateLabel(isoString) {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
}

// Helper to get date key for grouping
function getDateKey(isoString) {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Get call icon based on direction and status
function getCallIcon(direction, status) {
  if (status === "missed" || status === "rejected") {
    return <PhoneMissed className="w-4 h-4 text-red-500" />;
  }
  if (direction === "incoming") {
    return <PhoneIncoming className="w-4 h-4 text-green-500" />;
  }
  return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
}

// Get status badge
function getStatusBadge(status) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
          Completed
        </Badge>
      );
    case "missed":
      return (
        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30">
          Missed
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
          Rejected
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
          Failed
        </Badge>
      );
    case "no_answer":
    case "connecting":
      return (
        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
          No Answer
        </Badge>
      );
    case "ringing":
      return (
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
          Cancelled
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
          In Progress
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
          Unknown
        </Badge>
      );
  }
}

function CallLogItem({ log, onCall, onDelete, onPlayRecording, onDownloadRecording, playingRecordingId, index }) {
  const hasRecording = !!log.recordingId;
  const isPlaying = playingRecordingId === log.recordingId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-2 hover:bg-accent/50 transition-colors group">
        <div className="flex items-center gap-4">
          {/* Call Icon */}
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            {getCallIcon(log.direction, log.status)}
          </div>

          {/* Call Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {log.name || log.number || "Unknown"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              {log.name && log.number && (
                <span className="truncate">{log.number}</span>
              )}
              <Dot />
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(log.time)}
              </span>
              {log.status === "completed" && <Dot />}
              {log.duration > 0 && (
                <span>{formatDuration(log.duration)}</span>
              )}
            </div>
          </div>

          {/* Recording Badge */}
          {hasRecording && (
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30 gap-1">
              <Mic className="w-3 h-3" />
              Recorded
            </Badge>
          )}

          <div className="px-4">
            {getStatusBadge(log.status)}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Recording Playback Controls */}
            {hasRecording && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isPlaying ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : "text-primary hover:text-primary hover:bg-primary/10"
                  )}
                  onClick={() => onPlayRecording(log.recordingId)}
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                  onClick={() => onDownloadRecording(log.recordingId, log.number, log.time)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-500/10"
              onClick={() => onCall(log.number)}
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(log.id, log.recordingId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function DateGroup({ label, logs, onCall, onDelete, onPlayRecording, onDownloadRecording, playingRecordingId }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Date Header */}
      <div className="flex items-center gap-3 px-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Badge variant={"secondary"} className="text-sm font-semibold italic text-primary">
          {label}
        </Badge>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Logs */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {logs.map((log, index) => (
            <CallLogItem
              key={log.id}
              log={log}
              onCall={onCall}
              onDelete={onDelete}
              onPlayRecording={onPlayRecording}
              onDownloadRecording={onDownloadRecording}
              playingRecordingId={playingRecordingId}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function CallHistory({ onCallNumber }) {
  const { logs, deleteLog, clearLogs } = useCallLogs();
  const [playingRecordingId, setPlayingRecordingId] = useState(null);
  const audioRef = useRef(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, []);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups = {};

    logs.forEach((log) => {
      const key = getDateKey(log.time);
      if (!groups[key]) {
        groups[key] = {
          label: getDateLabel(log.time),
          logs: [],
          timestamp: new Date(log.time).getTime(),
        };
      }
      groups[key].logs.push(log);
    });

    // Sort groups by timestamp (most recent first)
    return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
  }, [logs]);

  const handleCall = (number) => {
    if (number && onCallNumber) {
      onCallNumber(number);
    }
  };

  // Handle recording playback
  const handlePlayRecording = async (recordingId) => {
    // Stop current playback if playing the same recording
    if (playingRecordingId === recordingId) {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      setPlayingRecordingId(null);
      return;
    }

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    }

    try {
      const recording = await getRecording(recordingId);
      if (!recording || !recording.blob) {
        console.error("Recording not found:", recordingId);
        return;
      }

      const url = URL.createObjectURL(recording.blob);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingRecordingId(null);
      };
      audioRef.current.play();
      setPlayingRecordingId(recordingId);
    } catch (err) {
      console.error("Failed to play recording:", err);
    }
  };

  // Handle recording download
  const handleDownloadRecording = async (recordingId, number, time) => {
    try {
      const recording = await getRecording(recordingId);
      if (!recording || !recording.blob) {
        console.error("Recording not found:", recordingId);
        return;
      }

      const dateStr = new Date(time).toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `call_${number || "unknown"}_${dateStr}.webm`;
      downloadRecording(recording.blob, filename);
    } catch (err) {
      console.error("Failed to download recording:", err);
    }
  };

  // Handle delete with recording cleanup
  const handleDelete = async (logId, recordingId) => {
    if (recordingId) {
      try {
        // Stop playback if playing this recording
        if (playingRecordingId === recordingId) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setPlayingRecordingId(null);
        }
        await deleteRecording(recordingId);
      } catch (err) {
        console.error("Failed to delete recording:", err);
      }
    }
    deleteLog(logId);
  };

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Phone className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">No Call History</h3>
            <p className="text-muted-foreground mt-1">
              Your recent calls will appear here
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">Call History</h2>
          <p className="text-sm text-muted-foreground">
            {logs.length} {logs.length === 1 ? "call" : "calls"}
          </p>
        </div>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={clearLogs}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Logs List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {groupedLogs.map((group) => (
            <DateGroup
              key={group.label}
              label={group.label}
              logs={group.logs}
              onCall={handleCall}
              onDelete={handleDelete}
              onPlayRecording={handlePlayRecording}
              onDownloadRecording={handleDownloadRecording}
              playingRecordingId={playingRecordingId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
