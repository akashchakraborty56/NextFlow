import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Require authentication to prevent unauthorized access to signed params
    await getAuthUser();

    const { type } = await req.json();
    const templateId = type === 'image' 
      ? process.env.TRANSLOADIT_TEMPLATE_IMAGE 
      : process.env.TRANSLOADIT_TEMPLATE_VIDEO;
      
    const authKey = process.env.TRANSLOADIT_AUTH_KEY;
    const authSecret = process.env.TRANSLOADIT_AUTH_SECRET;

    if (!templateId || !authKey || !authSecret) {
      throw new Error('Missing Transloadit environment variables');
    }

    // Set expiry to 2 hours from now
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    
    const params = JSON.stringify({
      auth: { key: authKey, expires },
      template_id: templateId,
    });

    const signature = crypto
      .createHmac('sha1', authSecret)
      .update(Buffer.from(params, 'utf-8'))
      .digest('hex');

    return NextResponse.json({ params, signature });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

