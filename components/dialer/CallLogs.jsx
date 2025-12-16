"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
  History,
  Phone,
} from "lucide-react";
import { useCallLogs } from "@/lib/sip/CallLogsContext";
import { cn } from "@/lib/utils";

// Format duration from seconds to mm:ss or hh:mm:ss
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return "-";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format time to readable format
function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get icon based on call direction/status
function CallIcon({ direction, status }) {
  if (status === "missed" || status === "rejected") {
    return <PhoneMissed className="w-4 h-4 text-destructive" />;
  }
  if (direction === "incoming") {
    return <PhoneIncoming className="w-4 h-4 text-blue-500" />;
  }
  return <PhoneOutgoing className="w-4 h-4 text-green-500" />;
}

// Get status badge
function StatusBadge({ status }) {
  const variants = {
    completed: "bg-green-500/10 text-green-600 border-green-500/30",
    missed: "bg-destructive/10 text-destructive border-destructive/30",
    rejected: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <Badge variant="outline" className={cn("text-xs", variants[status] || "")}>
      {status}
    </Badge>
  );
}

export default function CallLogs({ trigger, onCallNumber }) {
  const { logs, clearLogs, deleteLog } = useCallLogs();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start gap-2">
            <History className="w-4 h-4" />
            <span>Call Logs</span>
            {logs.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {logs.length}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Call Logs</span>
            {logs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={clearLogs}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            View your recent call history
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p>No call logs yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <CallIcon direction={log.direction} status={log.status} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.name || "-"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {log.number || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(log.time)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatDuration(log.duration)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onCallNumber && log.number && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onCallNumber(log.number)}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteLog(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
