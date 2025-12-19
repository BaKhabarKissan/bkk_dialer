"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Volume2,
  Network,
  Phone,
  HardDrive,
  Play,
  Square,
  PhoneForwarded,
} from "lucide-react";
import { useSettings } from "@/lib/store/hooks";
import { availableCodecs, defaultSettings } from "@/lib/store/settingsSlice";
import { cn } from "@/lib/utils";

function SettingRow({ label, children, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-2", className)}>
      <Label className="text-sm text-muted-foreground shrink-0">{label}</Label>
      <div className="flex-1 flex sm:justify-end">{children}</div>
    </div>
  );
}

function SettingCheckbox({ label, checked, onCheckedChange, description }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <div className="flex-1">
        <Label className="text-sm cursor-pointer" onClick={() => onCheckedChange(!checked)}>
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function CodecList({ available, enabled, onMove }) {
  const [selectedAvailable, setSelectedAvailable] = useState(null);
  const [selectedEnabled, setSelectedEnabled] = useState(null);

  const availableCodecsList = available.filter((c) => !enabled.includes(c.id));

  const handleAddSelected = () => {
    if (selectedAvailable) {
      onMove(selectedAvailable, "add");
      setSelectedAvailable(null);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedEnabled) {
      onMove(selectedEnabled, "remove");
      setSelectedEnabled(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground mb-1 block">Available</Label>
        <div className="border rounded-md h-24 sm:h-32 overflow-auto p-1">
          {availableCodecsList.map((codec) => (
            <div
              key={codec.id}
              className={cn(
                "text-xs px-2 py-1 rounded cursor-pointer",
                selectedAvailable === codec.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
              onClick={() => setSelectedAvailable(codec.id)}
              onDoubleClick={() => onMove(codec.id, "add")}
            >
              {codec.name}
            </div>
          ))}
        </div>
      </div>
      <div className="flex sm:flex-col justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={handleAddSelected}
          disabled={!selectedAvailable}
        >
          <span className="sm:hidden">↓</span>
          <span className="hidden sm:inline">→</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={handleRemoveSelected}
          disabled={!selectedEnabled}
        >
          <span className="sm:hidden">↑</span>
          <span className="hidden sm:inline">←</span>
        </Button>
      </div>
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground mb-1 block">Enabled</Label>
        <div className="border rounded-md h-24 sm:h-32 overflow-auto p-1">
          {enabled.map((id) => {
            const codec = available.find((c) => c.id === id);
            return codec ? (
              <div
                key={id}
                className={cn(
                  "text-xs px-2 py-1 rounded cursor-pointer",
                  selectedEnabled === id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
                onClick={() => setSelectedEnabled(id)}
                onDoubleClick={() => onMove(id, "remove")}
              >
                {codec.name}
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

export default function Settings({ trigger }) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [devices, setDevices] = useState({
    audioInput: [],
    audioOutput: [],
  });
  const [isPlayingRingtone, setIsPlayingRingtone] = useState(false);
  const audioRef = useRef(null);

  // Enumerate media devices
  useEffect(() => {
    async function enumerateDevices() {
      try {
        // Request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        }).catch(() => {
          // Permission denied, continue with limited device info
        });

        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          audioInput: deviceList.filter(d => d.kind === "audioinput"),
          audioOutput: deviceList.filter(d => d.kind === "audiooutput"),
        });
      } catch (error) {
        console.error("Failed to enumerate devices:", error);
      }
    }

    if (open) {
      enumerateDevices();
    }
  }, [open]);

  // Handle ringtone playback
  const toggleRingtone = () => {
    if (isPlayingRingtone) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingRingtone(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = localSettings.ringtone || "/sounds/ringtone.mp3";
      audioRef.current.volume = localSettings.ringtoneVolume / 100;
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.error("Failed to play ringtone:", err));
      setIsPlayingRingtone(true);
    }
  };

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingRingtone(false);
  };

  const handleOpenChange = (isOpen) => {
    if (isOpen) {
      setLocalSettings(settings);
    } else {
      stopRingtone();
    }
    setOpen(isOpen);
  };

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCodecMove = (codecId, action) => {
    setLocalSettings((prev) => {
      const enabled = [...prev.enabledAudioCodecs];
      if (action === "add" && !enabled.includes(codecId)) {
        enabled.push(codecId);
      } else if (action === "remove") {
        const index = enabled.indexOf(codecId);
        if (index > -1) enabled.splice(index, 1);
      }
      return { ...prev, enabledAudioCodecs: enabled };
    });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setOpen(false);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(defaultSettings);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-6xl h-[90vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="call" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-3 sm:px-6 justify-start rounded-none bg-transparent h-auto py-0 shrink-0">
            <TabsTrigger value="call" className="px-2 sm:px-3">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="px-2 sm:px-3">
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="px-2 sm:px-3">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Network</span>
            </TabsTrigger>
            <TabsTrigger value="recording" className="px-2 sm:px-3">
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Recording</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Call Settings */}
            <TabsContent value="call" className="m-0 p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Auto Answer</h3>
                  <SettingRow label="Auto Answer">
                    <Select
                      value={localSettings.autoAnswer}
                      onValueChange={(v) => handleChange("autoAnswer", v)}
                    >
                      <SelectTrigger className="w-32 sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="3sec">After 3 sec</SelectItem>
                        <SelectItem value="5sec">After 5 sec</SelectItem>
                        <SelectItem value="10sec">After 10 sec</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <Separator />

                  <h3 className="font-semibold text-base">DTMF</h3>
                  <SettingRow label="DTMF Method">
                    <Select
                      value={localSettings.dtmfMethod}
                      onValueChange={(v) => handleChange("dtmfMethod", v)}
                    >
                      <SelectTrigger className="w-32 sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="rfc2833">RFC 2833</SelectItem>
                        <SelectItem value="info">SIP INFO</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <Separator />

                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <PhoneForwarded className="w-4 h-4" />
                    Call Forwarding
                  </h3>
                  <SettingCheckbox
                    label="Enable Call Forwarding"
                    description="Forward incoming calls to another number"
                    checked={localSettings.callForwardingEnabled}
                    onCheckedChange={(v) => handleChange("callForwardingEnabled", v)}
                  />
                  {localSettings.callForwardingEnabled && (
                    <>
                      <SettingRow label="Forward When">
                        <Select
                          value={localSettings.callForwardingType}
                          onValueChange={(v) => handleChange("callForwardingType", v)}
                        >
                          <SelectTrigger className="w-32 sm:w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="busy">When Busy</SelectItem>
                            <SelectItem value="noanswer">No Answer</SelectItem>
                            <SelectItem value="unreachable">Unreachable</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>
                      <SettingRow label="Forward To">
                        <Input
                          className="w-32 sm:w-40"
                          placeholder="Phone number"
                          value={localSettings.callForwardingNumber}
                          onChange={(e) => handleChange("callForwardingNumber", e.target.value)}
                        />
                      </SettingRow>
                      {localSettings.callForwardingType === "noanswer" && (
                        <SettingRow label="Delay (seconds)">
                          <Select
                            value={String(localSettings.callForwardingNoAnswerDelay)}
                            onValueChange={(v) => handleChange("callForwardingNoAnswerDelay", parseInt(v))}
                          >
                            <SelectTrigger className="w-32 sm:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 seconds</SelectItem>
                              <SelectItem value="15">15 seconds</SelectItem>
                              <SelectItem value="20">20 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="45">45 seconds</SelectItem>
                              <SelectItem value="60">60 seconds</SelectItem>
                            </SelectContent>
                          </Select>
                        </SettingRow>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Interface</h3>
                  <div className="space-y-1">
                    <SettingCheckbox
                      label="Sound Events"
                      description="Play sounds for call events"
                      checked={localSettings.soundEvents}
                      onCheckedChange={(v) => handleChange("soundEvents", v)}
                    />
                    <SettingCheckbox
                      label="Show Notifications"
                      description="Show browser notifications for incoming calls"
                      checked={localSettings.showNotifications}
                      onCheckedChange={(v) => handleChange("showNotifications", v)}
                    />
                    <SettingCheckbox
                      label="Enable Debug Log"
                      description="Log debug information to console"
                      checked={localSettings.enableDebugLog}
                      onCheckedChange={(v) => handleChange("enableDebugLog", v)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Audio Settings */}
            <TabsContent value="audio" className="m-0 p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Ringtone</h3>
                  <SettingRow label="Ringtone">
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-28 sm:w-40"
                        placeholder="/sounds/ringtone.mp3"
                        value={localSettings.ringtone}
                        onChange={(e) => handleChange("ringtone", e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={toggleRingtone}
                      >
                        {isPlayingRingtone ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </SettingRow>
                  <SettingRow label="Volume">
                    <div className="flex items-center gap-2 w-36 sm:w-48">
                      <Slider
                        value={[localSettings.ringtoneVolume]}
                        onValueChange={([v]) => handleChange("ringtoneVolume", v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-8">{localSettings.ringtoneVolume}%</span>
                    </div>
                  </SettingRow>

                  <Separator />

                  <h3 className="font-semibold text-base">Devices</h3>
                  <SettingRow label="Speaker">
                    <Select
                      value={localSettings.speaker}
                      onValueChange={(v) => handleChange("speaker", v)}
                    >
                      <SelectTrigger className="w-36 sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        {devices.audioOutput.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow label="Microphone">
                    <Select
                      value={localSettings.microphone}
                      onValueChange={(v) => handleChange("microphone", v)}
                    >
                      <SelectTrigger className="w-36 sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        {devices.audioInput.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <Separator />

                  <h3 className="font-semibold text-base">Audio Processing</h3>
                  <div className="space-y-1">
                    <SettingCheckbox
                      label="Echo Cancellation"
                      description="Reduce echo during calls"
                      checked={localSettings.echoCancellation}
                      onCheckedChange={(v) => handleChange("echoCancellation", v)}
                    />
                    <SettingCheckbox
                      label="Noise Suppression"
                      description="Reduce background noise"
                      checked={localSettings.noiseSuppression}
                      onCheckedChange={(v) => handleChange("noiseSuppression", v)}
                    />
                    <SettingCheckbox
                      label="Auto Gain Control"
                      description="Automatically adjust microphone volume"
                      checked={localSettings.autoGainControl}
                      onCheckedChange={(v) => handleChange("autoGainControl", v)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Audio Codecs</h3>
                  <p className="text-xs text-muted-foreground">
                    Select and order preferred audio codecs. WebRTC will negotiate the best available codec.
                  </p>
                  <CodecList
                    available={availableCodecs}
                    enabled={localSettings.enabledAudioCodecs}
                    onMove={handleCodecMove}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Network Settings */}
            <TabsContent value="network" className="m-0 p-4 sm:p-6">
              <div className="max-w-lg space-y-4">
                <h3 className="font-semibold text-base">STUN Server</h3>
                <p className="text-xs text-muted-foreground">
                  STUN server helps establish peer-to-peer connections through NAT.
                </p>
                <SettingRow label="STUN Server">
                  <Input
                    className="w-full sm:w-64"
                    placeholder="stun:server:port"
                    value={localSettings.stunServer}
                    onChange={(e) => handleChange("stunServer", e.target.value)}
                  />
                </SettingRow>

                <Separator />

                <h3 className="font-semibold text-base">TURN Server</h3>
                <p className="text-xs text-muted-foreground">
                  TURN server relays media when direct connection is not possible.
                </p>
                <SettingRow label="TURN Server">
                  <Input
                    className="w-full sm:w-64"
                    placeholder="turn:server:port"
                    value={localSettings.turnServer}
                    onChange={(e) => handleChange("turnServer", e.target.value)}
                  />
                </SettingRow>
                {localSettings.turnServer && (
                  <>
                    <SettingRow label="Username">
                      <Input
                        className="w-full sm:w-48"
                        placeholder="Username"
                        value={localSettings.turnUsername}
                        onChange={(e) => handleChange("turnUsername", e.target.value)}
                      />
                    </SettingRow>
                    <SettingRow label="Password">
                      <Input
                        className="w-full sm:w-48"
                        type="password"
                        placeholder="Password"
                        value={localSettings.turnPassword}
                        onChange={(e) => handleChange("turnPassword", e.target.value)}
                      />
                    </SettingRow>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Recording Settings */}
            <TabsContent value="recording" className="m-0 p-4 sm:p-6">
              <div className="max-w-md space-y-4">
                <SettingCheckbox
                  label="Enable Call Recording"
                  description="Record calls locally in your browser"
                  checked={localSettings.callRecording}
                  onCheckedChange={(v) => handleChange("callRecording", v)}
                />

                {localSettings.callRecording && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Recordings will be saved as WebM files and downloaded to your browser&apos;s default download folder when the call ends.
                  </p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t shrink-0 grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="col-span-2 order-3 sm:order-1">
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="order-1 sm:order-2">
            Cancel
          </Button>
          <Button onClick={handleSave} className="order-2 sm:order-3">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
