import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from '../firebaseConfig';


const trainingOptions = ["First Aider", "Paramedic", "Nurse", "Doctor", "Lifeguard", "Other"];

export default function ResponderSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasFirstAidKit, setHasFirstAidKit] = useState(false);
  const [hasAED, setHasAED] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [responderId] = useState(`responder_${Date.now()}`);

  // const db = getFirestore();

  //checking location permission status(current)
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationEnabled(status === 'granted');
  };

  const handleLocationToggle = async () => {
    if (locationEnabled) {
      // If currently enabled, inform user they need to disable in settings
      Alert.alert(
        "Location Services",
        "To disable location services, please go to your device settings.",
        [{ text: "OK" }]
      );
    } else {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationEnabled(true);
        Alert.alert(
          "Success",
          "Location services have been enabled.",
          [{ text: "OK" }]
        );
      } else {
        setLocationEnabled(false);
        Alert.alert(
          "Permission Denied",
          "Location permission is required to help connect you with nearby emergencies. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
      }
    }
  };

  //Checking if form is valid
  const isFormValid = name.trim() !== "" && trainingLevel !== "" && locationEnabled;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>

      <Text className="text-4xl font-bold text-gray-900 mt-8">Responder Profile Setup</Text>
      
      <Text className="text-gray-500 text-xl mt-2">Help us understand your training and capabilities.</Text>

      <Text className="text-gray-800 text-lg font-semibold mt-6">Name<Text className="text-red-800">*</Text></Text>
      <TextInput
        className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
        placeholder="Enter your name"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-gray-800 font-semibold text-lg mt-6">Training Level<Text className="text-red-800">*</Text></Text>
      
      <TouchableOpacity
        className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
        onPress={() => setDropdownOpen(!dropdownOpen)}
      >
        <Text className={trainingLevel ? "text-gray-800" : "text-gray-400"}>
          {trainingLevel || "Select your training level"}
        </Text>
        <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
      </TouchableOpacity>
      {dropdownOpen && (
        <View className="border border-gray-300 rounded-xl mt-1 overflow-hidden">
          {trainingOptions.map((option) => (
            <TouchableOpacity
              key={option}
              className="px-4 py-3 border-b border-gray-100"
              onPress={() => { setTrainingLevel(option); setDropdownOpen(false); }}
            >
              <Text className="text-gray-800">{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* asking for additional items*/}
      <Text className="text-gray-800 font-semibold text-lg mt-6">Equipment</Text>

      <TouchableOpacity
        className="mt-3 flex-row items-center justify-between"
        onPress={() => setHasFirstAidKit(!hasFirstAidKit)}
        activeOpacity={0.7}
      >
        <Text className="text-gray-600">I carry a first aid kit</Text>
        <View className={`w-12 h-6 rounded-full ${hasFirstAidKit ? "bg-red-500" : "bg-gray-300"} justify-center px-1`}>
          <View 
            className="w-4 h-4 bg-white rounded-full"
            style={{
              transform: [{ translateX: hasFirstAidKit ? 20 : 0 }]
            }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 flex-row items-center justify-between"
        onPress={() => setHasAED(!hasAED)}
        activeOpacity={0.7}
      >
        <Text className="text-gray-600">I have access to an AED</Text>
        <View className={`w-12 h-6 rounded-full ${hasAED ? "bg-red-500" : "bg-gray-300"} justify-center px-1`}>
          <View 
            className="w-4 h-4 bg-white rounded-full"
            style={{
              transform: [{ translateX: hasAED ? 20 : 0 }]
            }}
          />
        </View>
      </TouchableOpacity>

      {/*location services option*/}
      <Text className="text-gray-800 font-semibold text-lg mt-6">Location Services</Text>
      <TouchableOpacity
        className="mt-3 bg-black rounded-2xl px-4 py-4 flex-row items-center justify-between"
        onPress={handleLocationToggle}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name="location" size={20} color="white" />
          <Text className="text-white font-semibold">Enable Location Services</Text>
        </View>
        <View className={`w-12 h-6 rounded-full ${locationEnabled ? "bg-red-500" : "bg-gray-600"} justify-center px-1`}>
          <View 
            className="w-4 h-4 bg-white rounded-full"
            style={{
              transform: [{ translateX: locationEnabled ? 20 : 0 }]
            }}
          />
        </View>
      </TouchableOpacity>

      {/* Complete Registration */}
      <TouchableOpacity
        className={`mt-8 mb-8 w-full py-4 rounded-2xl items-center ${
          isFormValid ? "bg-red-500" : "bg-gray-300"
        }`}
        onPress={async () => {
          if (isFormValid) {
            //had to use watchpositionasync for live location
            await Location.watchPositionAsync(
            { 
              accuracy: Location.Accuracy.Balanced, 
              timeInterval: 5000,      // updates every 5 seconds
              distanceInterval: 5,     //or every 5 meters moved
            },
            (location) => {
              setDoc(doc(db, 'responders', responderId), {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                name: name
              });
            }
          );
            // const location = await Location.getCurrentPositionAsync({
            //   accuracy: Location.Accuracy.Lowest,
            // });
            // await setDoc(doc(db, 'responders', 'responder1'), {
            //   lat: location.coords.latitude,
            //   lng: location.coords.longitude
            // });
            router.push({
              pathname: "/responderAlert",
              params: { responderId }
            });
          }
        }}
        disabled={!isFormValid}
      >
        <Text className={`font-bold text-xl ${isFormValid ? "text-white" : "text-gray-500"}`}>
          Complete Registration
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}