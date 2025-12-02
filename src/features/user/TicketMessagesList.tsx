import { useTicketMessages } from './useTicketMessages';
import { Loader2, AlertCircle, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { messageT, attachmentT } from '@/schema/user/ticketMessagesSchema';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileUrl = (filePath: string) => {
  const cleanPath = filePath.replace(/\\/g, '/');

  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return `${BASE_API_URL}/${cleanPath}`;
};

interface TicketMessagesListProps {
  ticketId: string;
}

const TicketMessagesList = ({ ticketId }: TicketMessagesListProps) => {
  const { dataMessages, isLoadingMessages, errorMessages } =
    useTicketMessages(ticketId);
  const messages = dataMessages?.messages || [];

  if (isLoadingMessages && !dataMessages) {
    return (
      <div className="flex justify-center py-8!">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (errorMessages) {
    return (
      <div className="flex justify-center py-8! text-red-500">
        <AlertCircle className="mr-2 h-6 w-6" />
        Failed to load
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-muted-foreground py-8! text-center text-sm">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="min-h-[300px] space-y-4! p-4!">
      <div className="flex flex-col gap-4">
        {messages.map((msg: messageT) => {
          const isAgent = msg.sender_type === 'agent';
          const isInternal = msg.is_internal_note;
          const hasAttachments = msg.attachments && msg.attachments.length > 0;

          return (
            <div
              key={msg.id}
              className={cn(
                'flex w-full flex-col gap-1',
                isAgent ? 'items-end' : 'items-start',
              )}
            >
              {/* Sender Name */}
              <span className="text-muted-foreground px-1! text-[10px]">
                {msg.sender_name} •{' '}
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {/* Message Bubble */}
              <div
                className={cn(
                  'relative max-w-[85%] rounded-2xl px-4! py-3! text-sm shadow-sm',
                  isInternal
                    ? 'border border-yellow-200 bg-yellow-50 text-yellow-900'
                    : isAgent
                      ? 'rounded-br-none bg-blue-600 text-white'
                      : 'rounded-bl-none border bg-white text-gray-800',
                )}
              >
                {isInternal && (
                  <span className="mb-2! block border-b border-yellow-200 pb-1! text-[10px] font-bold tracking-wider text-yellow-700 uppercase">
                    Internal Note
                  </span>
                )}

                {/* 1. النص */}
                <p className="whitespace-pre-wrap">{msg.message_text}</p>

                {/* 2. المرفقات (إذا وجدت) */}
                {hasAttachments && (
                  <div
                    className={`mt-3! space-y-2! ${isAgent && !isInternal ? 'text-blue-100' : 'text-gray-600'}`}
                  >
                    {msg.attachments!.map((file: attachmentT, index) => (
                      <a
                        key={`${file.filename}-${index}`}
                        href={getFileUrl(file.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'group flex items-center gap-3 rounded-md border p-2! transition-colors',
                          isAgent && !isInternal
                            ? 'border-blue-500 bg-blue-700/50 hover:bg-blue-700'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-full p-2!',
                            isAgent && !isInternal
                              ? 'bg-blue-500 text-white'
                              : 'border bg-white text-gray-500',
                          )}
                        >
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-xs font-medium',
                              isAgent && !isInternal
                                ? 'text-white'
                                : 'text-gray-900',
                            )}
                          >
                            {file.filename}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              isAgent && !isInternal
                                ? 'text-blue-200'
                                : 'text-gray-500',
                            )}
                          >
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>

                        <Download
                          className={cn(
                            'h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100',
                            isAgent && !isInternal
                              ? 'text-white'
                              : 'text-gray-500',
                          )}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketMessagesList;
