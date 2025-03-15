import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

//  Ensure API key exists before initializing Resend
if (!process.env.RESEND_API_KEY) {
  console.error(" Missing RESEND_API_KEY in .env");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

//  Improved CORS configuration (Allow Netlify + Local Dev)
app.use(
  cors({
    origin: [
      "https://portfolio-navraj.netlify.app", //  Deployed Frontend
      "http://localhost:5173", //  Local Dev (Vite default)
    ],
    methods: ["POST"], // Limit to only needed methods
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json()); //  Ensures JSON parsing

// 🔹 Contact form route
app.post("/send-email", async (req, res) => {
  try {
    console.log(" Incoming request body:", req.body);

    const { name, email, subject, message } = req.body;

    //  Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    //  Ensure receiver email is set in Render environment
    if (!process.env.RECEIVER_EMAIL) {
      console.error(" Missing RECEIVER_EMAIL in .env");
      return res.status(500).json({ success: false, message: "Server configuration error." });
    }

    //  Send email using Resend
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
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    console.log(" Email sent:", data);

    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error(" Error sending email:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
});

//  Start server
app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
