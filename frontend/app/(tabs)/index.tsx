import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";

export default function TabOneScreen() {
  const [city, setCity] = useState("");
  const [preferences, setPreferences] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState<any[]>([]);

  const generateRoute = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, preferences }),
      });

      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      const data = await response.json();

      let resultText: string | undefined =
        data?.result?.alternatives?.[0]?.message?.text;

      if (!resultText) throw new Error("AI вернул пустой ответ");

      // убираем обертку ```json ... ```
      resultText = resultText.trim();
      if (resultText.startsWith("```")) {
        resultText = resultText.replace(/```json|```/g, "").trim();
      }

      // ищем JSON внутри текста
      const match = resultText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Не удалось найти JSON в ответе AI");

      const parsedResult = JSON.parse(match[0]);

      if (Array.isArray(parsedResult.route)) {
        setRoutePoints(parsedResult.route);
      } else {
        throw new Error("Неверный формат маршрута");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // функция для подсчёта общего времени маршрута
  const getTotalTime = () => {
    let totalMinutes = 0;
    routePoints.forEach((point) => {
      if (point.time) {
        const match = point.time.match(/(\d+)\s*мин/);
        if (match) {
          totalMinutes += parseInt(match[1], 10);
        }
        const matchHours = point.time.match(/(\d+)\s*ч/);
        if (matchHours) {
          totalMinutes += parseInt(matchHours[1], 10) * 60;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Логотип + описание */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.description}>
          Мобильный гид, который с помощью нейросети создает идеальные,
          персонализированные пешеходные маршруты, включающие как ключевые
          достопримечательности, так и неизвестные уголки города.
        </Text>
      </View>

      {/* Инпуты */}
      <Text style={styles.label}>Введите город:</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="Москва"
        placeholderTextColor="#999"
        style={styles.input}
      />

      <Text style={styles.label}>Что вы хотите увидеть?</Text>
      <TextInput
        value={preferences}
        onChangeText={setPreferences}
        placeholder="музеи, кафе, прогулка по набережной"
        placeholderTextColor="#999"
        style={styles.input}
      />

      <View style={styles.buttonContainer}>
        <Button title="Создать маршрут" onPress={generateRoute} color="#007AFF" />
      </View>

      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Вывод маршрута */}
      {routePoints.length > 0 && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeTitle}>Сгенерированный маршрут:</Text>
          {routePoints.map((point, index) => (
            <View key={index} style={styles.routeRow}>
              <Text style={styles.routeIndex}>{index + 1}.</Text>
              <View style={styles.routeTextWrap}>
                <Text style={styles.routePointName}>
                  {point.name || "Без названия"}
                </Text>

                {point.address ? (
                  <Text style={styles.routePointAddress}>
                    📍 Адрес: {point.address}
                  </Text>
                ) : null}

                {point.description ? (
                  <Text style={styles.routePointDesc}>
                    {point.description}
                  </Text>
                ) : null}

                {point.time ? (
                  <Text style={styles.routePointTime}>
                    ⏱ Время: {point.time}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {/* итоговое время */}
          <Text style={styles.totalTime}>
            🕒 Общее время маршрута: {getTotalTime()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 16,
    width: "100%",
  },
  logo: {
    width: 140,
    height: 40,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
    marginTop: 12,
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "transparent",
    color: "#000",
  },
  buttonContainer: {
    marginBottom: 20,
    marginTop: 6,
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  error: {
    color: "red",
    marginTop: 10,
    fontWeight: "500",
  },
  routeContainer: {
    marginTop: 25,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "transparent",
    width: "100%",
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  routeIndex: {
    width: 22,
    fontWeight: "700",
    fontSize: 15,
  },
  routeTextWrap: {
    flex: 1,
  },
  routePointName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  routePointAddress: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 6,
  },
  routePointDesc: {
    fontSize: 14,
    color: "#444",
  },
  routePointTime: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
  },
  totalTime: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
});
