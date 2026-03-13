import { Text, View } from "react-native";
 
export default function AIChatScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-800">AI Guidance</Text>
      {/* <Text className="text-gray-500 mt-2">Step-by-step help is on the way.</Text> */}
      <Text className="text-gray-400 mt-4 italic">How can I assist you today?</Text>
    </View>
  );
}
 