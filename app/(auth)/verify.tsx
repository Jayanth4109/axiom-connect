import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { supabase } from "../../lib/supabase";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams(); // Get the email passed from Login screen
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  async function onVerify() {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter a 6-digit code.");
      return;
    }

    setLoading(true);
    // 1. Verify the Token
    const { data, error } = await supabase.auth.verifyOtp({
      email: email as string,
      token: otp,
      type: "email", // Crucial: We are verifying an Email OTP
    });

    setLoading(false);

    if (error) {
      Alert.alert("Verification Failed", error.message);
    } else {
      // 2. Success! Router will automatically handle the redirect in _layout.tsx
      // But we can force it just in case:
      router.replace("/(tabs)");
    }
  }

  async function onResend() {
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email as string,
    });
    setResending(false);

    if (error) {
      Alert.alert("Error", "Could not resend code.");
    } else {
      Alert.alert("Sent!", "Check your inbox for a new code.");
    }
  }

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar style="light" />

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-between">
            {/* 1. Top Section (Visuals) */}
            <View className="items-center pt-32">
              {/* Note: I adjusted top spacing to match the Login screen rhythm */}
              <View>
                <Text className="text-[#f1f5f9] text-[32px] font-medium tracking-tighter text-center leading-10">
                  Stay Informed,
                </Text>
                <Text className="text-[#f1f5f9] text-[32px] font-medium tracking-tighter text-center leading-10">
                  Stay Connected
                </Text>
              </View>
            </View>

            {/* 2. Bottom Section (The White Card) */}
            <View className="bg-white rounded-t-[32px] px-6 py-8 pb-12 w-full shadow-2xl mt-10 min-h-[50%]">
              <Text className="text-[#020617] text-2xl font-semibold tracking-tight text-center mb-2">
                Enter OTP
              </Text>

              <Text className="text-[#64748b] text-sm font-medium text-center mb-8">
                A 6-digit OTP was sent to {email}
              </Text>

              <View className="space-y-6">
                {/* OTP Input with Floating Label */}
                <View className="relative">
                  <View className="h-[55px] border border-[#cbd5e1] rounded-2xl justify-center px-4">
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="123456"
                      placeholderTextColor="#94a3b8"
                      className="text-[#020617] text-base font-medium h-full tracking-widest"
                    />
                  </View>
                  <View className="absolute -top-3 left-4 bg-white px-1">
                    <Text className="text-[#cbd5e1] text-xs font-semibold uppercase tracking-wider">
                      OTP
                    </Text>
                  </View>
                </View>

                {/* Resend Link */}
                <View className="flex-row justify-center items-center space-x-1">
                  <Text className="text-[#64748b] text-sm font-medium">
                    Didn't receive an OTP?
                  </Text>
                  <TouchableOpacity onPress={onResend} disabled={resending}>
                    <Text
                      className={`text-[#0f172a] text-sm font-bold underline ${
                        resending ? "opacity-50" : ""
                      }`}
                    >
                      {resending ? "Sending..." : "Resend"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={onVerify}
                  disabled={loading}
                  className="bg-[#020617] h-[55px] rounded-2xl justify-center items-center mt-2 active:opacity-90"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </View>
  );
}
