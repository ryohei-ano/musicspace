import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Fetch error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
