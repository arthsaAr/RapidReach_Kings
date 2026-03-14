import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

// ── Paste your Gemini API key here (same one used in chat.tsx) ──
const GEMINI_API = "YOUR_API_PLEASE";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API}`;

// ── How long (ms) the recording auto-stops ──
const MAX_RECORD_MS = 10000;

// ── Prompt sent to Gemini (audio OR text path both use this) ──
const ANALYSIS_PROMPT = `You are an emergency triage assistant.
Your job is to analyze an emergency description and return structured JSON ONLY — no markdown, no explanation, no code fences.

Return this exact JSON shape:
{
  "transcript": "verbatim or paraphrased description of the emergency",
  "emergencyType": "short label e.g. Cardiac Arrest / Choking / Severe Bleeding / Allergic Reaction / Unconscious Person / Other",
  "summary": "1-2 sentence plain-English summary of the situation",
  "actions": ["Immediate action 1", "Immediate action 2", "Immediate action 3", "Immediate action 4"]
}

Rules:
- emergencyType must be a short label (max 4 words)
- actions must be 3-5 items, each a single imperative sentence
- If the audio/text is unclear, make a best guess based on context
- Return ONLY the JSON object, nothing else`;

// ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  // ── Location ──
  const [locationEnabled, setLocationEnabled] = useState(false);

  // ── Modal state ──
  const [modalVisible, setModalVisible] = useState(false);

  // ── Recording state ──
  type RecordingState = "idle" | "recording" | "done";
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // ── Fallback text ──
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  // ── Loading / analysing ──
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── Location check on mount ──
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationEnabled(status === "granted");
  };

  // ─────────────────────────────────────────────────────────────
  // Recording helpers
  // ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordingState("recording");
      setRecordingSeconds(0);

      // Tick every second
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      // Auto-stop after MAX_RECORD_MS
      autoStopRef.current = setTimeout(() => stopRecording(), MAX_RECORD_MS);
    } catch (err) {
      Alert.alert("Microphone Error", "Could not start recording. Use the text option instead.");
      setShowFallback(true);
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);

      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      setAudioUri(uri);
      setRecordingState("done");
    } catch (err) {
      Alert.alert("Error", "Recording stopped unexpectedly.");
      setRecordingState("idle");
    }
  };

  const resetRecording = () => {
    setRecordingState("idle");
    setAudioUri(null);
    setRecordingSeconds(0);
  };

  // ─────────────────────────────────────────────────────────────
  // Gemini analysis
  // ─────────────────────────────────────────────────────────────

  const analyzeWithAudio = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: uri.endsWith(".m4a") ? "audio/mp4" : "audio/3gpp", // expo-av records .m4a which is audio/mp4
                  data: base64,
                },
              },
              { text: ANALYSIS_PROMPT },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      }),
    });

    const data = await response.json();
    console.log("FULL GEMINI RESPONSE:", JSON.stringify(data, null, 2));
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  };

  const analyzeWithText = async (text: string) => {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${ANALYSIS_PROMPT}\n\nEmergency description: "${text}"\n\nReturn the JSON:`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  };

  const parseAnalysis = (raw: string | null) => {
    if (!raw) return null;
    try {
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Main send flow
  // ─────────────────────────────────────────────────────────────

  const handleSendEmergency = async () => {
    const hasAudio = !!audioUri;
    const hasText = fallbackText.trim().length > 0;

    if (!hasAudio && !hasText) {
      Alert.alert("No description", "Please record audio or type a description first.");
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. Get location
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("Location Off", "Please enable location services.");
        setIsAnalyzing(false);
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }
      if (status !== "granted") {
        Alert.alert("Location Required", "Location permission is needed to send an emergency.");
        setIsAnalyzing(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 2. Call Gemini
      let rawResponse: string | null = null;
      try {
        rawResponse = hasAudio
          ? await analyzeWithAudio(audioUri!)
          : await analyzeWithText(fallbackText.trim());
      } catch (apiErr) {
        console.warn("Gemini failed, using defaults:", apiErr);
      }

      console.log("RAW GEMINI RESPONSE:", rawResponse); 
      const analysis = parseAnalysis(rawResponse);
console.log("PARSED ANALYSIS:", analysis); 

      // 3. Write to Firebase
      await setDoc(doc(db, "emergencies", "current"), {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        type: analysis?.emergencyType ?? "Medical Emergency",
        summary: analysis?.summary ?? "",
        actions: analysis?.actions ?? [],
        transcript: analysis?.transcript ?? (hasAudio ? "(audio)" : fallbackText.trim()),
        timestamp: Date.now(),
      });

      // 4. Close modal and navigate
      setModalVisible(false);
      router.push({
        pathname: "/alert",
        params: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          emergencyType: analysis?.emergencyType ?? "Medical Emergency",
          summary: analysis?.summary ?? "",
          actions: JSON.stringify(analysis?.actions ?? []),
        },
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong. Please try again or call 911.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Open / close modal
  // ─────────────────────────────────────────────────────────────

  const openEmergencyModal = () => {
    resetRecording();
    setShowFallback(false);
    setFallbackText("");
    setModalVisible(true);
  };

  const closeModal = () => {
    if (recordingState === "recording") stopRecording();
    setModalVisible(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Timer display helper
  // ─────────────────────────────────────────────────────────────

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">

      {/* ── Emergency button ── */}
      <TouchableOpacity
        className="w-64 h-64 mb-5 rounded-full bg-red-500 justify-center items-center"
        onPress={openEmergencyModal}
      >
        <Text className="text-white text-3xl font-bold">EMERGENCY</Text>
      </TouchableOpacity>

      <Text className="text-xl mt-3 font-normal text-gray-600 text-center">
        Press if someone needs immediate help
      </Text>

      <TouchableOpacity
        className="mt-7 w-full border border-gray-500 bg-gray-100 py-4 rounded-2xl items-center"
        onPress={() => router.push("/chat")}
      >
        <Text className="text-gray-700 font-bold text-lg">AI Guidance</Text>
      </TouchableOpacity>

      {/* ─────────────────────────────────────────────────────────
          Emergency modal
      ───────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">

            {/* Header */}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-2xl font-bold text-gray-900">Describe the Emergency</Text>
              <TouchableOpacity onPress={closeModal} disabled={isAnalyzing}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-base mb-6">
              Record a quick voice clip so AI can guide you and your responder.
            </Text>

            {/* ── Audio recording section ── */}
            {!showFallback && (
              <View className="items-center mb-4">

                {/* Record / Stop button */}
                {recordingState === "idle" && (
                  <TouchableOpacity
                    className="w-24 h-24 rounded-full bg-red-500 items-center justify-center mb-3"
                    onPress={startRecording}
                  >
                    <Ionicons name="mic" size={40} color="white" />
                  </TouchableOpacity>
                )}

                {recordingState === "recording" && (
                  <>
                    {/* Pulsing ring effect via border */}
                    <TouchableOpacity
                      className="w-24 h-24 rounded-full bg-red-600 items-center justify-center mb-3 border-4 border-red-300"
                      onPress={stopRecording}
                    >
                      <Ionicons name="stop" size={36} color="white" />
                    </TouchableOpacity>
                    <Text className="text-red-500 font-semibold text-lg">
                      {formatTime(recordingSeconds)} / 0:10
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">Tap to stop</Text>
                  </>
                )}

                {recordingState === "done" && (
                  <View className="items-center">
                    <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-3">
                      <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
                    </View>
                    <Text className="text-green-600 font-semibold text-base">
                      Recorded {formatTime(recordingSeconds)}s
                    </Text>
                    <TouchableOpacity onPress={resetRecording} className="mt-2">
                      <Text className="text-gray-500 text-sm underline">Record again</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Tap to record hint */}
                {recordingState === "idle" && (
                  <Text className="text-gray-500 text-base mt-1">Tap to record (max 10s)</Text>
                )}
              </View>
            )}

            {/* ── Fallback text input ── */}
            {showFallback && (
              <View className="mb-4">
                <TextInput
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base"
                  placeholder="e.g. Person collapsed, not breathing, chest pain..."
                  placeholderTextColor="#9ca3af"
                  value={fallbackText}
                  onChangeText={setFallbackText}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => { setShowFallback(false); resetRecording(); }}
                  className="mt-2"
                >
                  <Text className="text-gray-500 text-sm underline">Use voice instead</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Toggle to text fallback */}
            {!showFallback && (
              <TouchableOpacity
                className="items-center mb-5"
                onPress={() => { setShowFallback(true); resetRecording(); }}
              >
                <Text className="text-gray-500 text-base underline">
                  Can't record? Type instead
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Send button ── */}
            <TouchableOpacity
              className={`w-full py-4 rounded-2xl items-center ${
                isAnalyzing ? "bg-gray-300" : "bg-red-500"
              }`}
              onPress={handleSendEmergency}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Analyzing...</Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-lg">Send Emergency</Text>
              )}
            </TouchableOpacity>

            {/* Skip AI, just send raw */}
            <TouchableOpacity
              className="items-center mt-4"
              onPress={async () => {
                // Sends without AI analysis — fastest fallback
                setIsAnalyzing(true);
                try {
                  const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                  });
                  await setDoc(doc(db, "emergencies", "current"), {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    type: "Medical Emergency",
                    summary: "",
                    actions: [],
                    transcript: "",
                    timestamp: Date.now(),
                  });
                  setModalVisible(false);
                  router.push({
                    pathname: "/alert",
                    params: { lat: location.coords.latitude, lng: location.coords.longitude },
                  });
                } finally {
                  setIsAnalyzing(false);
                }
              }}
              disabled={isAnalyzing}
            >
              <Text className="text-gray-400 text-sm">Skip — send alert immediately</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}