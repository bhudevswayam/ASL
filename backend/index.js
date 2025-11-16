// backend/src/server.ts
// (Updated to use ES Module 'import' syntax)

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- 1. SETUP & CONFIG ---
dotenv.config(); // Load secrets from .env
const app = express();
app.use(express.json()); // Allow server to read JSON
app.use(cors());         // Allow your frontend to talk to this

// --- 2. GEMINI SETUP ---
// SECURE: Get key from .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- 3. DATABASE (MONGO) ---
// SECURE: Get connection string from .env file
mongoose.connect(process.env.MONGO_URI || "")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Could not connect to MongoDB", err));

// The "Blueprint" (Schema) for a Chat
const chatSchema = new mongoose.Schema({
  history: {
    type: [String], // An array of strings (e.g., "User (signed): HELLO")
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.model('Chat', chatSchema);

// --- 4. API ENDPOINTS (Your "Controllers") ---

/**
 * ENDPOINT 1: For the "New Chat" button
 * Creates a new, empty chat document and returns its ID.
 */
app.post('/api/chat/new', async (req, res) => {
  try {
    const newChat = new Chat(); // Create a new chat with an empty history
    await newChat.save();
    res.status(201).json({ chatId: newChat._id }); // Send the new ID back
  } catch (error) {
    res.status(500).json({ error: 'Could not create new chat' });
  }
});

/**
 * ENDPOINT 2: For the "Generate Sentence" button
 * This is the main one. It takes words, history, and a chat ID.
 * It calls Gemini, then saves both the user's line AND the AI's line.
 */
app.post('/api/chat/generate', async (req, res) => {
  const { words, history, chatId } = req.body;

  if (!words || !history || !chatId) {
    return res.status(400).json({ error: 'Missing words, history, or chatId' });
  }

  try {
    // --- 1. Call Gemini ---
    const text = words.join(" ");
    const historyString = history.length > 0 ? `History:\n${history.join("\n")}` : "";
    const prompt = `
      You are an AI assistant. Use the history for context.
      ${historyString}
      **Task:** Convert the user's new input into a natural sentence.
      - Input: "${text}"
        Sentence:
    `;
    
    const result = await geminiModel.generateContent(prompt);
    const fullSentence = result.response.text();

    // --- 2. Save to Database ---
    const userLine = `User (signed): ${text}`;
    const aiLine = `AI (generated): ${fullSentence}`;
    
    await Chat.findByIdAndUpdate(chatId, {
      $push: { history: { $each: [userLine, aiLine] } }
    });

    // --- 3. Send Response to Frontend ---
    res.json({ fullSentence: fullSentence });

  } catch (error) {
    console.error("Gemini or DB error:", error);
    res.status(500).json({ error: 'Failed to generate sentence' });
  }
});

/**
 * ENDPOINT 3: For the "Listen" button
 * Takes the spoken text and saves it to the chat.
 */
app.post('/api/chat/speak', async (req, res) => {
  const { transcript, chatId } = req.body;

  if (!transcript || !chatId) {
    return res.status(400).json({ error: 'Missing transcript or chatId' });
  }

  try {
    const spokenLine = `Other Person (spoke): ${transcript}`;
    await Chat.findByIdAndUpdate(chatId, {
      $push: { history: spokenLine }
    });
    res.status(200).json({ message: 'Spoken text saved' });
  } catch (error) {
    res.status(500).json({ error: 'Could not save spoken text' });
  }
});


// --- 5. START THE SERVER ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});