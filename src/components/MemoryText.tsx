'use client';

import TypingAnimation from './TypingAnimation';

interface Memory {
  id: number;
  memory: string;
  created_at: string;
  memory_id: string;
}

interface MemoryTextProps {
  memory: Memory;
  position: [number, number, number];
  delay: number;
  scale?: number;
  isLatest?: boolean;
}

export default function MemoryText({ memory, position, delay, scale = 1, isLatest = false }: MemoryTextProps) {
  // 作成日時を指定されたフォーマットに変更
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  // 指定されたフォーマットでテキストを作成（memory_idを"undefined"に固定）
  const displayText = `> undefined がログインしました\n> "${memory.memory}"\n\n[${formatDate(memory.created_at)}]`;

  return (
    <TypingAnimation
      text={displayText}
      position={position}
      delay={delay}
      fontSize={0.3 * scale}
      color={isLatest ? "#00ff00" : "#ffffff"} // 最新の投稿は緑色で目立たせる
    />
  );
}
