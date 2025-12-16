"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff } from "lucide-react";
import { useSipConfig } from "@/lib/sip/SipContext";

export default function AccountSettings({ trigger }) {
  const { config, saveConfig } = useSipConfig();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    server: "",
    domain: "",
    username: "",
    password: "",
    displayName: "",
  });

  // Load config into form when dialog opens
  const handleOpenChange = (isOpen) => {
    if (isOpen) {
      setForm({
        server: config.server || "",
        domain: config.domain || "",
        username: config.username || "",
        password: config.password || "",
        displayName: config.displayName || "",
      });
    }
    setOpen(isOpen);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    saveConfig(form);
    setOpen(false);
  };

  const handleClear = () => {
    setForm({
      server: "",
      domain: "",
      username: "",
      password: "",
      displayName: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>SIP Account Settings</DialogTitle>
          <DialogDescription>
            Configure your SIP account to make and receive calls.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="server">WebSocket Server</Label>
            <Input
              id="server"
              placeholder="sip.example.com:8089/ws"
              value={form.server}
              onChange={handleChange("server")}
            />
            <p className="text-xs text-muted-foreground">
              WebSocket URL without wss:// prefix
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="domain">SIP Domain (optional)</Label>
            <Input
              id="domain"
              placeholder="sip.example.com"
              value={form.domain}
              onChange={handleChange("domain")}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use server address
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username / Extension</Label>
            <Input
              id="username"
              placeholder="1001"
              value={form.username}
              onChange={handleChange("username")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name (optional)</Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              value={form.displayName}
              onChange={handleChange("displayName")}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleSave}>Save Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
