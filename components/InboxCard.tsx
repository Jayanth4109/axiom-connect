import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const AVATAR_URL =
  "https://ui-avatars.com/api/?background=cbd5e1&color=fff&size=256&name=";

interface InboxCardProps {
  name: string;
  role: string;
  department?: string; // <--- Added Department Prop
  message: string;
  time: string; // <--- Added Time Prop
  isUnread?: boolean;
  onPress: () => void;
}

export default function InboxCard({
  name,
  role,
  department,
  message,
  time,
  isUnread = false,
  onPress,
}: InboxCardProps) {
  // Logic: "lead" -> "Design Head", "volunteer" -> "Volunteer"
  const getDisplayRole = () => {
    if (role === "lead" && department) return `${department} Head`;
    if (role === "lead") return "Team Head"; // Fallback
    return role.charAt(0).toUpperCase() + role.slice(1); // Capitalize "volunteer" -> "Volunteer"
  };

  const displayRole = getDisplayRole();

  // Helper to format time (e.g., "10:30" or "Yesterday")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() && date.getMonth() === now.getMonth();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`flex-row items-center p-3 mb-2 rounded-[24px] border ${
        isUnread
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-slate-50 border-transparent"
      }`}
    >
      {/* Avatar */}
      <View className="w-[50px] h-[50px] rounded-full bg-slate-200 overflow-hidden mr-4 border border-slate-100">
        <Image source={{ uri: AVATAR_URL + name }} className="w-full h-full" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center pr-2">
        <View className="flex-row justify-between items-center mb-2">
          <Text
            numberOfLines={1}
            className="text-[16px] text-slate-900 flex-1 mr-2"
          >
            <Text className="font-bold">{name}</Text>
            <Text className="text-slate-500 font-medium text-xs">
              {" "}
              | {displayRole}
            </Text>
          </Text>
          <Text className="text-[10px] text-slate-400 font-medium">
            {formatTime(time)}
          </Text>
        </View>

        <Text
          numberOfLines={1} // <--- Truncates to 1 line with "..."
          className={`text-[14px] leading-5 ${
            isUnread ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
          }`}
        >
          {message}
        </Text>
      </View>

      {/* Unread Dot */}
      {isUnread && (
        <View className="w-2.5 h-2.5 bg-[#ff6d1f] rounded-full ml-1" />
      )}
    </TouchableOpacity>
  );
}
