import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const GEMINI_API = "AIzaSyCCI-KaU_QoSOeAs953sgvBAK337dHExIo";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API}`;

export default function AIChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello, I'm here to help guide you through this emergency. Can you describe what's happening?",
      isAI: true,
      timestamp: new Date(),
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);


  const scrollViewRef = useRef(null);
  const quickMessages = ["Not breathing", "Bleeding", "Choking"];   //can change later

  const PROMPT = `You are an emergency first aid assistant. Your role is to provide ONLY 4-5 quick, actionable steps for emergency situations.
 
    STRICT RULES:
    - Give EXACTLY 4-5 steps, no more, no less
    - Each step must be ONE clear sentence
    - Number each step (1., 2., 3., etc.)
    - Be direct and urgent
    - Use simple language
    - Focus on immediate life-saving actions
    - No long explanations or theory
    - No disclaimers or warnings at the end
    
    Example format:
    1. Call 911 immediately
    2. Check if the person is breathing
    3. Tilt their head back to open the airway
    4. Begin CPR if they're not breathing
    5. Continue until help arrives`;

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const callGEMENIAPI = async (userMessage) => {
    try{
      console.log("Calling Gemini API with:", userMessage);
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${PROMPT}\n\nUser emergency: ${userMessage}\n\nProvide 4-5 numbered steps ONLY:`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,   //low more focused
              maxOutputTokens: 120,
              topP: 0.7,      //low more consistent
            }
          })
      });
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));

      if(data.candidates && data.candidates[0]?.content?.parts[0]?.text){
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response from GEMINI API");
      }
    } catch(error){
      console.error("Full error:", error);
      console.error("Error message:", error.message);
      return "I'm having trouble connecting right now. Please call 911 immediately!";
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const newMessage = {
      id: messages.length + 1,
      text: text.trim(),
      isAI: false,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage("");
    setIsLoading(true);

    const aiResponseText = await callGEMENIAPI(text.trim());

    const aiResponse = {
      id: messages.length + 2,
      text: aiResponseText,
      isAI: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);

    // setTimeout(() => {
    //   const aiResponse = {
    //     id: messages.length + 2,
    //     text: "I understand. Let me help you with that. Stay calm and follow these steps...!",
    //     isAI: true,
    //     timestamp: new Date(),
    //   };
    //   setMessages(prev => [...prev, aiResponse]);
    // }, 1000);
  };

  const handleQuickMessage = (quickMsg) => {
    sendMessage(quickMsg);
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View className="bg-red-500 border-b border-gray-200 px-6 pt-4 pb-3">
        <Text className="text-3xl font-bold mt-2 text-white">Emergency Guidance</Text>
        <Text className="text-white text-lg mt-1">AI-powered first aid assistant</Text>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-5 py-5"
        contentContainerStyle={{ paddingBottom: 15 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id}
            className={`flex-row mb-5 ${msg.isAI ? "" : "justify-end"}`}
          >
            {msg.isAI && (
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3 mt-1">
                <Ionicons name="logo-android" size={22} color="#ef4444" />
              </View>
            )}
            
            <View 
              className={`max-w-[75%] px-5 py-4 rounded-2xl ${
                msg.isAI 
                  ? "bg-gray-100" 
                  : "bg-red-500"
              }`}
            >
              <Text className={msg.isAI ? "text-gray-800" : "text-white"}
              style={{ fontSize: 16, lineHeight: 22 }}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

      {/* just loading first while waiting*/}
        {isLoading && (
          <View className="flex-row mb-5">
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3 mt-1">
              <Ionicons name="logo-robot" size={22} color="#ef4444" />
            </View>
            <View className="bg-gray-100 px-5 py-4 rounded-2xl">
              <ActivityIndicator size="small" color="#ef4444" />
            </View>
          </View>
        )}
      </ScrollView>

      {/** quick message */}
      <View className="px-5 pb-3">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-2"
        >
          {quickMessages.map((quickMsg, index) => (
            <TouchableOpacity
              key={index}
              className="bg-red-50 border border-red-200 px-5 py-3 rounded-full mr-2"
              onPress={() => handleQuickMessage(quickMsg)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text className="text-red-600 font-semibold">{quickMsg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Area */}
      <View className="px-5 pb-8 pt-3 bg-white border-t border-gray-200">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-gray-800"
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
            value={message}
            style={{ fontSize: 16 }}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            className="w-14 h-14 bg-red-500 rounded-full items-center justify-center"
            onPress={() => sendMessage(message)}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}