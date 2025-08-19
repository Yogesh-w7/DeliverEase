// server.js
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app"); // Your Express app

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow your frontend origin here
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Emit a welcome message to the connected client
  socket.emit("hello", "Welcome to the socket server!");

  // Example listener for custom events (uncomment and customize if needed)
  // socket.on("some-event", (data) => {
  //   console.log("Received some-event:", data);
  //   // Respond or broadcast as needed
  // });

  // Log when client disconnects and reason
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} Reason: ${reason}`);
  });
});

// Start server on PORT environment variable or 5000 by default
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
