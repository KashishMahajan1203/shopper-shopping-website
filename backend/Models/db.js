const dns = require("dns");
const mongoose = require("mongoose");

// "mongodb+srv://" URLs need a DNS SRV lookup. On some machines (VPN, proxy,
// ad-blocker) Node is pointed at a local DNS server (127.0.0.1) that doesn't
// answer, which fails with "querySrv ECONNREFUSED". In that case fall back to
// public DNS servers (override with DNS_SERVERS="1.1.1.1,8.8.8.8" in .env).
const fixDns = () => {
  const isLoopback = (ip) => ip.startsWith("127.") || ip === "::1";
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
  } else if (dns.getServers().every(isLoopback)) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
};

const connectDB = async (url = process.env.MONGO_CONN) => {
  if (!url) {
    console.error("MONGO_CONN is not set in .env");
    process.exit(1);
  }
  fixDns();
  try {
    await mongoose.connect(url);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
