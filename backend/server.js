// backend/server.js

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS fix (иначе браузер не даст сделать fetch)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 🔑 ключи теперь берём из .env
const API_KEY = process.env.API_KEY;
const FOLDER_ID = process.env.FOLDER_ID;

if (!API_KEY || !FOLDER_ID) {
  console.error("❌ Ошибка: нет API_KEY или FOLDER_ID в .env");
  process.exit(1);
}

// эндпоинт для генерации маршрута
app.post("/api/route", async (req, res) => {
  const { city, preferences } = req.body;

  if (!city) {
    return res.status(400).json({ error: "Не указан город" });
  }

const prompt = `Ты — профессиональный гид. Создай персонализированный пешеходный маршрут по городу ${city}.
Пожелания пользователя: ${preferences || "не указаны"}.

ТРЕБОВАНИЯ:
- Маршрут должен длиться примерно столько времени, сколько указал пользователь
- Учитывай пожелания (например, музеи, кафе, парки и т.д.)
- Добавь 4–6 точек, в логической последовательности
- Для каждой точки укажи:
  - name (название места)
  - address (адрес или точка на карте)
  - description (короткое описание)
  - time (примерное время, например "30 мин")
- Верни ответ ТОЛЬКО в формате JSON:
{
  "route": [
    { "name": "Название", "address": "Адрес", "description": "Описание", "time": "30 мин" }
  ]
}`;


  try {
    const response = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Api-Key ${API_KEY}`,
        },
        body: JSON.stringify({
          modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite`,
          completionOptions: {
            stream: false,
            temperature: 0.7,
            maxTokens: 2000,
          },
          messages: [{ role: "user", text: prompt }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ error: err.message });
  }
});

// запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => 
  console.log(`✅ Proxy API работает на http://localhost:${PORT}`)
);
