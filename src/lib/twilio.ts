import twilio from 'twilio';

type TwilioClient = ReturnType<typeof twilio>;
let _client: TwilioClient | null = null;

function getTwilioClient(): TwilioClient {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return _client;
}

// Send SMS via Twilio
export async function sendSms(from: string, to: string, body: string) {
  return getTwilioClient().messages.create({ from, to, body });
}

// Purchase a Twilio phone number (US local)
export async function purchasePhoneNumber(): Promise<string> {
  const client = getTwilioClient();
  const available = await client.availablePhoneNumbers('US')
    .local.list({ limit: 1 });

  if (available.length === 0) {
    throw new Error('No available Twilio phone numbers');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    voiceUrl: `${appUrl}/api/twilio/voice`,
    voiceMethod: 'POST',
    smsUrl: `${appUrl}/api/twilio/sms`,
    smsMethod: 'POST',
  });

  return purchased.phoneNumber;
}
