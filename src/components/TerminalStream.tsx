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

interface TerminalStreamProps {
  onClose?: () => void;
}

export default function TerminalStream({ onClose }: TerminalStreamProps) {
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

  const getMessageColorWin2k = (type: Message['type']) => {
    switch (type) {
      case 'system': return '#000080'; // ダークブルー
      case 'user': return '#000000'; // ブラック
      case 'success': return '#008000'; // ダークグリーン
      case 'error': return '#800000'; // ダークレッド
      default: return '#000000';
    }
  };

  return (
    <div 
      className="w-full font-mono h-48 sm:h-64 flex flex-col"
      style={{
        background: '#c0c0c0',
        border: '2px outset #c0c0c0',
        borderRadius: '0',
        boxShadow: 'inset -1px -1px #808080, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #dfdfdf'
      }}
    >
      {/* タイトルバー */}
      <div 
        className="flex items-center justify-between px-2 py-1 text-xs sm:text-sm"
        style={{
          background: 'linear-gradient(90deg, #0a246a 0%, #a6caf0 100%)',
          color: 'white',
          borderBottom: '1px solid #808080'
        }}
      >
        <span className="font-bold">青春は、バグだ。</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-400" style={{ border: '1px outset #c0c0c0' }}></div>
          <div className="w-3 h-3 bg-gray-400" style={{ border: '1px outset #c0c0c0' }}></div>
          <button
            onClick={onClose}
            className="w-3 h-3 bg-red-500 cursor-pointer flex items-center justify-center text-white text-xs font-bold hover:bg-red-600"
            style={{ border: '1px outset #c0c0c0' }}
          >
            ×
          </button>
        </div>
      </div>
      
      {/* メッセージ表示エリア */}
      <div 
        className="flex-1 overflow-y-auto space-y-1 p-2"
        style={{
          background: 'white',
          border: '1px inset #c0c0c0',
          margin: '2px'
        }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`text-xs sm:text-sm break-words`} style={{ color: getMessageColorWin2k(message.type) }}>
            <span style={{ color: '#808080' }}>[{message.timestamp}]</span> {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <div 
        className="p-2"
        style={{
          background: '#c0c0c0',
          borderTop: '1px solid #808080'
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm" style={{ color: '#000000' }}>$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your memory..."
            disabled={isSubmitting}
            className="flex-1 px-2 py-1 text-xs sm:text-sm"
            style={{
              fontSize: '16px', // iOS Safari ズーム防止
              WebkitAppearance: 'none',
              borderRadius: 0,
              background: 'white',
              border: '1px inset #c0c0c0',
              color: '#000000',
              outline: 'none'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            autoFocus
          />
          {isSubmitting && (
            <span className="text-xs sm:text-sm" style={{ color: '#000080' }}>
              Posting...
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
