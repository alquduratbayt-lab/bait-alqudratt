import { NextRequest, NextResponse } from 'next/server';

const TAQNYAT_API_KEY = process.env.TAQNYAT_API_KEY!;
const TAQNYAT_SENDER_NAME = process.env.TAQNYAT_SENDER_NAME || 'Balqudrat';
const SMS_PROXY_SECRET = process.env.SMS_PROXY_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { secret, recipients, body: smsBody, sender } = await request.json();

    if (secret !== SMS_PROXY_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!recipients || !smsBody) {
      return NextResponse.json(
        { error: 'recipients and body are required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.taqnyat.sa/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAQNYAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        body: smsBody,
        sender: sender || TAQNYAT_SENDER_NAME,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Taqnyat API error:', data);
      return NextResponse.json(
        { error: 'SMS sending failed', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in send-sms proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
