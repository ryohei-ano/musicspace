'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  type: 'system' | 'user' | 'success' | 'error';
}

interface Memory {
  id: number;
  memory: string;
  created_at: string;
  memory_id: string;
}

export default function TerminalStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初期メッセージ
    setMessages([
      {
        id: '1',
        text: 'Welcome to the memory terminal...',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      },
      {
        id: '2',
        text: 'Type your memory and press Enter to post',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }
    ]);

    // Supabase接続テスト
    const testConnection = async () => {
      try {
        const { error } = await supabase
          .from('memories')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          addMessage(`⚠ Supabase connection error: ${error.message}`, 'error');
        }
        // 成功時はメッセージを表示しない
      } catch (err) {
        addMessage(`⚠ Failed to connect to Supabase: ${err}`, 'error');
      }
    };

    testConnection();

    // Supabaseリアルタイム購読
    const channel = supabase
      .channel('memories')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          const newMemory = payload.new as Memory;
          addMessage(
            `New memory posted: "${newMemory.memory}" [ID: undefined]`,
            'system'
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addMessage = (text: string, type: Message['type'] = 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSubmitting) {
      return;
    }

    const memory = inputValue.trim();
    
    // 最小限の文字数チェック
    if (memory.length < 1) {
      return;
    }
    
    setIsSubmitting(true);
    addMessage(`> ${memory}`, 'user');

    try {
      // 直接Supabaseに保存（高速化）
      const { error } = await supabase
        .from('memories')
        .insert([{ memory, memory_id: "undefined" }]);

      if (error) {
        addMessage(`✗ Error: ${error.message}`, 'error');
      } else {
        addMessage(`✓ Posted [ID: undefined]`, 'success');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addMessage(`✗ Error: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const getMessageColor = (type: Message['type']) => {
    switch (type) {
      case 'system': return 'text-white';
      case 'user': return 'text-white';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="w-full bg-black text-white p-3 sm:p-4 rounded-lg font-mono h-48 sm:h-64 flex flex-col">
      <div className="mb-2 text-xs sm:text-sm">
        <span className="text-gray-500">$</span> memory_terminal
      </div>
      
      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-2">
        {messages.map((message) => (
          <div key={message.id} className={`text-xs sm:text-sm ${getMessageColor(message.type)} break-words`}>
            <span className="text-gray-500">[{message.timestamp}]</span> {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-gray-500 mr-1 text-xs sm:text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your memory..."
          disabled={isSubmitting}
          className="w-full bg-transparent text-white outline-none placeholder-gray-600 text-xs sm:text-sm py-1"
          autoFocus
        />
        {isSubmitting && <span className="text-yellow-400 ml-2 text-xs sm:text-sm">Posting...</span>}
      </form>
    </div>
  );
}
