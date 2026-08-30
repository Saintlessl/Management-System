import { useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onSend: (body: string | null, files?: File[]) => void;
  replyTo: { id: number; name: string } | null;
  onCancelReply: () => void;
  isSending: boolean;
}

export function MessageInput({ onSend, replyTo, onCancelReply, isSending }: Props) {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!body.trim() && files.length === 0) return;
    onSend(body.trim() || null, files.length > 0 ? files : undefined);
    setBody('');
    setFiles([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)].slice(0, 5));
  };

  return (
    <div className="shrink-0 border-t border-border bg-surface p-3">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-primary-subtle px-3 py-2 text-xs text-primary">
          <span>Membalas {replyTo.name}</span>
          <button type="button" onClick={onCancelReply} className="hover:underline"><X className="h-3 w-3" /></button>
        </div>
      )}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] text-foreground-muted">
              {f.name}
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-foreground-muted hover:text-danger">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <Button variant="ghost" size="icon-sm" onClick={() => fileRef.current?.click()} aria-label="Lampirkan file"><Paperclip className="h-4 w-4" /></Button>
        <textarea ref={textareaRef} value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ketik pesan..." rows={1} className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none" />
        <Button size="icon" onClick={handleSend} disabled={!body.trim() && files.length === 0} isLoading={isSending}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
