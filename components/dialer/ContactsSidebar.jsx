"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Phone,
  Star,
  Trash2,
  Edit2,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useContacts } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

function ContactForm({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: contact?.name || "",
    number: contact?.number || "",
    email: contact?.email || "",
    company: contact?.company || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.number) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Contact name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Phone Number *</Label>
        <Input
          id="number"
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
          placeholder="Phone number"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="Company name"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.name || !form.number}>
          {contact ? "Update" : "Add"} Contact
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ContactsSidebar({ onCallNumber }) {
  const {
    contacts,
    searchQuery,
    setSearchQuery,
    addContact,
    updateContact,
    deleteContact,
    toggleFavorite,
  } = useContacts();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const handleAddContact = (data) => {
    addContact(data);
    setAddDialogOpen(false);
  };

  const handleUpdateContact = (data) => {
    if (editingContact) {
      updateContact(editingContact.id, data);
      setEditingContact(null);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 320 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full border-r border-border bg-sidebar flex flex-col relative"
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Inner container for overflow control */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className={cn(
          "flex mb-3",
          isCollapsed ? "flex-col items-center gap-2" : "items-center justify-between"
        )}>
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.h2
                key="title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-semibold"
              >
                Contacts
              </motion.h2>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Users className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <ContactForm
                onSave={handleAddContact}
                onCancel={() => setAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search - Only show when expanded */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-8 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="w-10 h-10 mb-2 opacity-50" />
              {!isCollapsed && (
                <>
                  <p className="text-sm">
                    {searchQuery ? "No contacts found" : "No contacts yet"}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      Add your first contact
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "group p-2 rounded-md hover:bg-accent/50 transition-colors",
                    isCollapsed && "flex justify-center"
                  )}
                >
                  {isCollapsed ? (
                    /* Collapsed View - Just Avatar */
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onCallNumber?.(contact.number)}
                      title={`${contact.name} - ${contact.number}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {contact.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    </Button>
                  ) : (
                    /* Expanded View */
                    <div className="flex items-start gap-2">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {contact.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">
                            {contact.name}
                          </p>
                          {contact.favorite && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {contact.number}
                        </p>
                        {contact.company && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {contact.company}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onCallNumber?.(contact.number)}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleFavorite(contact.id)}
                        >
                          <Star
                            className={cn(
                              "w-3 h-3",
                              contact.favorite && "text-amber-500 fill-amber-500"
                            )}
                          />
                        </Button>
                        <Dialog
                          open={editingContact?.id === contact.id}
                          onOpenChange={(open) =>
                            setEditingContact(open ? contact : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Contact</DialogTitle>
                            </DialogHeader>
                            <ContactForm
                              contact={editingContact}
                              onSave={handleUpdateContact}
                              onCancel={() => setEditingContact(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteContact(contact.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <span>{contacts.length} contacts</span>
              <Badge variant="secondary" className="text-xs">
                {contacts.filter((c) => c.favorite).length} favorites
              </Badge>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <Badge variant="secondary" className="text-xs">
                {contacts.length}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </motion.div>
  );
}
