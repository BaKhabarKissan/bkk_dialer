"use client";

import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Volume2,
  Mic,
  Video,
  Network,
  Phone,
  HardDrive,
  Monitor,
} from "lucide-react";
import { useSettings, availableCodecs } from "@/lib/sip/SettingsContext";
import { cn } from "@/lib/utils";

function SettingRow({ label, children, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2", className)}>
      <Label className="text-sm text-muted-foreground shrink-0">{label}</Label>
      <div className="flex-1 flex justify-end">{children}</div>
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
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground mb-1 block">Available</Label>
        <div className="border rounded-md h-32 overflow-auto p-1">
          {available
            .filter((c) => !enabled.includes(c.id))
            .map((codec) => (
              <div
                key={codec.id}
                className="text-xs px-2 py-1 hover:bg-accent rounded cursor-pointer"
                onClick={() => onMove(codec.id, "add")}
              >
                {codec.name}
              </div>
            ))}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-1">
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => { }}>
          →
        </Button>
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => { }}>
          ←
        </Button>
      </div>
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground mb-1 block">Enabled</Label>
        <div className="border rounded-md h-32 overflow-auto p-1">
          {enabled.map((id) => {
            const codec = available.find((c) => c.id === id);
            return codec ? (
              <div
                key={id}
                className="text-xs px-2 py-1 hover:bg-accent rounded cursor-pointer"
                onClick={() => onMove(id, "remove")}
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

  const handleOpenChange = (isOpen) => {
    if (isOpen) {
      setLocalSettings(settings);
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
    setLocalSettings(settings);
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
      <DialogContent className="sm:max-w-7xl h-[85vh] overflow-y-auto pb-2 flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="call" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-6 justify-start rounded-none border-b bg-transparent h-auto py-0">
            <TabsTrigger value="call" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 py-3">
              <Phone className="w-4 h-4" />
              Call
            </TabsTrigger>
            <TabsTrigger value="audio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 py-3">
              <Volume2 className="w-4 h-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="video" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 py-3">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="network" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 py-3">
              <Network className="w-4 h-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="recording" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 py-3">
              <HardDrive className="w-4 h-4" />
              Recording
            </TabsTrigger>
            <TabsTrigger value="ui" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 py-3">
              <Monitor className="w-4 h-4" />
              Interface
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Call Settings */}
            <TabsContent value="call" className="m-0 p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Call Behavior</h3>
                  <div className="space-y-1">
                    <SettingCheckbox
                      label="Single Call Mode"
                      description="Only allow one active call at a time"
                      checked={localSettings.singleCallMode}
                      onCheckedChange={(v) => handleChange("singleCallMode", v)}
                    />
                    <SettingCheckbox
                      label="Call Waiting"
                      description="Allow incoming calls while on another call"
                      checked={localSettings.callWaiting}
                      onCheckedChange={(v) => handleChange("callWaiting", v)}
                    />
                  </div>

                  <Separator />

                  <h3 className="font-medium text-sm">Auto Answer</h3>
                  <SettingRow label="Auto Answer">
                    <Select
                      value={localSettings.autoAnswer}
                      onValueChange={(v) => handleChange("autoAnswer", v)}
                    >
                      <SelectTrigger className="w-40">
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

                  <h3 className="font-medium text-sm">DTMF</h3>
                  <SettingRow label="DTMF Method">
                    <Select
                      value={localSettings.dtmfMethod}
                      onValueChange={(v) => handleChange("dtmfMethod", v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="rfc2833">RFC 2833</SelectItem>
                        <SelectItem value="info">SIP INFO</SelectItem>
                        <SelectItem value="inband">Inband</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Call Forwarding</h3>
                  <SettingRow label="Forwarding">
                    <Select
                      value={localSettings.callForwarding}
                      onValueChange={(v) => handleChange("callForwarding", v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="busy">When Busy</SelectItem>
                        <SelectItem value="no-answer">No Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  {localSettings.callForwarding !== "off" && (
                    <>
                      <SettingRow label="Forward To">
                        <Input
                          className="w-40"
                          placeholder="Number"
                          value={localSettings.callForwardingNumber}
                          onChange={(e) => handleChange("callForwardingNumber", e.target.value)}
                        />
                      </SettingRow>
                      {localSettings.callForwarding === "no-answer" && (
                        <SettingRow label="Delay (sec)">
                          <Input
                            className="w-20"
                            type="number"
                            value={localSettings.callForwardingDelay}
                            onChange={(e) => handleChange("callForwardingDelay", parseInt(e.target.value) || 0)}
                          />
                        </SettingRow>
                      )}
                    </>
                  )}

                  <Separator />

                  <h3 className="font-medium text-sm">Deny Incoming</h3>
                  <SettingRow label="Deny Incoming">
                    <Select
                      value={localSettings.denyIncoming}
                      onValueChange={(v) => handleChange("denyIncoming", v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="all">All Calls</SelectItem>
                        <SelectItem value="anonymous">Anonymous</SelectItem>
                        <SelectItem value="not-in-contacts">Not in Contacts</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <Separator />

                  <h3 className="font-medium text-sm">Directory</h3>
                  <SettingRow label="Directory URL">
                    <Input
                      className="w-full"
                      placeholder="URL to directory"
                      value={localSettings.directoryOfUsers}
                      onChange={(e) => handleChange("directoryOfUsers", e.target.value)}
                    />
                  </SettingRow>
                  <SettingRow label="Default Action">
                    <Select
                      value={localSettings.defaultListAction}
                      onValueChange={(v) => handleChange("defaultListAction", v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </div>
              </div>
            </TabsContent>

            {/* Audio Settings */}
            <TabsContent value="audio" className="m-0 p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Ringtone</h3>
                  <SettingRow label="Ringtone">
                    <Input
                      className="w-48"
                      placeholder="/sounds/ringtone.mp3"
                      value={localSettings.ringtone}
                      onChange={(e) => handleChange("ringtone", e.target.value)}
                    />
                  </SettingRow>
                  <SettingRow label="Volume">
                    <div className="flex items-center gap-2 w-48">
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

                  <h3 className="font-medium text-sm">Devices</h3>
                  <SettingRow label="Ring Device">
                    <Select
                      value={localSettings.ringDevice}
                      onValueChange={(v) => handleChange("ringDevice", v)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow label="Speaker">
                    <Select
                      value={localSettings.speaker}
                      onValueChange={(v) => handleChange("speaker", v)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow label="Microphone">
                    <Select
                      value={localSettings.microphone}
                      onValueChange={(v) => handleChange("microphone", v)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <div className="space-y-1 pt-2">
                    <SettingCheckbox
                      label="Microphone Amplification"
                      checked={localSettings.microphoneAmplification}
                      onCheckedChange={(v) => handleChange("microphoneAmplification", v)}
                    />
                    <SettingCheckbox
                      label="Software Level Adjustment"
                      checked={localSettings.softwareLevelAdjustment}
                      onCheckedChange={(v) => handleChange("softwareLevelAdjustment", v)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Audio Codecs</h3>
                  <CodecList
                    available={availableCodecs}
                    enabled={localSettings.enabledAudioCodecs}
                    onMove={handleCodecMove}
                  />

                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                    <SettingCheckbox
                      label="VAD"
                      checked={localSettings.vad}
                      onCheckedChange={(v) => handleChange("vad", v)}
                    />
                    <SettingCheckbox
                      label="Echo Cancellation"
                      checked={localSettings.echoCancellation}
                      onCheckedChange={(v) => handleChange("echoCancellation", v)}
                    />
                    <SettingCheckbox
                      label="Opus 2ch"
                      checked={localSettings.opus2ch}
                      onCheckedChange={(v) => handleChange("opus2ch", v)}
                    />
                    <SettingCheckbox
                      label="Force Codec for Incoming"
                      checked={localSettings.forceCodecForIncoming}
                      onCheckedChange={(v) => handleChange("forceCodecForIncoming", v)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Video Settings */}
            <TabsContent value="video" className="m-0 p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <SettingCheckbox
                    label="Disable Video"
                    description="Disable all video functionality"
                    checked={localSettings.disableVideo}
                    onCheckedChange={(v) => handleChange("disableVideo", v)}
                  />

                  {!localSettings.disableVideo && (
                    <>
                      <Separator />
                      <h3 className="font-medium text-sm">Camera</h3>
                      <SettingRow label="Camera">
                        <Select
                          value={localSettings.camera}
                          onValueChange={(v) => handleChange("camera", v)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <Separator />
                      <h3 className="font-medium text-sm">Video Codec</h3>
                      <SettingRow label="Codec">
                        <Select
                          value={localSettings.videoCodec}
                          onValueChange={(v) => handleChange("videoCodec", v)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="h264">H.264</SelectItem>
                            <SelectItem value="vp8">VP8</SelectItem>
                            <SelectItem value="vp9">VP9</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <SettingCheckbox
                          label="H.264"
                          checked={localSettings.enableH264}
                          onCheckedChange={(v) => handleChange("enableH264", v)}
                        />
                        <SettingCheckbox
                          label="H.263+"
                          checked={localSettings.enableH263}
                          onCheckedChange={(v) => handleChange("enableH263", v)}
                        />
                        <SettingCheckbox
                          label="VP8"
                          checked={localSettings.enableVP8}
                          onCheckedChange={(v) => handleChange("enableVP8", v)}
                        />
                        <SettingCheckbox
                          label="VP9"
                          checked={localSettings.enableVP9}
                          onCheckedChange={(v) => handleChange("enableVP9", v)}
                        />
                      </div>

                      <SettingRow label="Video Bitrate">
                        <Input
                          className="w-24"
                          type="number"
                          value={localSettings.videoBitrate}
                          onChange={(e) => handleChange("videoBitrate", parseInt(e.target.value) || 256)}
                        />
                      </SettingRow>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Network Settings */}
            <TabsContent value="network" className="m-0 p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Ports</h3>
                  <SettingRow label="Source Port">
                    <Input
                      className="w-24"
                      type="number"
                      placeholder="0"
                      value={localSettings.sourcePort}
                      onChange={(e) => handleChange("sourcePort", parseInt(e.target.value) || 0)}
                    />
                  </SettingRow>
                  <SettingCheckbox
                    label="rport"
                    description="Use rport extension"
                    checked={localSettings.rport}
                    onCheckedChange={(v) => handleChange("rport", v)}
                  />
                  <SettingRow label="RTP Ports">
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20"
                        type="number"
                        placeholder="0"
                        value={localSettings.rtpPortMin}
                        onChange={(e) => handleChange("rtpPortMin", parseInt(e.target.value) || 0)}
                      />
                      <span>-</span>
                      <Input
                        className="w-20"
                        type="number"
                        placeholder="0"
                        value={localSettings.rtpPortMax}
                        onChange={(e) => handleChange("rtpPortMax", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </SettingRow>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm">DNS & STUN</h3>
                  <SettingRow label="Nameserver">
                    <Input
                      className="w-48"
                      placeholder="Optional"
                      value={localSettings.nameserver}
                      onChange={(e) => handleChange("nameserver", e.target.value)}
                    />
                  </SettingRow>
                  <SettingCheckbox
                    label="DNS SRV"
                    description="Use DNS SRV records"
                    checked={localSettings.dnsSrv}
                    onCheckedChange={(v) => handleChange("dnsSrv", v)}
                  />
                  <SettingRow label="STUN Server">
                    <Input
                      className="w-48"
                      placeholder="stun:server:port"
                      value={localSettings.stunServer}
                      onChange={(e) => handleChange("stunServer", e.target.value)}
                    />
                  </SettingRow>
                </div>
              </div>
            </TabsContent>

            {/* Recording Settings */}
            <TabsContent value="recording" className="m-0 p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <SettingCheckbox
                    label="Enable Call Recording"
                    description="Record calls automatically"
                    checked={localSettings.callRecording}
                    onCheckedChange={(v) => handleChange("callRecording", v)}
                  />

                  {localSettings.callRecording && (
                    <>
                      <SettingRow label="Recording Path">
                        <Input
                          className="w-64"
                          placeholder="C:\Recordings"
                          value={localSettings.recordingPath}
                          onChange={(e) => handleChange("recordingPath", e.target.value)}
                        />
                      </SettingRow>

                      <SettingRow label="Format">
                        <div className="flex gap-4">
                          {["mp3", "wav", "rec"].map((format) => (
                            <div key={format} className="flex items-center gap-2">
                              <Checkbox
                                checked={localSettings.recordingFormat === format}
                                onCheckedChange={() => handleChange("recordingFormat", format)}
                              />
                              <Label className="text-sm uppercase">{format}</Label>
                            </div>
                          ))}
                        </div>
                      </SettingRow>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* UI Settings */}
            <TabsContent value="ui" className="m-0 p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm mb-3">Interface Options</h3>
                  <SettingCheckbox
                    label="Handle Media Buttons"
                    checked={localSettings.handleMediaButtons}
                    onCheckedChange={(v) => handleChange("handleMediaButtons", v)}
                  />
                  <SettingCheckbox
                    label="Headset Support"
                    checked={localSettings.headsetSupport}
                    onCheckedChange={(v) => handleChange("headsetSupport", v)}
                  />
                  <SettingCheckbox
                    label="Sound Events"
                    checked={localSettings.soundEvents}
                    onCheckedChange={(v) => handleChange("soundEvents", v)}
                  />
                  <SettingCheckbox
                    label="Enable Log File"
                    checked={localSettings.enableLogFile}
                    onCheckedChange={(v) => handleChange("enableLogFile", v)}
                  />
                  <SettingCheckbox
                    label="Bring to Front on Incoming Call"
                    checked={localSettings.bringToFrontOnIncoming}
                    onCheckedChange={(v) => handleChange("bringToFrontOnIncoming", v)}
                  />
                  <SettingCheckbox
                    label="Enable Local Account"
                    checked={localSettings.enableLocalAccount}
                    onCheckedChange={(v) => handleChange("enableLocalAccount", v)}
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-sm mb-3">System</h3>
                  <SettingCheckbox
                    label="Random Popup Position"
                    checked={localSettings.randomPopupPosition}
                    onCheckedChange={(v) => handleChange("randomPopupPosition", v)}
                  />
                  <SettingCheckbox
                    label="Send Crash Report"
                    checked={localSettings.sendCrashReport}
                    onCheckedChange={(v) => handleChange("sendCrashReport", v)}
                  />
                  <SettingCheckbox
                    label="Disable Messaging"
                    checked={localSettings.disableMessaging}
                    onCheckedChange={(v) => handleChange("disableMessaging", v)}
                  />
                  <SettingCheckbox
                    label="Multi Monitor Support"
                    checked={localSettings.multiMonitorSupport}
                    onCheckedChange={(v) => handleChange("multiMonitorSupport", v)}
                  />
                  <SettingCheckbox
                    label="Handle IP Changes"
                    checked={localSettings.handleIpChanges}
                    onCheckedChange={(v) => handleChange("handleIpChanges", v)}
                  />

                  <Separator className="my-4" />

                  <SettingRow label="Check for Updates">
                    <Select
                      value={localSettings.checkForUpdates}
                      onValueChange={(v) => handleChange("checkForUpdates", v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <SettingCheckbox
                    label="Run at System Startup"
                    checked={localSettings.runAtStartup}
                    onCheckedChange={(v) => handleChange("runAtStartup", v)}
                  />
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
