import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Ensure API key exists before initializing Resend
if (!process.env.RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY in .env");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "https://portfolio-navraj.netlify.app",
      "http://localhost:5173",
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from ${origin}`;
    return callback(new Error(msg), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

// Contact form route
app.post("/send-email", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required." 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address." 
      });
    }

    if (!process.env.RECEIVER_EMAIL) {
      console.error("Missing RECEIVER_EMAIL in .env");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error." 
      });
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      reply_to: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 5px;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p>${message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send email." 
      });
    }

    console.log("Email sent successfully:", data);
    return res.status(200).json({ 
      success: true, 
      message: "Message sent successfully!" 
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred." 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});