'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const passwords = ['L5zaYQ', 'w7TDkL', 'U2zhDY', 'pocari'];

export default function PasswordGate({ 
  children, 
  onSuccess 
}: { 
  children: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem('auth') === '1';
    setAuth(ok);
  }, []);

  const submit = () => {
    if (passwords.includes(pass)) {
      localStorage.setItem('auth', '1');
      setAuth(true);
      // 認証成功時のコールバックを実行
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  if (auth) return <>{children}</>;

  return (
    <div className="flex flex-col items-center p-10 gap-4">
      <Input
        placeholder="Enter your passcode"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <Button onClick={submit}>ENTER</Button>
    </div>
  );
}
