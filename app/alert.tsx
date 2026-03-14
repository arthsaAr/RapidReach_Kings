import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { db } from '../firebaseConfig';

export default function EmergencyTriggeredScreen() {
  const router = useRouter();
  const { lat, lng, emergencyType, summary, actions } = useLocalSearchParams();

  const [respondedBy, setRespondedBy] = useState(null);
  const [declined, setDeclined] = useState(false);
  const [responderCount, setResponderCount] = useState(0);

  // Parse actions array passed from home.tsx
  let parsedActions: string[] = [];
  try {
    parsedActions = actions ? JSON.parse(actions as string) : [];
  } catch {
    parsedActions = [];
  }

  const hasAIGuidance = parsedActions.length > 0;

  // ── Animation refs ──
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Start pulsing when responder is confirmed
  useEffect(() => {
    if (!respondedBy) return;

    // Pulse scale — card gently grows and shrinks
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.025,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Glow opacity — border/bg flashes
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [respondedBy]);

  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['#86efac', '#16a34a'], // light green → strong green
  });

  const glowBgColor = glowAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['#f0fdf4', '#dcfce7'], // very light → soft green
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'emergencies', 'current'), (snap) => {
      const data = snap.data();
      if (data?.responding) setRespondedBy(data.respondedBy);
      if (data?.declined) setDeclined(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
      const fetchCount = async () => {
      const { query, where, getDocs } = await import('firebase/firestore');
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const q = query(
        collection(db, 'responders'),
        where('lastSeen', '>=', tenMinutesAgo)
      );
      const snap = await getDocs(q);
      setResponderCount(snap.size);
    };
    fetchCount();
  }, []);

  // useEffect(() => {
  //   const fetchCount = async () => {
  //     const snap = await getCountFromServer(collection(db, 'responders'));
  //     setResponderCount(snap.data().count);
  //   };
  //   fetchCount();
  // }, []);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View className="items-center mb-6 mt-4">
        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        </View>
      </View>

      <Text className="text-black text-4xl font-bold text-center">Emergency Sent</Text>
      <Text className="text-gray-500 text-lg mt-2 text-center">Notifying nearby responders</Text>

      {/* ── AI Guidance Card ── */}
      {hasAIGuidance && (
        <View className="mt-6 w-full bg-red-50 border-2 border-red-400 rounded-2xl p-5">
          <View className="flex-row items-center mb-3">
            <View className="bg-red-500 rounded-full px-3 py-1 flex-row items-center">
              <Ionicons name="warning" size={14} color="white" />
              <Text className="text-white font-bold text-sm ml-1">
                {emergencyType || "Medical Emergency"}
              </Text>
            </View>
          </View>

          {summary ? (
            <Text className="text-gray-700 text-base mb-4">{summary}</Text>
          ) : null}

          <Text className="text-red-600 font-bold text-lg mb-3">⚡ Do This Now</Text>
          {parsedActions.map((action, index) => (
            <View key={index} className="flex-row items-start mb-3">
              <View className="w-7 h-7 rounded-full bg-red-500 items-center justify-center mr-3 mt-0.5 shrink-0">
                <Text className="text-white font-bold text-sm">{index + 1}</Text>
              </View>
              <Text className="text-gray-800 text-base flex-1 leading-6">{action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Responders Notified ── */}
      <View className="mt-4 bg-white w-full rounded-2xl py-3 px-5 flex-row items-center border border-gray-300 justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
            <Ionicons name="people" size={25} color="#22c55e" />
          </View>
          <View>
            <Text className="text-gray-900 text-xl font-bold">Responders Notified</Text>
            <Text className="text-gray-600 text-base">{responderCount} responders in area</Text>
          </View>
        </View>
      </View>

      {/* ── Responder status — animated when confirmed ── */}
      {respondedBy ? (
        // ── ANIMATED card when responder confirmed ──
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            borderColor: glowBorderColor,
            backgroundColor: glowBgColor,
            borderWidth: 2,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 20,
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Icon with ripple behind it */}
          <View style={{ position: 'relative', marginRight: 12, width: 44, height: 44 }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#22c55e',
                opacity: glowAnim,
              }}
            />
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#16a34a',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 2,
                left: 2,
              }}
            >
              <Ionicons name="person" size={22} color="white" />
            </View>
          </View>

          <View className="flex-1">
            <Text style={{ color: '#14532d', fontSize: 18, fontWeight: 'bold' }}>
              🚨 Responder Coming!
            </Text>
            <Text style={{ color: '#15803d', fontSize: 15, fontWeight: '600', marginTop: 2 }}>
              {respondedBy} is on the way
            </Text>
          </View>
        </Animated.View>
      ) : (
        // ── Static card while waiting ──
        <View className="mt-3 bg-white w-full rounded-2xl py-3 px-5 flex-row border border-gray-300 items-center">
          <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
            <Ionicons name="time" size={25} color="#f59e0b" />
          </View>
          <View>
            <Text className="text-gray-900 text-xl font-bold">Waiting for Response</Text>
            <Text className="text-gray-600 text-base">This may take some time</Text>
          </View>
        </View>
      )}

      {/* ── No responders warning ── */}
      {declined && !respondedBy && (
        <View className="mt-3 w-full bg-red-50 border border-red-400 rounded-2xl py-3 px-5">
          <Text className="text-red-600 font-bold text-lg text-center">⚠️ No responders available</Text>
          <Text className="text-red-500 text-center mt-1">Please call 911 immediately</Text>
        </View>
      )}

      {/* ── Action buttons ── */}
      <TouchableOpacity
        className="mt-4 w-full bg-red-500 py-4 rounded-2xl items-center"
        onPress={() => router.push({
          pathname: "/liveLocation",
          params: { lat, lng }
        })}
      >
        <Text className="text-white font-bold text-lg">View Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-3 w-full bg-white py-4 rounded-2xl border border-gray-600 items-center"
        onPress={() => router.push("/chat")}
      >
        <Text className="text-black font-bold text-lg">Get More AI Guidance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-3 w-full bg-white py-4 rounded-2xl border border-gray-300 items-center"
        onPress={async () => {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'emergencies', 'current'), {
            cancelled: true,
            cancelledAt: Date.now(),
          });
          router.replace('/');
        }}
      >
        <Text className="text-gray-500 font-semibold text-base">Pressed by mistake?</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}