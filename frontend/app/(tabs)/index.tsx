import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function TabOneScreen() {
  const [city, setCity] = useState("");
  const [preferences, setPreferences] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("");
  const [routePoints, setRoutePoints] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const generateRoute = async () => {
    if (!city.trim()) {
      setError("Введите город");
      return;
    }

    setLoading(true);
    setError("");
    setApiStatus("Подключаемся к AI через backend...");

    try {
      setApiStatus("Отправляем запрос на backend...");

      const response = await fetch("http://localhost:3000/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, preferences }),
      });

      setApiStatus("Обрабатываем ответ AI...");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📨 Ответ backend:", JSON.stringify(data, null, 2));

      let resultText: string | undefined =
        data?.result?.alternatives?.[0]?.message?.text;

      if (!resultText) throw new Error("AI вернул пустой ответ");

      resultText = resultText.trim();

      if (resultText.startsWith("```")) {
        resultText = resultText.replace(/```json|```/g, "").trim();
      }

      const match = resultText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Не удалось найти JSON в ответе AI");

      const parsedResult = JSON.parse(match[0]);

      if (Array.isArray(parsedResult.route)) {
        setRoutePoints(parsedResult.route);
        setModalVisible(false);
        setApiStatus("✅ Маршрут создан с помощью AI!");
      } else {
        throw new Error("Неверный формат маршрута от AI");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";
      console.error("❌ Ошибка AI:", err);
      setError(`Ошибка AI: ${errorMessage}`);
      setApiStatus("❌ AI недоступен");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Введите город:</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="Москва"
        style={styles.input}
      />

      <Text style={styles.label}>Введите предпочтения:</Text>
      <TextInput
        value={preferences}
        onChangeText={setPreferences}
        placeholder="музеи, прогулка по набережной"
        style={styles.input}
      />

      <View style={styles.buttonContainer}>
        <Button title="Создать маршрут" onPress={generateRoute} />
      </View>

      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {apiStatus ? <Text style={styles.status}>{apiStatus}</Text> : null}

      {routePoints.length > 0 && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeTitle}>📍 Сгенерированный маршрут:</Text>
          {routePoints.map((point, index) => (
            <Text key={index} style={styles.routePoint}>
              {`${index + 1}. ${point.name} — ${point.description}`}
            </Text>
          ))}
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  error: {
    color: "red",
    marginTop: 10,
    fontWeight: "500",
  },
  status: {
    marginTop: 10,
    color: "#555",
  },
  routeContainer: {
    marginTop: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  routePoint: {
    fontSize: 15,
    marginBottom: 6,
  },
});
