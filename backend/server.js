// backend/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = 4000; // our backend will run at http://localhost:4000
const JWT_SECRET = "supersecret"; // change this to anything random

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware to check JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token format" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId: 1, role: "CUSTOMER" }
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}


// 🟢 Test route
app.get("/", (req, res) => {
    res.send("Backend API is working!");
});

// 🟢 Register new user
app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(400).json({ error: "Email already registered" });
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // create user
    const user = await prisma.user.create({
        data: { name, email, password: hashed },
    });

    res.json({ message: "User registered successfully", user });
});

// 🟢 Login
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    // create JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1d",
    });

    res.json({ message: "Login successful", token });
});

// 🟢 Get all products
app.get("/products", async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
});

// 🟢 Create a rental order (requires login)
app.post("/orders", authMiddleware, async (req, res) => {
    const { productId, start, end, qty } = req.body;

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ error: "Product not found" });

        const basePrice = product.basePriceDay || 0;
        const total = basePrice * qty;

        const order = await prisma.order.create({
            data: {
                userId: req.user.userId,
                productId,
                start: new Date(start),
                end: new Date(end),
                unit: "DAY",
                qty: parseInt(qty), // ✅ force to integer
                status: "QUOTE",
                priceBase: basePrice,
                discount: 0,
                total,
            },
        });


        res.json({ message: "Order created as QUOTE", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// 🟢 Get my orders (requires login)
app.get("/orders", authMiddleware, async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user.userId },
        include: { product: true },
    });
    res.json(orders);
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
