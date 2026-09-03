const express = require("express");
const cors = require("cors");
const db = require("./db");
const authRoutes = require("./routes/auth");
const farmerRoutes = require("./routes/farmer");
const listingRoutes = require("./routes/listing");
const buyerRoutes = require("./routes/buyer");
const buyRequestRoutes = require("./routes/buyRequest");
const orderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment");
const deliveryRoutes = require("./routes/delivery");
const reviewRoutes = require("./routes/review");
const recommendationRoutes = require("./routes/recommendation");
const notificationRoutes = require("./routes/notification");
const chatRoutes = require("./routes/chat");
const chatAssistantRoutes = require("./routes/chatAssistant");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/buy-requests", buyRequestRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chat-assistant", chatAssistantRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

