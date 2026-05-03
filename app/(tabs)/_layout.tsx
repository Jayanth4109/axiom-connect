import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 1. Hide the top header (We made our own custom header with "Schedule")
        headerShown: false,

        // 2. Hide the default bottom tab bar (We made our own "BottomNav")
        tabBarStyle: { display: "none" },
      }}
    >
      {/* 3. Register your screens here so the router knows they exist */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schedule" />
      {/* We will create these next, but it's safe to leave them here */}
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="crew" />
      <Tabs.Screen name="inbox" />
    </Tabs>
  );
}
