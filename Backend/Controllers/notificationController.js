const Notification = require("../models/Notification");
const Parcel = require("../models/Parcel");
const Customer = require("../models/Customer");
const { sendSms } = require("../utils/smsService");

// Send availability ping SMS to customer
exports.pingCustomer = async (req, res) => {
  try {
    const { parcelId } = req.body;
    const parcel = await Parcel.findOne({ parcelId }).populate("customerId");
    if (!parcel) return res.status(404).json({ message: "Parcel not found" });

    const customer = parcel.customerId;
    if (!customer.phone) return res.status(400).json({ message: "Customer phone not available" });

    // Compose SMS content
    const smsBody = `Hello ${customer.name}, your delivery for parcel #${parcel.parcelId} is scheduled. Are you available to receive it? Reply YES or NO within 15 minutes.`;

    // Send SMS
    await sendSms(customer.phone, smsBody);

    // Create notification entry with 15 minutes timeout
    const deadline = new Date(Date.now() + 15 * 60 * 1000);
    const notification = new Notification({
      parcel: parcel._id,
      status: "pending",
      deadline
    });
    await notification.save();

    res.json({ message: "Ping sent", notificationId: notification._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Receive customer response (simulate webhook or endpoint)
exports.receiveResponse = async (req, res) => {
  try {
    const { notificationId, response } = req.body;
    const notification = await Notification.findById(notificationId).populate("parcel");
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (notification.status !== "pending") return res.status(400).json({ message: "Notification already processed" });

    notification.status = "responded";
    await notification.save();

    // Update parcel based on response
    if (response.toLowerCase() === "yes") {
      notification.parcel.status = "in-transit";
    } else {
      // fallback e.g., mark skipped or schedule reattempt
      notification.parcel.status = "skipped";
    }
    await notification.parcel.save();

    res.json({ message: "Response processed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
