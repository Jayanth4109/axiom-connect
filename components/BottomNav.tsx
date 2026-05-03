import { usePathname, useRouter } from "expo-router";
import {
    Calendar,
    Home2,
    Notification,
    Profile2User,
    Send2,
} from "iconsax-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "Home", icon: Home2, route: "/(tabs)" },
    { name: "Schedule", icon: Calendar, route: "/(tabs)/schedule" },
    { name: "Alerts", icon: Notification, route: "/(tabs)/notifications" },
    { name: "Crew", icon: Profile2User, route: "/(tabs)/crew" },
    { name: "Inbox", icon: Send2, route: "/(tabs)/inbox" },
  ];

  return (
    <View className="bg-white border-t border-slate-200 pb-8 pt-4 px-6 flex-row justify-between items-center shadow-lg">
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.route;
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(tab.route as any)}
            className="items-center justify-center w-12 h-12"
          >
            <Icon
              size={28}
              color={isActive ? "#000000" : "#94a3b8"}
              variant={isActive ? "Bold" : "Linear"}
            />
            {isActive && (
              <View className="w-1 h-1 bg-black rounded-full mt-1" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
