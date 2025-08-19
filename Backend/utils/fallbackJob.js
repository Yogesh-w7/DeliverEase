const cron = require("node-cron");
const Notification = require("../models/Notification");
const Parcel = require("../models/Parcel");
const Route = require("../models/Route");
const { optimizeRoute } = require("./routeOptimizer");

module.exports = function startJob() {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    const stale = await Notification.find({ status: "pending", deadline: { $lt: now } });
    for (let n of stale) {
      await Parcel.findByIdAndUpdate(n.parcel, { status: "skipped" });
      const routes = await Route.find({ parcels: n.parcel });
      for (let route of routes) {
        route.parcels = route.parcels.filter(p => p.toString() !== n.parcel.toString());
        route.optimizedPath = await optimizeRoute(route.parcels);
        await route.save();
      }
      n.status = "timed-out";
      await n.save();
    }
  });
};
