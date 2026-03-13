import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { db } from '../firebaseConfig';

export default function LiveLocationScreen() {
  const router = useRouter();

  const { lat, lng } = useLocalSearchParams();
  // const userLocation = {
  //   latitude: 37.78825,
  //   longitude: -122.4324,
  // };
  
  const userLocation = {
    latitude: parseFloat(lat as string) || 37.78825,
    longitude: parseFloat(lng as string) || -122.4324,
  };
 
  const [ responderLocation, setResponderLocation ] = useState({
    latitude: 37.79025,
    longitude: -122.4354,
  });

  useEffect(() => {
    const locc = onSnapshot(doc(db, 'responders', 'responders1'), (snap) => {
      const data = snap.data();
      if(data){
        setResponderLocation({
          latitude: data.lat,
          longitude: data.lng,
        });
      }
    });
    return () => locc();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <View className="bg-white border-b border-gray-200 px-6 mt-8 mb-3">
        <Text className="text-3xl font-bold text-gray-900">Live Map</Text>
      </View>
      
       <View className="flex-1 relative">

        {/** main map view */}
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.003,   //for zooms
              longitudeDelta: 0.003,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* Emergency Location in Red */}
            <Circle
              center={userLocation}
              radius={50}
              fillColor="rgba(239, 68, 68, 0.3)"
              strokeColor="rgba(239, 68, 68, 0.8)"
              strokeWidth={2}
            />
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="w-6 h-6 rounded-full bg-red-500 border-2 border-white" />
            </Marker>
  
            {/* Responder Location in Blue */}
            <Circle
              center={responderLocation}
              radius={50}
              fillColor="rgba(59, 130, 246, 0.3)"
              strokeColor="rgba(59, 130, 246, 0.8)"
              strokeWidth={2}
            />
            <Marker
              coordinate={responderLocation}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white" />
            </Marker>
          </MapView>
 


        {/* (for responder and emergency) */}
        <View className="absolute top-4 left-4 bg-white rounded-xl p-4 shadow-lg">
          <View className="flex-row items-center mb-2">
            <View className="w-4 h-4 rounded-full bg-red-500 mr-2" />
            <Text className="text-gray-800 text-sm font-semibold">Emergency</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-blue-500 mr-2" />
            <Text className="text-gray-800 text-sm font-semibold">Responder</Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-6 left-4 right-4">
        <View className="bg-green-50 rounded-2xl p-4 mb-1 shadow-lg border border-green-400">
            <View className="flex-row items-center mb-2">
              
              <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center mr-3">
                <Ionicons name="person" size={20} color="white" />
              </View>

              <View className="flex-1">
                <Text className="text-gray-900 text-lg font-bold">
                  Responder on the way
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  CPR Certified • First Aid Kit
                </Text>
              </View>

            </View>

            <View className="flex-row items-center mt-2">
              <Ionicons name="time-outline" size={18} color="#6b7280" />
              <Text className="text-gray-700 text-base ml-2 font-semibold">
                Estimated arrival: <Text className="text-green-600 font-bold">4 mins</Text>
              </Text>
            </View>
          </View>

            <TouchableOpacity
              className="bg-white py-4 mt-1 mb-2 rounded-2xl border border-gray-600 items-center shadow-md"
              onPress={() => router.push("/chat")}
            >
              <Text className="text-black font-bold text-lg">Get AI Guidance</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}