import { Send } from "iconsax-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const AVATAR_URL =
  "https://ui-avatars.com/api/?background=cbd5e1&color=fff&size=256&name=";

interface VolunteerCardProps {
  name: string;
  role: string;
  type?: "vertical" | "horizontal";
  onPress?: () => void;
}

export default function VolunteerCard({
  name,
  role,
  type = "vertical",
  onPress,
}: VolunteerCardProps) {
  // --- LAYOUT 1: HORIZONTAL (Organizing Secretary) ---
  if (type === "horizontal") {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className="bg-slate-50 border border-slate-100 flex-row items-center p-6 pr-6 rounded-3xl w-full mb-6 shadow-sm"
      >
        {/* Avatar */}
        <View className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 mr-4">
          <Image
            source={{ uri: AVATAR_URL + name }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Text Info */}
        <View className="flex-1">
          <Text className="text-slate-900 text-xl font-semibold leading-6 mb-1">
            {name.split(" ")[0]} {"\n"}
            {name.split(" ")[1] || ""}
          </Text>
          <Text className="text-slate-500 text-base font-medium">{role}</Text>
        </View>

        {/* Orange Icon Badge (Top Right) */}
        <View className="absolute top-0 right-0 bg-[#ff6d1f] p-3 rounded-bl-2xl rounded-tr-3xl">
          <Send size={24} color="white" variant="Linear" />
        </View>
      </TouchableOpacity>
    );
  }

  // --- LAYOUT 2: VERTICAL (Standard Crew) ---
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-slate-50 border border-slate-100 flex-col items-center px-8 pt-10 pb-6 rounded-[18px] w-fit h-fit mr-3 shadow-sm relative overflow-hidden "
    >
      {/* Avatar */}
      <View className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 mb-4 border-2 border-slate-200 shadow-sm">
        <Image
          source={{ uri: AVATAR_URL + name }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Text Info */}
      <View className="items-center w-full">
        <Text
          numberOfLines={1}
          className="text-slate-900 text-xl font-bold text-center mb-1 w-full"
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          className="text-slate-500 text-lg font-medium  tracking-wider text-center w-full"
        >
          {role}
        </Text>
      </View>

      {/* Orange Icon Badge (Top Right) */}
      <View className="absolute top-0 right-0 bg-[#ff6d1f] p-2.5 rounded-bl-2xl">
        <Send size={24} color="white" variant="Linear" />
      </View>
    </TouchableOpacity>
  );
}
