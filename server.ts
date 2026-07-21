import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Share Gemini setup
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI custom walking session planner endpoint
app.post("/api/gemini/plan-walk", async (req, res) => {
  try {
    const { activityType, energyLevel, availableTime, focusGoal } = req.body;
    
    const client = getGeminiClient();
    
    const prompt = `Plan a personalized fitness session for an user with these parameters:
    - Activity Type: ${activityType || "Walking"}
    - Current Energy Level: ${energyLevel || "Moderate"}
    - Available Time: ${availableTime || "30"} minutes
    - Focus Goal: ${focusGoal || "Explore scenic views"}
    
    Please provide a highly motivational workout breakdown, recommended intervals, a pacing table, mental mindfulness focuses, and an elite energetic quote.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are WalkBuddy AI, an elite energetic athletic performance and mental mindfulness coach. You create motivating, precise, and highly engaging interval walking, jogging, and sprinting plans with beautiful structured formatting.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "motivationalQuote", "mindfulnessTip", "warmupMinutes", "mainWorkout", "cooldownMinutes", "estimatedCalories", "intervalPacing"],
          properties: {
            title: {
              type: Type.STRING,
              description: "A super cool, athletic, epic title for this custom walk session"
            },
            motivationalQuote: {
              type: Type.STRING,
              description: "An inspiring, high-energy quote to push the user to start"
            },
            mindfulnessTip: {
              type: Type.STRING,
              description: "A short mindfulness exercise or breathing focus during the walk"
            },
            warmupMinutes: {
              type: Type.INTEGER,
              description: "Suggested warm-up duration in minutes"
            },
            cooldownMinutes: {
              type: Type.INTEGER,
              description: "Suggested cool-down duration in minutes"
            },
            estimatedCalories: {
              type: Type.INTEGER,
              description: "Rough estimated calories burned for this session duration"
            },
            mainWorkout: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Step by step list of the main interval stages with dynamic active descriptions"
            },
            intervalPacing: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["stage", "pace", "intensity"],
                properties: {
                  stage: { type: Type.STRING, description: "e.g., Warm-up, Push 1, Cruise, Power Sprint, Recovery" },
                  pace: { type: Type.STRING, description: "e.g., 6:30 /km" },
                  intensity: { type: Type.STRING, description: "e.g., 70%" }
                }
              }
            }
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini API");
    }
    
    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini Error:", err);
    res.status(500).json({
      error: "Could not generate custom walk session plan",
      details: err.message || err
    });
  }
});

// Configure Vite or Serve Static Production files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WalkBuddy Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
