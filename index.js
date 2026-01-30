import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// const GEMINI_MODEL = 'gemini-2.5-flash'; //kenak limit jadi saya ganti ke lite
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// API Generate From Text
app.post('/api/chat', async (req,res) => {
    const { conversation } = req. body;
    try {
        if(!Array.isArray(conversation)) throw new Error("Conversation must be an array of messages.");

        const contents = conversation.map(({ role, content }) => ({
            role,
            parts: [{ text: content }]
        }));

        const response = await ai.models.generateContent ({
            model: GEMINI_MODEL, 
            contents,
            config: { 
                temperature: 0.7,
                systemInstruction: "Jawab hanya menggnakan bahasa Indonesia."
            } 
        });

        const resultText = response.text 
            ? response.text 
            : response.response?.text?.() 
            || response.candidates?.[0]?.content?.parts?.[0]?.text 
            || "Tidak ada respons.";

        const htmlResult = marked.parse(resultText);

        res.status(200).json({ result: htmlResult });
    } catch (e) {
        res. status (500).json ({ message: e.message });
    }
});

// API Generate From Text
app.post('/generate-text', async (req,res) => {
    const { prompt } = req. body;
    try {
        const response = await ai.models .generateContent ({
        model: GEMINI_MODEL, contents: prompt
    });
        res.status (200). json ({ result: response.text }) ;
    } catch (e) {
        console. log(e);
        res. status (500). json ({ message: e.message });
    }
});

// API Generate From Image
app.post ("/generate-from-image", upload.single ("image"), async (req, res) =>{
    const { prompt } = req.body;
    const base64Image = req.file.buffer.toString ("base64");
    try {
        const response = await ai.models.generateContent ({
            model: GEMINI_MODEL, 
            contents: [
                { text: prompt, type: "text" },
                { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
            ],
        });
        res.status (200). json({ result: response. text }) ;
    } catch (e) {
        console. log(e);
        res. status (500). json ({ message: e.message }) ;
    }
});

// API Generate From Document
app.post ("/generate-from-document", upload.single("document"), async (req, res) => {
    const { prompt } = req.body;
    const base64Document = req.file.buffer.toString("base64");
    try {
        const response = await ai.models.generateContent ({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", type: "text" },
                { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
            ],
        });
        
        res.status(200).json({ result: response.text });
    } catch (e) {
        console. log(e);
        res.status(500). json({ message: e.message });
    }
});

// API Generate From Audio
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          text: prompt ?? "Tolong buatkan transkrip dari rekaman berikut.",
          type: "text",
        },
        {
          inlineData: {
            data: base64Audio,
            mimeType: req.file.mimetype,
          },
        },
      ],
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

