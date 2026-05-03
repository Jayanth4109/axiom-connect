import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SearchNormal1 } from "iconsax-react-native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import InboxCard from "../../components/InboxCard";
import { supabase } from "../../lib/supabase";

export default function InboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [myId, setMyId] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      initialize();
    }, [])
  );

  const initialize = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setMyId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) setMyRole(data.role);
      fetchConversations(user.id);
    }
  };

  const fetchConversations = async (userId: string) => {
    const { data } = await supabase
      .from("conversations")
      .select(
        `
        id, last_message, updated_at,
        user1:profiles!user1_id(id, full_name, role, department),
        user2:profiles!user2_id(id, full_name, role, department)
      `
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (data) {
      const formatted = data.map((c: any) => {
        const otherUser = c.user1.id === userId ? c.user2 : c.user1;
        return {
          id: c.id,
          otherUser,
          lastMessage: c.last_message || "Start chatting...",
          time: c.updated_at,
        };
      });
      setConversations(formatted);
    }
    setLoading(false);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    let query = supabase
      .from("profiles")
      .select("*")
      .ilike("full_name", `%${text}%`)
      .neq("id", myId);
    if (myRole !== "admin" && myRole !== "lead") {
      query = query.neq("role", "vip");
    }
    const { data } = await query.limit(5);
    if (data) setSearchResults(data);
  };

  const startChat = async (otherUser: any) => {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(user1_id.eq.${myId},user2_id.eq.${otherUser.id}),and(user1_id.eq.${otherUser.id},user2_id.eq.${myId})`
      )
      .single();

    let convoId = existing?.id;

    if (!convoId) {
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ user1_id: myId, user2_id: otherUser.id })
        .select()
        .single();
      if (error) return console.error(error);
      convoId = newConvo.id;
    }

    setSearchQuery("");
    setSearchResults([]);
    router.push({
      pathname: "/chat/[id]",
      params: { id: convoId, name: otherUser.full_name },
    });
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="pt-16 px-6 pb-2 bg-white z-10">
        <Text className="font-bold text-3xl text-[#ff6d1f] tracking-tighter">
          Inbox
        </Text>
      </View>

      <View className="px-6 py-4 z-20">
        <View className="border border-slate-200 rounded-[18px] h-16 flex-row items-center px-4">
          <SearchNormal1 size={20} color="#94a3b8" variant="Linear" strokeWidth={2.5}/>
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search users..."
            className="flex-1 ml-3 text-base font-medium text-slate-800"
          />
        </View>

        {searchResults.length > 0 && (
          <View className="bg-white border border-slate-100 rounded-2xl mt-2 p-2 shadow-2xl absolute top-16 left-6 right-6">
            {searchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => startChat(user)}
                className="p-4 border-b border-slate-50 flex-row justify-between"
              >
                <Text className="font-bold text-slate-800">
                  {user.full_name}
                </Text>
                <Text className="text-xs font-bold uppercase text-slate-400">
                  {user.role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#ff6d1f" />
        ) : conversations.length === 0 ? (
          <Text className="text-slate-400 text-center mt-10">
            No messages yet. Search to start a chat.
          </Text>
        ) : (
          conversations.map((convo) => (
            <InboxCard
              key={convo.id}
              name={convo.otherUser?.full_name || "Unknown"}
              role={convo.otherUser?.role || "Member"}
              department={convo.otherUser?.department}
              message={convo.lastMessage}
              time={convo.time}
              isUnread={false}
              onPress={() =>
                router.push({
                  pathname: "/chat/[id]",
                  params: { id: convo.id, name: convo.otherUser?.full_name },
                })
              }
            />
          ))
        )}
        <View className="h-32" />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
