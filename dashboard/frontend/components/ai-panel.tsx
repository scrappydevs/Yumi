'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
}

interface AIPanelProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function AIPanel({ isOpen, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/ai/generate/flash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          system_instruction: 'You are a helpful AI assistant for a civic infrastructure intelligence platform. Provide clear, concise, and professional responses.',
          temperature: 1.0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.text,
          model: data.model,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to generate response'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="h-full flex flex-col liquid-glass border-l border-[hsl(var(--border))]"
    >
      {/* Header */}
      <div className="h-16 px-4 py-2 border-b border-[hsl(var(--border))] flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
            AI Assistant
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-8 w-8 rounded-xl hover:bg-[hsl(var(--muted))]"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-[280px]">
              Ask questions about infrastructure data, get insights, or request analysis.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                  Assistant
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="liquid-glass-dark rounded-2xl focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/30 transition-all">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              disabled={isLoading}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Responding...' : 'Ask about restaurants...'}
              rows={3}
              className={`
                w-full px-4 py-3 outline-none focus:outline-none focus-visible:outline-none
                resize-none max-h-48 overflow-y-auto text-sm leading-relaxed
                text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]
                bg-transparent border-0 shadow-none focus:ring-0 focus:border-0
                ${isLoading ? 'cursor-not-allowed' : ''}
              `}
            />
          </form>
        </div>
      </div>
    </div>
  );
}


