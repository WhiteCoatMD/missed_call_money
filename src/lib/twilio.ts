const TWILIO_API = 'https://api.twilio.com/2010-04-01';

function getAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return { sid, auth: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') };
}

// Send SMS via Twilio Messaging Service (for 10DLC compliance)
export async function sendSms(from: string, to: string, body: string) {
  const { sid, auth } = getAuth();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  const params: Record<string, string> = { To: to, Body: body };
  if (messagingServiceSid) {
    params.MessagingServiceSid = messagingServiceSid;
  } else {
    params.From = from;
  }

  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Twilio SMS error: ${res.status}`);
  }
  return data;
}

// Purchase a Twilio phone number (US local), matching area code if possible
export async function purchasePhoneNumber(businessPhone?: string): Promise<string> {
  const { sid, auth } = getAuth();

  // Extract area code from business phone (e.g. +15551234567 → 555)
  const areaCode = businessPhone?.replace(/\D/g, '').replace(/^1/, '').slice(0, 3);

  // Try matching area code first, fall back to any US number
  let searchData;
  if (areaCode && areaCode.length === 3) {
    const areaRes = await fetch(
      `${TWILIO_API}/Accounts/${sid}/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&PageSize=1`,
      { headers: { 'Authorization': auth } }
    );
    searchData = await areaRes.json();
  }

  if (!searchData?.available_phone_numbers?.length) {
    const searchRes = await fetch(
      `${TWILIO_API}/Accounts/${sid}/AvailablePhoneNumbers/US/Local.json?PageSize=1`,
      { headers: { 'Authorization': auth } }
    );
    searchData = await searchRes.json();
  }

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

  // Add number to Messaging Service for 10DLC compliance
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (messagingServiceSid && purchaseData.sid) {
    try {
      await fetch(
        `https://messaging.twilio.com/v1/Services/${messagingServiceSid}/PhoneNumbers`,
        {
          method: 'POST',
          headers: {
            'Authorization': auth,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ PhoneNumberSid: purchaseData.sid }).toString(),
        }
      );
    } catch (err) {
      console.error('Failed to add number to Messaging Service:', err);
    }
  }

  return purchaseData.phone_number;
}

// Release a Twilio phone number (stop billing)
export async function releasePhoneNumber(phoneNumber: string): Promise<void> {
  const { sid, auth } = getAuth();

  // Look up the number's SID
  const listRes = await fetch(
    `${TWILIO_API}/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`,
    { headers: { 'Authorization': auth } }
  );
  const listData = await listRes.json();

  const numberSid = listData.incoming_phone_numbers?.[0]?.sid;
  if (!numberSid) return; // number not found, nothing to release

  // Delete the number
  const deleteRes = await fetch(
    `${TWILIO_API}/Accounts/${sid}/IncomingPhoneNumbers/${numberSid}.json`,
    { method: 'DELETE', headers: { 'Authorization': auth } }
  );

  if (!deleteRes.ok && deleteRes.status !== 404) {
    const errData = await deleteRes.json().catch(() => ({}));
    throw new Error((errData as Record<string, string>).message || `Twilio release error: ${deleteRes.status}`);
  }
}
