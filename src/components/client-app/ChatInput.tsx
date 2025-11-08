import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, Smile, X, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
}


export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 20 * 5; // ~5 lines (line-height * 5)
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.size <= 10 * 1024 * 1024; // 10MB max
      if (!isValid) {
        toast.error(`${file.name} excede el tamaño máximo de 10MB`);
      }
      return isValid;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <div className="border-t bg-background p-2 space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap pb-2">
          {attachments.map((file, index) => {
            const preview = getFilePreview(file);
            return (
              <Card key={index} className="relative p-2 flex items-center gap-2">
                {preview ? (
                  <img src={preview} alt={file.name} className="h-12 w-12 object-cover rounded" />
                ) : (
                  <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(file)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate max-w-[120px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[40px] max-h-[100px] resize-none pr-10 overflow-y-auto text-base"
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 text-muted-foreground"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() && attachments.length === 0}
          className="flex-shrink-0 bg-primary hover:bg-primary/90"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
