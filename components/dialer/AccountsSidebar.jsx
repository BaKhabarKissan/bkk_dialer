"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Edit2,
  User,
  Wifi,
  WifiOff,
  Loader2,
  Check,
  Settings as SettingsIcon,
  History,
} from "lucide-react";
import { useSipConfig } from "@/lib/sip/SipContext";
import { RegistrationStatus } from "@/lib/sip/useSip";
import { cn } from "@/lib/utils";
import Settings from "./Settings";
import CallLogs from "./CallLogs";
import { ModeToggle } from "@/components/ui/mode-toggle";

function AccountForm({ account, onSave, onCancel }) {
  const [form, setForm] = useState({
    displayName: account?.displayName || "",
    username: account?.username || "",
    password: account?.password || "",
    server: account?.server || "",
    domain: account?.domain || "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.server || !form.username || !form.password) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="My Account"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="server">SIP Server *</Label>
        <Input
          id="server"
          value={form.server}
          onChange={(e) => setForm({ ...form, server: e.target.value })}
          placeholder="wss://sip.example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          value={form.domain}
          onChange={(e) => setForm({ ...form, domain: e.target.value })}
          placeholder="sip.example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="1000"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="********"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!form.server || !form.username || !form.password}
        >
          {account ? "Update" : "Add"} Account
        </Button>
      </DialogFooter>
    </form>
  );
}

function AccountStatusBadge({ status }) {
  switch (status) {
    case RegistrationStatus.REGISTERED:
      return (
        <Badge
          variant="outline"
          className="bg-green-500/10 text-green-600 border-green-500/30 text-xs"
        >
          <Wifi className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case RegistrationStatus.REGISTERING:
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs"
        >
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting
        </Badge>
      );
    case RegistrationStatus.FAILED:
      return (
        <Badge
          variant="outline"
          className="bg-destructive/10 text-destructive border-destructive/30 text-xs"
        >
          <WifiOff className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </Badge>
      );
  }
}

export default function AccountsSidebar({
  registrationStatus,
  isRegistered,
  onConnect,
  onDisconnect,
  onCallNumber,
}) {
  const {
    accounts,
    activeAccountId,
    addAccount,
    updateAccount,
    deleteAccount,
    setActiveAccount,
  } = useSipConfig();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const handleAddAccount = (data) => {
    addAccount(data);
    setAddDialogOpen(false);
  };

  const handleUpdateAccount = (data) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, data);
      setEditingAccount(null);
    }
  };

  const handleSelectAccount = (id) => {
    if (id !== activeAccountId) {
      // Disconnect current if registered
      if (isRegistered) {
        onDisconnect?.();
      }
      setActiveAccount(id);
    }
  };

  return (
    <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Accounts</h2>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add SIP Account</DialogTitle>
                <DialogDescription>
                  Enter your SIP account credentials to connect.
                </DialogDescription>
              </DialogHeader>
              <AccountForm
                onSave={handleAddAccount}
                onCancel={() => setAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Settings
            trigger={
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <SettingsIcon className="w-3.5 h-3.5" />
                Settings
              </Button>
            }
          />

          <CallLogs
            onCallNumber={onCallNumber}
            trigger={
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <History className="w-3.5 h-3.5" />
                Logs
              </Button>
            }
          />

          <ModeToggle />
        </div>
      </div>

      {/* Account List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No accounts yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
              >
                Add your first account
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => {
                const isActive = account.id === activeAccountId;
                const status = isActive ? registrationStatus : RegistrationStatus.UNREGISTERED;

                return (
                  <div
                    key={account.id}
                    className={cn(
                      "group p-3 rounded-md border transition-colors cursor-pointer",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-accent/50"
                    )}
                    onClick={() => handleSelectAccount(account.id)}
                  >
                    {/* Account Header */}
                    <div className="flex items-start gap-2">
                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isActive ? "bg-primary/20" : "bg-muted"
                        )}
                      >
                        {isActive && isRegistered ? (
                          <Wifi className="w-4 h-4 text-green-500" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">
                            {account.displayName || account.username}
                          </p>
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {account.username}@{account.domain || account.server}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="mt-2 flex items-center justify-between">
                      <AccountStatusBadge status={status} />

                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog
                          open={editingAccount?.id === account.id}
                          onOpenChange={(open) =>
                            setEditingAccount(open ? account : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                              <DialogTitle>Edit Account</DialogTitle>
                              <DialogDescription>
                                Update your SIP account settings.
                              </DialogDescription>
                            </DialogHeader>
                            <AccountForm
                              account={editingAccount}
                              onSave={handleUpdateAccount}
                              onCancel={() => setEditingAccount(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAccount(account.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Connect/Disconnect for active account */}
                    {isActive && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            isRegistered ? onDisconnect?.() : onConnect?.();
                          }}
                          disabled={status === RegistrationStatus.REGISTERING}
                        >
                          {status === RegistrationStatus.REGISTERING ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Connecting...
                            </>
                          ) : isRegistered ? (
                            <>
                              <WifiOff className="w-3.5 h-3.5" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Wifi className="w-3.5 h-3.5" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full gap-2 text-xs text-muted-foreground">
            <span>{accounts.length} account{accounts.length !== 1 ? "s" : ""}</span>
            {activeAccountId && (
              <Badge className={`text-xs ${isRegistered ? "bg-green-600" : "bg-red-600"}`}>
                {isRegistered ? "Online" : "Offline"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
