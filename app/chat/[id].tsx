import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "iconsax-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { supabase } from "../../lib/supabase";

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();

    const subscription = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd(true);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const msg = newMessage.trim();
    setNewMessage("");
    Keyboard.dismiss();

    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: msg,
        sender_id: userId,
        created_at: new Date().toISOString(),
      },
    ]);

    setTimeout(() => scrollToBottom(), 50);

    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: userId,
      content: msg,
    });

    if (error) console.error("Send error:", error);

    await supabase
      .from("conversations")
      .update({ last_message: msg, last_message_time: new Date() })
      .eq("id", id);
  };

  return (
    <View className="flex-1 bg-white">
      {/* HEADER */}
      <View className="pt-16 pb-4 px-6 border-b border-slate-100 flex-row items-center bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 p-2 -ml-2"
        >
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-xl font-bold text-slate-900 flex-1"
        >
          {name || "Chat"}
        </Text>
      </View>

      {/* MESSAGES AREA WITH PROPER KEYBOARD HANDLING */}
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        enableOnAndroid={true}
        enableAutomaticScroll={Platform.OS === "ios"}
        extraHeight={Platform.OS === "ios" ? 120 : 0}
        extraScrollHeight={Platform.OS === "android" ? 120 : 0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-slate-50"
      >
        {/* MESSAGES LIST */}
        <View className="flex-1 px-4 py-4">
          {loading ? (
            <ActivityIndicator size="small" color="#ff6d1f" className="mt-10" />
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-400 text-base">No messages yet</Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === userId;
              return (
                <View
                  key={msg.id || index}
                  className={`mb-3 max-w-[80%] ${
                    isMe ? "self-end" : "self-start"
                  }`}
                >
                  <View
                    className={`p-4 rounded-2xl ${
                      isMe
                        ? "bg-[#ff6d1f] rounded-tr-sm"
                        : "bg-white border border-slate-200 rounded-tl-sm"
                    }`}
                  >
                    <Text
                      className={`text-[16px] ${
                        isMe ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {msg.content}
                    </Text>
                  </View>
                  <Text
                    className={`text-[10px] mt-1 text-slate-400 ${
                      isMe ? "text-right" : "text-left"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* INPUT BAR - FIXED AT BOTTOM */}
      <View className="p-4 border-t border-slate-100 flex-row items-center bg-white">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          onFocus={() => {
            setTimeout(() => scrollToBottom(), 300);
          }}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          className="flex-1 bg-slate-50 p-4 rounded-full mr-3 border border-slate-200 text-base text-slate-900 h-14"
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={sendMessage}
          activeOpacity={0.8}
          className="w-12 h-12 bg-black rounded-full items-center justify-center shadow-md"
        >
          <Send size={20} color="white" variant="Bold" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
