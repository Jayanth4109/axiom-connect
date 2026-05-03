import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    useFonts,
} from "@expo-google-fonts/inter";
import { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    LogBox,
    Platform,
    View,
} from "react-native";
import "../lib/nativewind";
import { supabase } from "../lib/supabase";
import "./global.css";

// 1. Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

// 2. Suppress Warnings
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "functionality provided by expo-notifications was removed",
  "Expo Go push notifications",
]);

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // 3. Load Fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  // 4. Handle Auth Session
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 5000)
        );
        const authCheck = supabase.auth.getSession();

        const { data } = (await Promise.race([authCheck, timeout])) as any;
        setSession(data?.session || null);
      } catch (e) {
        console.error("Auth check failed", e);
        // Continue anyway to show the app
        setSession(null);
      } finally {
        setAuthInitialized(true);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 5. Protect Routes (Redirect logic)
  useEffect(() => {
    if (!authInitialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (session && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [session, segments, authInitialized, fontsLoaded]);

  // 6. Hide Splash Screen ONLY when everything is ready
  useEffect(() => {
    const hideSplash = async () => {
      if (authInitialized && fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.error("Error hiding splash screen", e);
        }
      }
    };
    hideSplash();
  }, [authInitialized, fontsLoaded]);

  // 7. Show loading while waiting, but still render Stack to avoid navigation errors
  const isLoading = !authInitialized || !fontsLoaded;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#020617",
            zIndex: 9999,
          }}
        >
          <ActivityIndicator size="large" color="#ff6d1f" />
        </View>
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "white" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </KeyboardAvoidingView>
  );
}
