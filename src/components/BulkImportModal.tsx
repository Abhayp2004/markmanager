import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Globe, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Folder } from "@/types/bookmark";

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  selectedFolder: string | null;
  onBookmarksAdded: () => void;
}

interface ImportStatus {
  url: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

export function BulkImportModal({
  open,
  onOpenChange,
  folders,
  selectedFolder,
  onBookmarksAdded,
}: BulkImportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [urlsText, setUrlsText] = useState("");
  const [folderId, setFolderId] = useState<string | null>(selectedFolder);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);

  const extractUrls = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s,\n]+/g;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches.map((u) => u.replace(/[)>\]"']+$/, "")))];
  };

  const handleImport = async () => {
    if (!user) return;
    const urls = extractUrls(urlsText);

    if (urls.length === 0) {
      toast({ title: "No URLs found", description: "Please paste valid URLs.", variant: "destructive" });
      return;
    }

    if (urls.length > 20) {
      toast({ title: "Too many URLs", description: "Max 20 URLs at a time.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setImportStatuses(urls.map((url) => ({ url, status: "pending" })));

    let successCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      setImportStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "processing" } : s))
      );

      try {
        // Fetch metadata + summary via edge function with retry
        let response;
        let lastError;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await supabase.functions.invoke("scrape-summarize", {
              body: { url },
            });
            if (response.data && !response.data.error) break;
            lastError = response.data?.error || "Unknown error";
          } catch (e) {
            lastError = e;
            if (attempt < 1) await new Promise(r => setTimeout(r, 1500));
          }
        }

        if (!response?.data || response.data.error) {
          throw new Error(lastError || "Failed to fetch");
        }

        const title = response.data?.title || "";
        const summary = response.data?.summary || "";
        const tags = response.data?.tags || ["other"];
        const thumbnail = response.data?.image || null;

        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          tweet_url: url,
          folder_id: folderId || null,
          content: summary || title || url,
          author_name: title || null,
          tags,
          platform: "vault",
          thumbnail_url: thumbnail,
        });

        if (error) throw error;

        setImportStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "success" } : s))
        );
        successCount++;
      } catch (err) {
        setImportStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "error", error: "Failed to import" } : s
          )
        );
      }
    }

    setIsImporting(false);
    toast({
      title: "Import complete",
      description: `${successCount}/${urls.length} URLs imported successfully.`,
    });

    if (successCount > 0) {
      onBookmarksAdded();
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setUrlsText("");
      setImportStatuses([]);
      onOpenChange(false);
    }
  };

  const urls = extractUrls(urlsText);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Internet Vault - Bulk Import
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Paste URLs of articles, PDFs, or any webpage. AI will summarize & tag them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label>Paste URLs (one per line or comma-separated)</Label>
            <Textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder={`https://example.com/article-1\nhttps://blog.example.com/post-2\nhttps://docs.example.com/guide.pdf`}
              className="min-h-[120px] bg-secondary/50 text-sm font-mono"
              disabled={isImporting}
            />
            {urls.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {urls.length} URL{urls.length !== 1 ? "s" : ""} detected
              </p>
            )}
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label>Folder (optional)</Label>
            <Select
              value={folderId || "none"}
              onValueChange={(val) => setFolderId(val === "none" ? null : val)}
            >
              <SelectTrigger className="h-10 bg-secondary/50">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Import progress */}
          {importStatuses.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto border border-border rounded-lg p-3">
              {importStatuses.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {item.status === "pending" && (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                  )}
                  {item.status === "processing" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  {item.status === "success" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                  {item.status === "error" && (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className="truncate flex-1 text-muted-foreground">
                    {item.url}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            {importStatuses.some((s) => s.status === "success" || s.status === "error") && !isImporting ? (
              <Button
                onClick={handleClose}
                className="h-10 w-full"
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-10 w-full"
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  className="h-10 w-full gap-2"
                  disabled={isImporting || urls.length === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Import {urls.length > 0 ? `${urls.length} URL${urls.length !== 1 ? "s" : ""}` : "URLs"}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
