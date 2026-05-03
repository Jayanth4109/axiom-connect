import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { Add, CloseCircle, Notification } from "iconsax-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import BottomNav from "../../components/BottomNav";
import NotificationCard from "../../components/NotificationCard";
import { supabase } from "../../lib/supabase";

// 1. CONFIGURATION
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userSignature, setUserSignature] = useState("");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    initialize();

    // REALTIME LISTENER (For everyone else)
    const subscription = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          fetchNotifications(false);
          triggerLocalNotification(payload.new.title, payload.new.description);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const initialize = async () => {
    await configureLocalNotifications();
    await checkPermissionsAndProfile();
    await fetchNotifications();
  };

  const configureLocalNotifications = async () => {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (error) {
      console.log("Error configuring notifications:", error);
    }
  };

  const checkPermissionsAndProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const firstName = data.full_name?.split(" ")[0] || "User";
        const dept = data.department || "General";
        setUserSignature(`${firstName} @ ${dept} Team`);

        if (data.role === "admin" || data.role === "lead") {
          setCanPost(true);
        }
      }
    }
  };

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(false);
    setRefreshing(false);
  };

  const triggerLocalNotification = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📢 ${title}`,
          body: body,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.log("Failed to schedule notification:", error);
    }
  };

  // --- THE FIXED POST LOGIC ---
  const handlePost = async () => {
    if (!newTitle || !newMessage)
      return Alert.alert("Missing Fields", "Please enter a title and message.");

    setLoading(true);

    // 1. Capture values before clearing state
    const tempTitle = newTitle;
    const tempMessage = newMessage;

    const { error } = await supabase.from("notifications").insert([
      {
        title: tempTitle,
        description: tempMessage,
        sender: userSignature,
        is_warning: false,
      },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // 2. Clear Modal Immediately
      setModalVisible(false);
      setNewTitle("");
      setNewMessage("");

      // 3. INSTANT FEEDBACK (The Fix)
      // Don't wait for Realtime. Force the update NOW.

      // A. Update List
      fetchNotifications(false);

      // B. Send Notification to Self
      triggerLocalNotification(tempTitle, tempMessage);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* HEADER */}
      <View className="pt-16 px-6 pb-4 flex-row justify-between items-center bg-white z-10 border-b border-slate-100">
        <View>
          <Text className="text-[#ff6d1f] text-3xl font-bold tracking-tighter">
            Alerts
          </Text>
          <Text className="text-slate-500 font-medium">
            Updates & Announcements
          </Text>
        </View>

        {canPost && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="w-12 h-12 bg-black rounded-full items-center justify-center shadow-md"
          >
            <Add size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff6d1f"
          />
        }
      >
        {!loading && items.length === 0 && (
          <View className="items-center mt-20 opacity-50">
            <Notification size={48} color="#cbd5e1" variant="Bold" />
            <Text className="text-slate-400 mt-4">No notifications yet.</Text>
          </View>
        )}

        {items.map((item) => (
          <NotificationCard
            key={item.id}
            id={item.id}
            title={item.title}
            sender={item.sender || "Admin Team"}
            message={item.description}
            timeAgo={getTimeAgo(item.created_at)}
          />
        ))}
        <View className="h-32" />
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[32px] p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-slate-900">
                Post Update
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseCircle size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-row items-center">
              <View className="w-8 h-8 bg-white rounded-full mr-3 border border-slate-200 justify-center items-center">
                <Text className="font-bold text-xs">
                  {userSignature.charAt(0)}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-slate-400 uppercase font-bold">
                  Posting As
                </Text>
                <Text className="text-slate-800 font-medium">
                  {userSignature}
                </Text>
              </View>
            </View>

            <Text className="text-slate-500 mb-2 font-medium ml-1">Title</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Schedule Change"
              className="bg-slate-50 p-4 rounded-2xl text-lg font-medium border border-slate-100 mb-6"
            />

            <Text className="text-slate-500 mb-2 font-medium ml-1">
              Message
            </Text>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your announcement..."
              multiline
              numberOfLines={4}
              className="bg-slate-50 p-4 rounded-2xl text-lg font-medium border border-slate-100 mb-8 h-32"
              style={{ textAlignVertical: "top" }}
            />

            <TouchableOpacity
              onPress={handlePost}
              className="bg-black py-4 rounded-2xl items-center shadow-lg"
            >
              <Text className="text-white font-bold text-lg">Broadcast</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}
