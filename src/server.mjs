import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure API key is available
if (!process.env.RESEND_API_KEY) {
  console.error("Error: Missing RESEND_API_KEY. Check your .env file.");
  process.exit(1); 
}

// Initialize Resend with API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get("/", (req, res) => {
  res.send("Email API is running with Resend!");
});

// Contact Form Route
app.post("/send-email", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);
    
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.error("Missing required fields");
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Check recipient email
    if (!process.env.RECEIVER_EMAIL) {
      console.error("Missing RECEIVER_EMAIL in .env");
      return res.status(500).json({ success: false, message: "Server configuration error." });
    }

    // Send email using Resend
    const data = await resend.emails.send({
      from: `Portfolio Contact <onboarding@resend.dev>`,  
      to: process.env.RECEIVER_EMAIL,
      reply_to: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h3>New message from your portfolio contact form</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h4>Message:</h4>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    console.log("Email sent:", data);

    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }

});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
