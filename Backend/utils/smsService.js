const twilio = require("twilio");
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSms(to, body) {
  const msg = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });
  return msg;
}

module.exports = { sendSms };
