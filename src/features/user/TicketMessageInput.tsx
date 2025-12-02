import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAddMessage } from '@/features/user/useAddMessage';
import { Send, Paperclip, X, FileText, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TicketMessageInputProps {
  ticketId: string;
  onMessageSent?: (isInternal: boolean) => void;
}

const TicketMessageInput = ({
  ticketId,
  onMessageSent,
}: TicketMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isSending } = useAddMessage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = files.length + selectedFiles.length;

      if (totalFiles > 5) {
        toast.error('You can only attach up to 5 files.');
        return;
      }

      const validFiles = selectedFiles.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB).`);
          return false;
        }
        return true;
      });

      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSend = () => {
    if (!message.trim() && files.length === 0) return;

    sendMessage(
      {
        ticketId,
        message_text: message,
        is_internal_note: isInternal,
        files: files,
      },
      {
        onSuccess: () => {
          setMessage('');
          setFiles([]);
          setIsInternal(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (onMessageSent) onMessageSent(isInternal);
        },
      },
    );
  };

  return (
    <div
      className={cn(
        // Base Styles
        'mt-4! rounded-lg border p-4! shadow-sm transition-colors',
        // Conditional Styles based on Mode (Internal vs Public)
        isInternal
          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20' // Light & Dark Internal
          : 'bg-background border-border dark:bg-card', // Light & Dark Public
      )}
    >
      {/* 1. Header: Internal Note Switch */}
      <div className="mb-3! flex items-center justify-between">
        <div className="flex items-center space-x-2!">
          <Switch
            id="internal-mode"
            className="cursor-pointer"
            checked={isInternal}
            onCheckedChange={setIsInternal}
          />
          <Label
            htmlFor="internal-mode"
            className={cn(
              'flex cursor-pointer items-center gap-2 font-medium transition-colors',
              isInternal
                ? 'text-yellow-700 dark:text-yellow-500'
                : 'text-muted-foreground',
            )}
          >
            {isInternal && <Lock className="h-4 w-4" />}
            {isInternal ? 'Internal Note (Private)' : 'Public Reply'}
          </Label>
        </div>

        {isInternal && (
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500">
            Not visible to customer
          </span>
        )}
      </div>

      {/* 2. Text Input */}
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          isInternal
            ? 'Write a private note to your team...'
            : 'Type your reply to the customer...'
        }
        className={cn(
          'min-h-20 resize-none px-4! py-2!',
          isInternal
            ? 'border-yellow-200 bg-white/50 focus-visible:ring-yellow-500/50 dark:border-yellow-900 dark:bg-yellow-950/10 dark:placeholder:text-yellow-500/50'
            : 'bg-background placeholder:text-muted-foreground',
        )}
      />

      {/* 3. Files Preview Area */}
      {files.length > 0 && (
        <div className="mt-3! flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={cn(
                'flex max-w-[200px] items-center gap-2 rounded-md border px-3! py-1! text-sm',
                'bg-muted border-border text-foreground', // Standard Colors
              )}
            >
              <FileText className="text-muted-foreground h-4 w-4 shrink-0!" />
              <span className="truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground transition-colors hover:text-red-500 dark:hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. Toolbar: Attach & Send */}
      <div className="border-border mt-3! flex items-center justify-between border-t pt-2!">
        {/* Hidden File Input */}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer px-2! py-2!"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= 5 || isSending}
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Attach files
        </Button>

        <Button
          onClick={handleSend}
          disabled={isSending || (!message.trim() && files.length === 0)}
          className={cn(
            'cursor-pointer gap-2 px-2! py-2! text-white transition-colors',
            isInternal
              ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500',
          )}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isInternal ? 'Post Note' : 'Send Reply'}
        </Button>
      </div>
    </div>
  );
};

export default TicketMessageInput;
