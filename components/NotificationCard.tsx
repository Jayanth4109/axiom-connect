import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Image,
    LayoutAnimation,
    Platform,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AVATAR_URL =
  "https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=128&name=";

interface NotificationCardProps {
  id: string;
  title: string;
  sender: string;
  message: string;
  timeAgo: string;
}

export default function NotificationCard({
  id,
  title,
  sender,
  message,
  timeAgo,
}: NotificationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRead, setIsRead] = useState(false);

  // 1. Check if this notification was already read
  useEffect(() => {
    checkReadStatus();
  }, []);

  const checkReadStatus = async () => {
    try {
      const readList = await AsyncStorage.getItem("read_notifications");
      if (readList) {
        const parsedList = JSON.parse(readList);
        if (parsedList.includes(id)) setIsRead(true);
      }
    } catch (e) {
      console.log("Error loading read status");
    }
  };

  const handlePress = async () => {
    // Toggle Expand
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);

    // Mark as Read if it's new
    if (!isRead) {
      setIsRead(true);
      try {
        const readList = await AsyncStorage.getItem("read_notifications");
        const parsedList = readList ? JSON.parse(readList) : [];
        if (!parsedList.includes(id)) {
          parsedList.push(id);
          await AsyncStorage.setItem(
            "read_notifications",
            JSON.stringify(parsedList)
          );
        }
      } catch (e) {
        console.log("Error saving read status");
      }
    }
  };

  // 2. Dynamic Styling (Orange = New, Gray = Read)
  const containerStyle = !isRead
    ? "bg-[#ffedd5] border-[#f97316]" // Orange (Unread)
    : "bg-[#f1f5f9] border-slate-200"; // Gray (Read)

  const textColor = !isRead ? "text-[#ea580c]" : "text-[#475569]";
  const subTextColor = !isRead ? "text-[#c2410c]" : "text-[#64748b]";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className={`w-full mb-4 border rounded-[24px] p-4 overflow-hidden ${containerStyle}`}
    >
      {/* Header: Sender Info */}
      <View className="flex-row items-center mb-3">
        <View className="w-[35px] h-[35px] rounded-full overflow-hidden mr-3 bg-white border border-black/5">
          <Image
            source={{ uri: AVATAR_URL + sender }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View>
          <Text className={`font-bold text-sm ${subTextColor}`}>{sender}</Text>
          <Text className="text-[10px] text-slate-400 font-medium">
            {timeAgo}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <Text className={`font-bold text-lg mb-1 ${textColor}`}>{title}</Text>

      <Text
        className={`font-medium text-[15px] leading-[24px] ${textColor} opacity-90`}
        numberOfLines={expanded ? undefined : 2}
      >
        {message}
      </Text>
    </TouchableOpacity>
  );
}
