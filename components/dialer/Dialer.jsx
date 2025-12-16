"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  BellOff,
  Circle,
  Delete,
  User,
} from "lucide-react";

const dialPadButtons = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export default function Dialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isDND, setIsDND] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const handleDigitPress = useCallback((digit) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber((prev) => prev + digit);
    }
  }, [phoneNumber.length]);

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (phoneNumber.length > 0 || isInCall) {
      setIsInCall(!isInCall);
      if (isInCall) {
        // End call - reset states
        setIsMuted(false);
        setIsOnHold(false);
        setIsRecording(false);
        setCallDuration(0);
      }
    }
  }, [phoneNumber.length, isInCall]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent handling if user is typing in an input field
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      const key = e.key;

      // Number keys (0-9)
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleDigitPress(key);
      }
      // Star and hash
      else if (key === "*" || key === "#") {
        e.preventDefault();
        handleDigitPress(key);
      }
      // Backspace to delete
      else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      }
      // Enter to call/end call
      else if (key === "Enter") {
        e.preventDefault();
        handleCall();
      }
      // Escape to clear number or end call
      else if (key === "Escape") {
        e.preventDefault();
        if (isInCall) {
          handleCall();
        } else {
          setPhoneNumber("");
        }
      }
      // M to toggle mute (only in call)
      else if (key.toLowerCase() === "m" && isInCall) {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
      // H to toggle hold (only in call)
      else if (key.toLowerCase() === "h" && isInCall) {
        e.preventDefault();
        setIsOnHold((prev) => !prev);
      }
      // R to toggle recording (only in call)
      else if (key.toLowerCase() === "r" && isInCall) {
        e.preventDefault();
        setIsRecording((prev) => !prev);
      }
      // D to toggle DND
      else if (key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDND((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleCall, isInCall]);

  const formatPhoneNumber = (number) => {
    if (number.length === 0) return "";
    // Simple formatting for display
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl border-border/50 bg-card/95 backdrop-blur">
        <CardContent className="p-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">BKK Dialer</p>
                <p className="text-xs text-muted-foreground">
                  {isDND ? "Do Not Disturb" : "Available"}
                </p>
              </div>
            </div>
            {isDND && (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                DND
              </Badge>
            )}
          </div>

          {/* Display */}
          <div className="bg-muted/50 rounded-xl p-4 mb-4 min-h-[80px] flex flex-col items-center justify-center">
            {isInCall && (
              <Badge variant="outline" className="mb-2 text-xs bg-green-500/10 text-green-600 border-green-500/30">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                In Call
              </Badge>
            )}
            <p className={cn(
              "text-2xl font-semibold tracking-wider text-center transition-all",
              phoneNumber ? "text-foreground" : "text-muted-foreground"
            )}>
              {formatPhoneNumber(phoneNumber) || "Enter number"}
            </p>
            {isRecording && isInCall && (
              <div className="flex items-center gap-1 mt-2 text-destructive">
                <Circle className="w-3 h-3 fill-destructive animate-pulse" />
                <span className="text-xs">Recording</span>
              </div>
            )}
          </div>

          {/* Dial Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {dialPadButtons.map((btn) => (
              <Button
                key={btn.digit}
                variant="secondary"
                className="h-16 text-xl font-semibold hover:bg-accent hover:scale-105 transition-all duration-150 flex flex-col items-center justify-center gap-0"
                onClick={() => handleDigitPress(btn.digit)}
              >
                <span>{btn.digit}</span>
                {btn.letters && (
                  <span className="text-[10px] font-normal text-muted-foreground tracking-widest">
                    {btn.letters}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Backspace */}
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleBackspace}
              disabled={phoneNumber.length === 0}
            >
              <Delete className="w-5 h-5" />
            </Button>

            {/* Call Button */}
            <Button
              variant={isInCall ? "destructive" : "default"}
              size="icon"
              className={cn(
                "h-16 w-16 rounded-full transition-all duration-200",
                isInCall
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-green-600 hover:bg-green-700",
                "shadow-lg hover:shadow-xl hover:scale-105"
              )}
              onClick={handleCall}
              disabled={!isInCall && phoneNumber.length === 0}
            >
              {isInCall ? (
                <PhoneOff className="w-6 h-6 text-white" />
              ) : (
                <Phone className="w-6 h-6 text-white" />
              )}
            </Button>

            {/* Placeholder for symmetry */}
            <div className="h-12 w-12" />
          </div>

          {/* In-Call Controls */}
          {isInCall && (
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border">
              {/* Mute */}
              <Button
                variant={isMuted ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  isMuted && "bg-primary"
                )}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                <span className="text-xs">Mute</span>
              </Button>

              {/* Hold */}
              <Button
                variant={isOnHold ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  isOnHold && "bg-primary"
                )}
                onClick={() => setIsOnHold(!isOnHold)}
              >
                {isOnHold ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
                <span className="text-xs">Hold</span>
              </Button>

              {/* Record */}
              <Button
                variant={isRecording ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  isRecording && "bg-destructive hover:bg-destructive/90"
                )}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Circle className={cn("w-5 h-5", isRecording && "fill-current")} />
                <span className="text-xs">Record</span>
              </Button>

              {/* DND */}
              <Button
                variant={isDND ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  isDND && "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={() => setIsDND(!isDND)}
              >
                <BellOff className="w-5 h-5" />
                <span className="text-xs">DND</span>
              </Button>
            </div>
          )}

          {/* DND Toggle when not in call */}
          {!isInCall && (
            <div className="pt-4 border-t border-border">
              <Button
                variant={isDND ? "default" : "outline"}
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  isDND && "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={() => setIsDND(!isDND)}
              >
                <BellOff className="w-4 h-4" />
                <span>{isDND ? "Disable" : "Enable"} Do Not Disturb</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
