import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import { db } from '../firebaseConfig';
 
export default function ResponderAlertScreen() {
  const router = useRouter();
  
  const [emergency, setEmergency] = useState(null);
  const [distance, setDistance] = useState(null);

  //checking live for any emergency
  useEffect(() => {
    const locc = onSnapshot(doc(db, 'emergencies', 'current'), async (snap) => {
      const data = snap.data();

      if (data) {
        const age = Date.now() - data.timestamp;
        if (age > 30000) return;
        setEmergency(data);

        // calculate distance from responder to emergency
        const responderLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });

        const dist = getDistance(
          responderLocation.coords.latitude,
          responderLocation.coords.longitude,
          data.lat,
          data.lng
        );
        setDistance(dist);
      }
    });
    return () => locc();
  }, []);

  //distance function to get distance between two coordinates and convert to meters
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };



  return (
    <View className="flex-1 bg-white px-6 pt-16">
      {emergency ? (
        <>
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="warning" size={40} color="#ef4444" />
          </View>
          <Text className="text-3xl font-bold text-gray-900">Emergency Nearby!</Text>
          <Text className="text-gray-500 text-lg mt-2 text-center">Someone needs immediate help</Text>
        </View>
        
        <View className="w-full border-2 border-red-400 rounded-2xl p-5 bg-red-50 mb-8">
          <View className="flex-row items-center mb-4">
            <Ionicons name="medkit" size={22} color="#ef4444" />
            <Text className="text-gray-500 text-base ml-2">Emergency Type</Text>
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-5">Medical Emergency</Text>

          <View className="h-px bg-red-200 mb-4" />

          <View className="flex-row items-center mb-2">
            <Ionicons name="location" size={22} color="#ef4444" />
            <Text className="text-gray-500 text-base ml-2">Distance</Text>
          </View>
          <Text className="text-gray-900 text-xl font-bold">
            {distance ? `${distance} meters` : 'Calculating...'}
          </Text>
        </View>
  
        <TouchableOpacity className="w-full bg-red-500 py-4 rounded-2xl items-center mb-4"
          onPress={async () => {
          const { getDoc, updateDoc } = await import('firebase/firestore');
          const responderSnap = await getDoc(doc(db, 'responders', 'responder1'));
          const responderName = responderSnap.data()?.name || 'A responder';
          
          await updateDoc(doc(db, 'emergencies', 'current'), {
            respondedBy: responderName,
            responding: true,
          });

          router.push({
            pathname: "/liveLocation",
            params: { lat: emergency?.lat, lng: emergency?.lng }
          });
        }}>
          <Text className="text-white font-bold text-lg">I'm Responding</Text>
        </TouchableOpacity>
  
        <TouchableOpacity className="w-full bg-gray-100 py-4 rounded-2xl items-center"
          onPress={() => router.back()}>
          <Text className="text-gray-700 font-bold text-lg">Unavailable</Text>
        </TouchableOpacity>
        </>
      ) : (
        //no emergency
        <View className="flex-1 justify-center items-center">
        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6">
          <Ionicons name="shield-checkmark" size={50} color="#22c55e" />
        </View>
        <Text className="text-3xl font-bold text-gray-900">All Clear</Text>
        <Text className="text-gray-500 text-lg mt-3 text-center">
          Everyone is safe at the moment.{'\n'}You'll be notified if help is needed.
        </Text>
      </View>
      )}
      
    </View>
  );
}