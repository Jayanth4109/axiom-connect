import { useRouter } from "expo-router";
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

export default function LoginScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSignIn() {
    if (!email || !fullName || !phone) {
      Alert.alert("Missing Fields", "Please fill in all details.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: {
          full_name: fullName,
          phone_number: phone,
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.push({ pathname: "/(auth)/verify", params: { email } });
    }
  }

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar style="light" />

      {/* This component watches the keyboard and scrolls automatically */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-between">
            {/* 1. Top Section */}
            <View className="items-center pt-24">
              <Text className="text-white text-[38px] font-medium tracking-widest mb-10">
                Axiom
              </Text>
              <View>
                <Text className="text-[#f1f5f9] text-[32px] font-medium tracking-tighter text-center leading-10">
                  Stay Informed,
                </Text>
                <Text className="text-[#f1f5f9] text-[32px] font-medium tracking-tighter text-center leading-10">
                  Stay Connected
                </Text>
              </View>
            </View>

            {/* 2. Bottom Section (The Form) */}
            <View className="bg-white rounded-t-[32px] px-6 py-8 pb-12 w-full shadow-2xl mt-10">
              <Text className="text-[#020617] text-2xl font-semibold tracking-tight text-center mb-8">
                Enter your details
              </Text>

              <View className="space-y-6">
                {/* Full Name */}
                <View className="relative">
                  <View className="h-[55px] border border-[#cbd5e1] rounded-2xl justify-center px-4">
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="John Doe"
                      placeholderTextColor="#94a3b8"
                      className="text-[#020617] text-base font-medium h-full"
                    />
                  </View>
                  <View className="absolute -top-3 left-4 bg-white px-1">
                    <Text className="text-[#cbd5e1] text-xs font-semibold uppercase tracking-wider">
                      Full Name
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <View className="relative">
                  <View className="h-[55px] border border-[#cbd5e1] rounded-2xl justify-center px-4">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      placeholder="21211A0501@bvrit.ac.in"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      className="text-[#020617] text-base font-medium h-full"
                    />
                  </View>
                  <View className="absolute -top-3 left-4 bg-white px-1">
                    <Text className="text-[#cbd5e1] text-xs font-semibold uppercase tracking-wider">
                      Email ID
                    </Text>
                  </View>
                </View>

                {/* Phone */}
                <View className="relative">
                  <View className="h-[55px] border border-[#cbd5e1] rounded-2xl justify-center px-4">
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="9876543210"
                      placeholderTextColor="#94a3b8"
                      className="text-[#020617] text-base font-medium h-full"
                    />
                  </View>
                  <View className="absolute -top-3 left-4 bg-white px-1">
                    <Text className="text-[#cbd5e1] text-xs font-semibold uppercase tracking-wider">
                      Mobile Number
                    </Text>
                  </View>
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  onPress={onSignIn}
                  disabled={loading}
                  className="bg-[#020617] h-[55px] rounded-2xl justify-center items-center mt-4 active:opacity-90"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">
                      Continue
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
