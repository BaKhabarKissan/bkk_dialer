"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Phone,
  Mic,
  MicOff,
  Pause,
  Play,
  BellOff,
  Circle,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { RegistrationStatus } from "@/lib/sip/useSip";
import Settings from "./Settings";
import CallLogs from "./CallLogs";

export default function Sidebar({
  // User info
  displayName,
  // Registration
  registrationStatus,
  isRegistered,
  isConfigured,
  error,
  onConnect,
  onDisconnect,
  // DND
  isDND,
  onToggleDND,
  // Call state
  isInCall,
  isMuted,
  isOnHold,
  isRecording,
  onToggleMute,
  onToggleHold,
  onToggleRecording,
  // Callbacks
  onCallNumber,
}) {
  const getStatusBadge = () => {
    switch (registrationStatus) {
      case RegistrationStatus.REGISTERED:
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <Wifi className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case RegistrationStatus.REGISTERING:
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting
          </Badge>
        );
      case RegistrationStatus.FAILED:
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <WifiOff className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <WifiOff className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        );
    }
  };

  return (
    <div className="w-64 border-r border-border bg-muted/30 p-4 flex flex-col">
      {/* Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {displayName || "BKK Dialer"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isDND ? "Do Not Disturb" : isRegistered ? "Available" : "Offline"}
          </p>
        </div>
      </div>

      {/* Registration Status */}
      <div className="mb-4">{getStatusBadge()}</div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Settings */}
      <Settings
        trigger={
          <Button variant="outline" className="w-full justify-start gap-2 mb-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        }
      />

      {/* Call Logs */}
      <CallLogs onCallNumber={onCallNumber} />

      <div className="my-4 border-t border-border" />

      {/* DND Toggle */}
      <Button
        variant={isDND ? "default" : "outline"}
        className={cn(
          "w-full justify-start gap-2 mb-4",
          isDND && "bg-amber-600 hover:bg-amber-700"
        )}
        onClick={onToggleDND}
      >
        <BellOff className="w-4 h-4" />
        <span>Do Not Disturb</span>
        <kbd className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded">
          D
        </kbd>
      </Button>

      {/* Connect/Disconnect */}
      {isConfigured && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 mb-4"
          onClick={() => (isRegistered ? onDisconnect() : onConnect())}
          disabled={registrationStatus === RegistrationStatus.REGISTERING}
        >
          {registrationStatus === RegistrationStatus.REGISTERING ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRegistered ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          <span>{isRegistered ? "Disconnect" : "Connect"}</span>
        </Button>
      )}

      {/* In-Call Controls */}
      {isInCall && (
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Call Controls
          </p>

          <Button
            variant={isMuted ? "default" : "outline"}
            className={cn("w-full justify-start gap-2", isMuted && "bg-primary")}
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
            <kbd className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded">
              M
            </kbd>
          </Button>

          <Button
            variant={isOnHold ? "default" : "outline"}
            className={cn("w-full justify-start gap-2", isOnHold && "bg-primary")}
            onClick={onToggleHold}
          >
            {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isOnHold ? "Resume" : "Hold"}</span>
            <kbd className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded">
              H
            </kbd>
          </Button>

          <Button
            variant={isRecording ? "default" : "outline"}
            className={cn(
              "w-full justify-start gap-2",
              isRecording && "bg-destructive hover:bg-destructive/90"
            )}
            onClick={onToggleRecording}
          >
            <Circle className={cn("w-4 h-4", isRecording && "fill-current")} />
            <span>{isRecording ? "Stop Rec" : "Record"}</span>
            <kbd className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded">
              R
            </kbd>
          </Button>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Shortcuts</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Call/End</span>
            <kbd className="bg-muted px-1.5 py-0.5 rounded">Enter</kbd>
          </div>
          <div className="flex justify-between">
            <span>Clear/Reject</span>
            <kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
