import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { db } from '../firebaseConfig';

export default function EmergencyTriggeredScreen() {
  const router = useRouter();
  const {lat, lng} = useLocalSearchParams();

  const [respondedBy, setRespondedBy] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'emergencies', 'current'), (snap) => {
      const data = snap.data();
      if (data?.responding) {
        setRespondedBy(data.respondedBy);
      }
    });
    return () => unsub();
  }, []);


  return (
    <View className="flex-1 justify-center items-center bg-white px-6">

       {/* green check head */}
      <View className="items-center mb-6">
        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        </View>
      </View>

      <Text className="text-black text-5xl font-bold text-center">Emergency Sent</Text>
      <Text className="text-gray-500 text-lg mt-4 text-center">Notifying nearby responders</Text>

      <View className="mt-8 bg-white w-full rounded-2xl py-3 px-5 flex-row items-center border border-gray-600 justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
            <Ionicons name="people" size={25} color="#22c55e" />
          </View>

          <View>
            <Text className="text-gray-900 text-xl font-bold">Responders Notified</Text>
            <Text className="text-gray-600 text-lg">4 responders in area</Text>
          </View>
        </View>
      </View>


      <View className={`mt-3 bg-white w-full rounded-2xl py-3 px-5 flex-row border items-center justify-between ${respondedBy ? 'border-green-500 bg-green-50' : 'border-gray-600'}`}>
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${respondedBy ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <Ionicons name={respondedBy ? "person" : "time"} size={25} color={respondedBy ? "#22c55e" : "#f59e0b"} />
        </View>
        <View>
          <Text className="text-gray-900 text-xl font-bold">
            {respondedBy ? "Responder Coming!" : "Waiting for Response"}
          </Text>
          <Text className="text-gray-600 text-lg">
            {respondedBy ? `${respondedBy} is on the way` : "This may take some time"}
          </Text>
        </View>
      </View>
    </View>

      {/* <View className="mt-3 bg-white w-full rounded-2xl py-3 px-5 flex-row  border border-gray-600 items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
            <Ionicons name="people" size={25} color="#22c55e" />
          </View>

          <View>
            <Text className="text-gray-900 text-xl font-bold">Waiting for Response</Text>
            <Text className="text-gray-600 text-lg">This may take some time</Text>
          </View>
        </View>
      </View> */}

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
        className="mt-4 w-full bg-white py-4 rounded-2xl  border border-gray-600 items-center"
        onPress={() => router.push("/chat")}
      >
        <Text className="text-black font-bold text-lg">Get AI Guidance</Text>
      </TouchableOpacity>
    </View>
  );
}