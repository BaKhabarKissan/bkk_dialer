"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
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

  const dialClickSound = useRef(null);

  useEffect(() => {
    dialClickSound.current = new Audio("/sounds/dial-click.mp3");
    dialClickSound.current.volume = 0.5;
  }, []);

  const playDialSound = useCallback(() => {
    if (dialClickSound.current) {
      dialClickSound.current.currentTime = 0;
      dialClickSound.current.play().catch(() => {});
    }
  }, []);

  const handleDigitPress = useCallback(
    (digit) => {
      playDialSound();
      if (phoneNumber.length < 15) {
        setPhoneNumber((prev) => prev + digit);
      }
    },
    [phoneNumber.length, playDialSound]
  );

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (phoneNumber.length > 0 || isInCall) {
      setIsInCall(!isInCall);
      if (isInCall) {
        setIsMuted(false);
        setIsOnHold(false);
        setIsRecording(false);
      }
    }
  }, [phoneNumber.length, isInCall]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleDigitPress(key);
      } else if (key === "*" || key === "#") {
        e.preventDefault();
        handleDigitPress(key);
      } else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (key === "Enter") {
        e.preventDefault();
        handleCall();
      } else if (key === "Escape") {
        e.preventDefault();
        if (isInCall) {
          handleCall();
        } else {
          setPhoneNumber("");
        }
      } else if (key.toLowerCase() === "m" && isInCall) {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (key.toLowerCase() === "h" && isInCall) {
        e.preventDefault();
        setIsOnHold((prev) => !prev);
      } else if (key.toLowerCase() === "r" && isInCall) {
        e.preventDefault();
        setIsRecording((prev) => !prev);
      } else if (key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDND((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleCall, isInCall]);

  const formatPhoneNumber = (number) => {
    if (number.length === 0) return "";
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex">
      {/* Left Panel - Call Controls */}
      <div className="w-64 border-r border-border bg-muted/30 p-4 flex flex-col">
        {/* Status */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">BKK Dialer</p>
            <p className="text-xs text-muted-foreground">
              {isDND ? "Do Not Disturb" : "Available"}
            </p>
          </div>
        </div>

        {/* DND Toggle */}
        <Button
          variant={isDND ? "default" : "outline"}
          className={cn(
            "w-full justify-start gap-2 mb-4",
            isDND && "bg-amber-600 hover:bg-amber-700"
          )}
          onClick={() => setIsDND(!isDND)}
        >
          <BellOff className="w-4 h-4" />
          <span>Do Not Disturb</span>
          <kbd className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded">
            D
          </kbd>
        </Button>

        {/* In-Call Controls */}
        {isInCall && (
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Call Controls
            </p>

            <Button
              variant={isMuted ? "default" : "outline"}
              className={cn("w-full justify-start gap-2", isMuted && "bg-primary")}
              onClick={() => setIsMuted(!isMuted)}
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
              onClick={() => setIsOnHold(!isOnHold)}
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
              onClick={() => setIsRecording(!isRecording)}
            >
              <Circle
                className={cn("w-4 h-4", isRecording && "fill-current")}
              />
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
              <span>Clear</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel - Dialer */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-6 shadow-lg">
          {/* Display */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              {isInCall ? (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-600 border-green-500/30"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  In Call
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Enter number
                </span>
              )}
              {isRecording && isInCall && (
                <div className="flex items-center gap-1 text-destructive">
                  <Circle className="w-3 h-3 fill-destructive animate-pulse" />
                  <span className="text-xs">REC</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-3xl font-mono tracking-wider flex-1",
                  phoneNumber ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {formatPhoneNumber(phoneNumber) || "___-___-____"}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleBackspace}
                disabled={phoneNumber.length === 0}
              >
                <Delete className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Dial Pad */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {dialPadButtons.map((btn) => (
              <Button
                key={btn.digit}
                variant="secondary"
                className="h-14 text-lg font-medium hover:bg-accent transition-colors flex flex-col items-center justify-center gap-0"
                onClick={() => handleDigitPress(btn.digit)}
              >
                <span>{btn.digit}</span>
                {btn.letters && (
                  <span className="text-[9px] font-normal text-muted-foreground tracking-widest">
                    {btn.letters}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Call Button */}
          <Button
            variant={isInCall ? "destructive" : "default"}
            className={cn(
              "w-full h-12 text-base font-medium gap-2",
              !isInCall && "bg-green-600 hover:bg-green-700"
            )}
            onClick={handleCall}
            disabled={!isInCall && phoneNumber.length === 0}
          >
            {isInCall ? (
              <>
                <PhoneOff className="w-5 h-5" />
                End Call
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Call
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
