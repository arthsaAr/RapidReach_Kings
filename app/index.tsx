import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function InitialHomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      
      <View className="w-24 h-24 rounded-full bg-red-500 justify-center items-center">
          <Ionicons name="heart" size={50} color="white" />
      </View>

      <Text className="text-5xl font-bold text-black mt-3 text-center">Welcome to RapidReach</Text>

      <View className="flex-col justify-center items-center mt-3 px-4">
        <Text className="text-gray-500 text-xl mt-2 text-center">
          Help arrives before the ambulance.
        </Text>
        <Text className="text-gray-400 text-sm mt-1 text-center">
          Connect with trained responders nearby.
        </Text>
      </View>

      <TouchableOpacity
        className="mt-10 w-full bg-red-500 py-4 rounded-2xl items-center"
        onPress={() => router.push("/responderSetup")}
      >
        <Text className="text-white font-bold text-lg">I Want to Help (Responder)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 w-full bg-gray-100 py-4 rounded-2xl  border border-gray-500 items-center"
        onPress={() => router.push("/home")}
      >
        <Text className="text-gray-700 font-bold text-lg">Continue as User</Text>
      </TouchableOpacity>
    </View>
  );
}