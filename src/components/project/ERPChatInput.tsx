import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, FileIcon, Smile, Loader2, FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ERPChatInputProps {
  onSendMessage: (message: string, attachments?: Array<{ name: string; url: string; size: number; type: string }>) => Promise<void>;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ERPChatInput({ onSendMessage, disabled }: ERPChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-primary" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-destructive" />;
    if (type.includes('document') || type.includes('word')) return <FileText className="h-4 w-4 text-primary" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`Archivos muy grandes (máx 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Create preview URLs for images
    const newPreviews = new Map(previewUrls);
    files.forEach((file, idx) => {
      if (isImageFile(file.type)) {
        const url = URL.createObjectURL(file);
        newPreviews.set(attachments.length + idx, url);
      }
    });
    setPreviewUrls(newPreviews);

    setAttachments(prev => [...prev, ...files]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    // Revoke preview URL to free memory
    const previewUrl = previewUrls.get(index);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      const newPreviews = new Map(previewUrls);
      newPreviews.delete(index);
      setPreviewUrls(newPreviews);
    }
    
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    try {
      // TODO: Upload attachments to Supabase storage
      const attachmentData = attachments.map(f => ({
        name: f.name,
        url: '', // Will be populated after upload
        size: f.size,
        type: f.type
      }));

      await onSendMessage(trimmedMessage || '(archivo adjunto)', attachmentData);
      
      setMessage('');
      setAttachments([]);
      
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls(new Map());
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize with smooth transition (max 5 lines)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // ~5 lines
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, idx) => {
            const isImage = isImageFile(file.type);
            const previewUrl = previewUrls.get(idx);
            
            return isImage && previewUrl ? (
              // Image thumbnail
              <div
                key={idx}
                className="relative group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all"
              >
                <img 
                  src={previewUrl} 
                  alt={file.name}
                  className="h-20 w-20 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                  {file.name}
                </div>
              </div>
            ) : (
              // File card
              <div
                key={idx}
                className="flex items-center gap-2 bg-muted hover:bg-muted/80 rounded-lg px-3 py-2 text-xs border border-border transition-colors group"
              >
                <div className="p-1.5 bg-background rounded">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate max-w-[120px]">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleAttachmentChange}
        />
        
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSending}
            className="flex-shrink-0 hover:bg-accent focus-ring"
            aria-label="Adjuntar archivo"
          >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... 💬"
            disabled={disabled || isSending}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none pr-10 transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20"
            )}
            rows={1}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 h-8 w-8 hover:bg-accent focus-ring"
            disabled={disabled || isSending}
            onClick={() => toast.info('Selector de emoji próximamente')}
            aria-label="Agregar emoji"
          >
            <Smile className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
          className={cn(
            "flex-shrink-0 transition-all duration-200",
            "bg-primary hover:bg-primary-hover text-primary-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-ring"
          )}
          aria-label="Enviar mensaje"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1">
        <span className="font-medium">Enter</span> para enviar • 
        <span className="font-medium">Shift+Enter</span> para nueva línea • 
        Máx 10MB por archivo
      </p>
    </div>
  );
}
