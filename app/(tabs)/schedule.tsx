import DateTimePicker from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";
import {
    Add,
    Clock,
    CloseCircle,
    Forbidden2
} from "iconsax-react-native";
import React, { useCallback, useEffect, useState } from "react";
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
import { supabase } from "../../lib/supabase";

// --- TYPES ---
type AgendaStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
type UserRole = "admin" | "lead" | "volunteer" | "vip" | "participant";

interface SubItem {
  title: string;
  time: string;
}

interface AgendaItem {
  id: string;
  title: string;
  startObj: Date;
  endObj: Date;
  startTime: string;
  endTime: string;
  status: AgendaStatus;
  subItems: SubItem[];
}

export default function SchedulePage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("participant");
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- MODAL STATES ---
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [dateStart, setDateStart] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(
    new Date(new Date().setHours(new Date().getHours() + 1))
  );
  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);
  const [subAgendas, setSubAgendas] = useState<SubItem[]>([]);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [newSubDuration, setNewSubDuration] = useState("");

  // --- 1. INITIALIZE ---
  useEffect(() => {
    fetchUserRole();
    fetchSchedule();

    const subscription = supabase
      .channel("public:schedule")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedule" },
        () => {
          fetchSchedule(false);
        }
      )
      .subscribe();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Check "Live" status every 10s

    return () => {
      clearInterval(timer);
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  };

  const fetchSchedule = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("schedule")
        .select("*")
        .order("start_time", { ascending: true });
      if (error) throw error;

      const formattedData: AgendaItem[] = (data || []).map((row: any) => {
        const s = new Date(row.start_time);
        const e = new Date(row.end_time);
        return {
          id: row.id,
          title: row.title,
          startObj: s,
          endObj: e,
          startTime: s.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          endTime: e.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          status: row.status,
          subItems: row.sub_items || [],
        };
      });
      setItems(formattedData);
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSchedule(false);
    setRefreshing(false);
  }, []);

  // --- 2. ADMIN ACTIONS (3 Options) ---
  const handleLongPress = (item: AgendaItem) => {
    if (userRole !== "admin") return;

    Alert.alert("Manage Agenda", `Choose action for "${item.title}"`, [
      { text: "Edit", onPress: () => openEditModal(item) },
      {
        text: "Cancel",
        onPress: () => confirmCancel(item),
        style: "default",
      },
      {
        text: "Delete",
        onPress: () => confirmDelete(item),
        style: "destructive",
      },
      { text: "Close", style: "cancel" },
    ]);
  };

  // --- A. CANCEL LOGIC (Mark Red, No Shift) ---
  const confirmCancel = (item: AgendaItem) => {
    Alert.alert(
      "Cancel Agenda?",
      "This will mark the event as Cancelled (Red) but keep the time slot occupied.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel It",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase
              .from("schedule")
              .update({ status: "cancelled" })
              .eq("id", item.id);
            setLoading(false);
            if (error) Alert.alert("Error", error.message);
            else fetchSchedule(false);
          },
        },
      ]
    );
  };

  // --- B. DELETE LOGIC (Choice: Shift or Just Delete) ---
  const confirmDelete = (item: AgendaItem) => {
    Alert.alert(
      "Delete Agenda",
      "Do you want to shift subsequent events up to fill the gap?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Only",
          onPress: () => performDelete(item, false),
        },
        {
          text: "Delete & Shift Up",
          style: "destructive",
          onPress: () => performDelete(item, true),
        },
      ]
    );
  };

  const performDelete = async (
    itemToDelete: AgendaItem,
    shouldCascade: boolean
  ) => {
    setLoading(true);

    // 1. If Cascading: Update future events first
    if (shouldCascade) {
      const durationMs =
        itemToDelete.endObj.getTime() - itemToDelete.startObj.getTime();
      const updates: any[] = [];

      items.forEach((item) => {
        // Find items that start AFTER the deleted item starts
        if (
          item.id !== itemToDelete.id &&
          item.startObj > itemToDelete.startObj
        ) {
          const newStart = new Date(item.startObj.getTime() - durationMs);
          const newEnd = new Date(item.endObj.getTime() - durationMs);

          updates.push({
            id: item.id,
            title: item.title,
            status: item.status,
            sub_items: item.subItems,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          });
        }
      });

      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from("schedule")
          .upsert(updates);
        if (updateError) {
          setLoading(false);
          return Alert.alert("Cascade Error", updateError.message);
        }
      }
    }

    // 2. Delete the target item
    const { error } = await supabase
      .from("schedule")
      .delete()
      .eq("id", itemToDelete.id);

    setLoading(false);
    if (error) Alert.alert("Delete Error", error.message);
    else fetchSchedule(false);
  };

  // --- C. EDIT / ADD LOGIC ---
  const openEditModal = (item: AgendaItem) => {
    setEditingId(item.id);
    setNewTitle(item.title);
    setDateStart(item.startObj);
    setDateEnd(item.endObj);
    setSubAgendas(item.subItems);
    setModalVisible(true);
  };

  const handleSaveAgenda = async () => {
    if (!newTitle) return Alert.alert("Missing Info", "Title is required");

    const payload = {
      title: newTitle,
      start_time: dateStart.toISOString(),
      end_time: dateEnd.toISOString(),
      status: "upcoming",
      sub_items: subAgendas,
    };

    setLoading(true);
    let error;

    if (editingId) {
      const { error: err } = await supabase
        .from("schedule")
        .update(payload)
        .eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from("schedule").insert([payload]);
      error = err;
    }

    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else resetModal();
    fetchSchedule(false);
  };

  // --- UI HELPERS ---
  const getStatus = (item: AgendaItem) => {
    if (item.status === "cancelled") return "cancelled";
    const now = currentTime;
    if (now > item.endObj) return "completed";
    if (now >= item.startObj && now <= item.endObj) return "ongoing";
    return "upcoming";
  };

  const resetModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setNewTitle("");
    setSubAgendas([]);
    const now = new Date();
    setDateStart(now);
    setDateEnd(new Date(now.getTime() + 60 * 60 * 1000));
  };

  const addSubAgenda = () => {
    if (!newSubTitle) return;
    setSubAgendas([
      ...subAgendas,
      { title: newSubTitle, time: newSubDuration || "10m" },
    ]);
    setNewSubTitle("");
    setNewSubDuration("");
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(null);
    if (selectedDate) {
      if (showPicker === "start") setDateStart(selectedDate);
      if (showPicker === "end") setDateEnd(selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* HEADER */}
      <View className="pt-16 px-6 pb-4 flex-row justify-between items-center bg-white z-10 border-b border-slate-100">
        <View>
          <Text className="text-[#ff6d1f] text-3xl font-bold tracking-tighter">
            Schedule
          </Text>
          <Text className="text-slate-500 font-medium">
            {currentTime.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>

        {userRole === "admin" && (
          <TouchableOpacity
            onPress={() => {
              resetModal();
              setModalVisible(true);
            }}
            className="w-12 h-12 bg-black rounded-full items-center justify-center shadow-md"
          >
            <Add size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* TIMELINE */}
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
        <View className="pb-32">
          <View className="absolute left-[83px] top-0 bottom-0 w-[1px] border-l border-dashed border-slate-300" />

          {items.map((item) => {
            const liveStatus = getStatus(item);

            let bgStyle = "bg-white border-slate-200";
            let textStyle = "text-slate-800";
            let dotColor = "bg-slate-300";
            let StatusIcon = null;

            if (liveStatus === "ongoing") {
              bgStyle = "bg-green-50 border-green-500";
              textStyle = "text-green-900";
              dotColor = "bg-green-500 animate-pulse";
            } else if (liveStatus === "completed") {
              bgStyle = "bg-slate-50 border-slate-100";
              textStyle = "text-slate-400";
            } else if (liveStatus === "cancelled") {
              bgStyle = "bg-red-50 border-red-200";
              textStyle = "text-red-800 decoration-line-through";
              dotColor = "bg-red-500";
              StatusIcon = Forbidden2;
            }

            return (
              <TouchableOpacity
                key={item.id}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={500}
                activeOpacity={userRole === "admin" ? 0.7 : 1}
                className="flex-row mb-6"
              >
                <View className="w-[75px] items-end pr-4 pt-4">
                  <Text
                    className={`font-bold text-base ${
                      liveStatus === "ongoing"
                        ? "text-green-600"
                        : "text-slate-600"
                    }`}
                  >
                    {item.startTime}
                  </Text>
                  <Text className="text-sm text-slate-400">
                    {item.endTime}
                  </Text>
                </View>

                <View className="w-5 items-center pt-5 z-10">
                  <View
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${dotColor}`}
                  />
                </View>

                <View className="flex-1 pl-4">
                  <View
                    className={`border ${bgStyle} rounded-2xl p-4 shadow-sm relative overflow-hidden`}
                  >
                    {liveStatus === "ongoing" && (
                      <Text className="text-[10px] font-bold text-green-600 uppercase mb-1">
                        Live Now
                      </Text>
                    )}
                    {liveStatus === "cancelled" && (
                      <View className="flex-row items-center mb-1">
                        <Forbidden2 size={12} color="#ef4444" variant="Bold" />
                        <Text className="text-[10px] font-bold text-red-500 uppercase ml-1">
                          Cancelled
                        </Text>
                      </View>
                    )}

                    <Text
                      className={`text-lg font-medium leading-6 ${textStyle}`}
                    >
                      {item.title}
                    </Text>

                    {item.subItems && item.subItems.length > 0 && (
                      <View className="mt-3 space-y-2 pt-3 border-t border-black/5">
                        {item.subItems.map((sub, idx) => (
                          <View
                            key={idx}
                            className="flex-row items-center justify-between"
                          >
                            <View className="flex-row items-center flex-1">
                              <View className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                              <Text className="text-sm text-slate-500">
                                {sub.title}
                              </Text>
                            </View>
                            <Text className="text-xs text-slate-400">
                              {sub.time}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* --- ADD / EDIT MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={resetModal}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[32px] h-[85%] w-full">
            <View className="p-6 pb-4 flex-row justify-between items-center border-b border-slate-100">
              <Text className="text-2xl font-bold text-slate-900">
                {editingId ? "Edit Agenda" : "New Agenda"}
              </Text>
              <TouchableOpacity onPress={resetModal}>
                <CloseCircle size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-6">
              <Text className="text-slate-500 mb-2 font-medium ml-1">
                Title
              </Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Agenda Title"
                className="bg-slate-50 p-4 rounded-2xl text-lg font-medium border border-slate-100 mb-6"
              />

              <View className="flex-row space-x-4 mb-8">
                <TouchableOpacity
                  onPress={() => setShowPicker("start")}
                  className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row justify-between items-center"
                >
                  <Text className="text-lg font-bold">
                    {dateStart.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Clock size={18} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowPicker("end")}
                  className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row justify-between items-center"
                >
                  <Text className="text-lg font-bold">
                    {dateEnd.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Clock size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View className="mb-8">
                {subAgendas.map((sub, idx) => (
                  <View
                    key={idx}
                    className="flex-row justify-between items-center bg-slate-50 p-3 rounded-xl mb-2"
                  >
                    <Text className="font-medium text-slate-700">
                      {sub.title}
                    </Text>
                    <Text className="text-slate-400 text-xs">{sub.time}</Text>
                  </View>
                ))}
                <View className="flex-row space-x-2 mt-2">
                  <TextInput
                    value={newSubTitle}
                    onChangeText={setNewSubTitle}
                    placeholder="Sub-item"
                    className="flex-[2] bg-white border border-slate-200 p-3 rounded-xl"
                  />
                  <TextInput
                    value={newSubDuration}
                    onChangeText={setNewSubDuration}
                    placeholder="Dur"
                    className="flex-1 bg-white border border-slate-200 p-3 rounded-xl"
                  />
                  <TouchableOpacity
                    onPress={addSubAgenda}
                    className="bg-black w-12 rounded-xl items-center justify-center"
                  >
                    <Add size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveAgenda}
                className="bg-[#ff6d1f] py-4 rounded-2xl items-center mb-10 shadow-lg shadow-orange-200"
              >
                <Text className="text-white font-bold text-lg">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </ScrollView>
            {showPicker && (
              <DateTimePicker
                value={showPicker === "start" ? dateStart : dateEnd}
                mode="time"
                display="spinner"
                onChange={onDateChange}
              />
            )}
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}
