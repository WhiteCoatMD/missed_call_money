const TWILIO_API = 'https://api.twilio.com/2010-04-01';

function getAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return { sid, auth: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') };
}

// Send SMS via Twilio REST API
export async function sendSms(from: string, to: string, body: string) {
  const { sid, auth } = getAuth();
  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Twilio SMS error: ${res.status}`);
  }
  return data;
}

// Purchase a Twilio phone number (US local)
export async function purchasePhoneNumber(): Promise<string> {
  const { sid, auth } = getAuth();

  // Search for available numbers
  const searchRes = await fetch(
    `${TWILIO_API}/Accounts/${sid}/AvailablePhoneNumbers/US/Local.json?PageSize=1`,
    { headers: { 'Authorization': auth } }
  );
  const searchData = await searchRes.json();

  if (!searchData.available_phone_numbers || searchData.available_phone_numbers.length === 0) {
    throw new Error('No available Twilio phone numbers');
  }

  const phoneNumber = searchData.available_phone_numbers[0].phone_number;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://missed-call-money.vercel.app';

  // Purchase the number
  const purchaseRes = await fetch(`${TWILIO_API}/Accounts/${sid}/IncomingPhoneNumbers.json`, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      PhoneNumber: phoneNumber,
      VoiceUrl: `${appUrl}/api/twilio/voice`,
      VoiceMethod: 'POST',
      SmsUrl: `${appUrl}/api/twilio/sms`,
      SmsMethod: 'POST',
    }).toString(),
  });
  const purchaseData = await purchaseRes.json();

  if (!purchaseRes.ok) {
    throw new Error(purchaseData.message || `Twilio purchase error: ${purchaseRes.status}`);
  }

  return purchaseData.phone_number;
}
