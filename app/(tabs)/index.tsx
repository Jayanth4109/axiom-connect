import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Add,
    ArrowDown2,
    CloseCircle,
    Monitor,
    SearchNormal1,
    Task as TaskIcon,
} from "iconsax-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Accordion from "../../components/Accordion";
import BottomNav from "../../components/BottomNav";
import TaskCard from "../../components/TaskCard";
import { supabase } from "../../lib/supabase";

const AVATAR_URL =
  "https://ui-avatars.com/api/?background=cbd5e1&color=fff&size=128&name=";
const DEPARTMENTS = [
  "Technical",
  "Design",
  "Marketing",
  "Logistics",
  "Finance",
  "Hospitality",
];

export default function HomePage() {
  const router = useRouter();

  // --- STATE ---
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [managedTasks, setManagedTasks] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal & Form
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [assignScope, setAssignScope] = useState<
    "individual" | "team" | "everyone"
  >("individual");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [teamTarget, setTeamTarget] = useState<"entire" | "lead">("entire");
  const [assigneeList, setAssigneeList] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [hasStartTime, setHasStartTime] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(
    new Date(new Date().getTime() + 60 * 60000)
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profile) {
        setMyProfile(profile);
        if (profile.role === "admin" || profile.role === "lead")
          fetchPotentialAssignees();
        await Promise.all([fetchMyTasks(user.id), fetchManagedTasks(user.id)]);
      }
      setLoading(false);
    } catch (e) {
      console.log("Error:", e);
      setLoading(false);
    }
  };

  const fetchMyTasks = async (userId: string) => {
    const { data } = await supabase
      .from("tasks")
      .select(`*, assigner:profiles!assigned_by(full_name, role)`)
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false });
    if (data) setMyTasks(data);
  };

  const fetchManagedTasks = async (userId: string) => {
    const { data } = await supabase
      .from("tasks")
      .select(`*, assignee:profiles!assigned_to(full_name, role)`)
      .eq("assigned_by", userId)
      .order("created_at", { ascending: false });
    if (data) setManagedTasks(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // --- ACTIONS ---
  const updateTaskStatus = async (taskId: string, currentStatus: string) => {
    let newStatus = "ongoing";
    if (currentStatus === "ongoing") newStatus = "completed";

    const updater = (prev: any[]) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setMyTasks(updater);
    setManagedTasks(updater);
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !newTaskDesc)
      return Alert.alert("Missing Info", "Fill Title & Details");
    setLoading(true);

    let targetIds: string[] = [];
    if (assignScope === "individual")
      targetIds = selectedAssignee ? [selectedAssignee.id] : [];
    else if (assignScope === "team") {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("department", selectedDept)
        .neq("role", "vip");
      if (data) targetIds = data.map((u) => u.id);
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .neq("role", "vip");
      if (data) targetIds = data.map((u) => u.id);
    }

    if (targetIds.length === 0) {
      setLoading(false);
      return Alert.alert("Error", "No users found.");
    }

    const payloads = targetIds.map((uid) => ({
      title: newTaskTitle,
      description: newTaskDesc,
      assigned_by: myProfile.id,
      assigned_to: uid,
      status: "pending",
      start_time: hasTimeLimit && hasStartTime ? startTime.toISOString() : null,
      end_time: hasTimeLimit ? endTime.toISOString() : null,
    }));

    await supabase.from("tasks").insert(payloads);
    setLoading(false);
    setModalVisible(false);
    loadAllData();
    Alert.alert("Success", "Tasks Assigned!");
  };

  const fetchPotentialAssignees = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, department")
      .neq("role", "vip");
    if (data) setAssigneeList(data);
  };

  const filteredAssignees = assigneeList.filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- CATEGORIZATION HELPER ---
  const categorizeTasks = (taskList: any[]) => {
    const now = new Date();
    return {
      // 1. UPCOMING: Pending + Start Time is Future
      upcoming: taskList.filter(
        (t) =>
          t.status === "pending" && t.start_time && new Date(t.start_time) > now
      ),
      // 2. ONGOING: Status is Ongoing
      ongoing: taskList.filter((t) => t.status === "ongoing"),
      // 3. PENDING: Status Pending + (No Start Time OR Start Time Past)
      pending: taskList.filter(
        (t) =>
          t.status === "pending" &&
          (!t.start_time || new Date(t.start_time) <= now)
      ),
      // 4. COMPLETED
      completed: taskList.filter((t) => t.status === "completed"),
    };
  };

  const myCats = categorizeTasks(myTasks);
  const managedCats = categorizeTasks(managedTasks);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* HEADER */}
      <View className="pt-16 px-6 pb-4 bg-white z-10 border-b border-slate-100 flex-row justify-between items-center">
        <View>
          <Text className="text-[#ff6d1f] text-3xl font-black tracking-tighter uppercase">
            AERIS 2026
          </Text>
          <Text className="text-slate-400 font-medium text-sm mt-1">
            Welcome, {myProfile?.full_name?.split(" ")[0]}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Options", "Logout?", [
              { text: "Cancel" },
              {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                  await supabase.auth.signOut();
                  router.replace("/(auth)/login");
                },
              },
            ])
          }
        >
          <View className="w-[45px] h-[45px] rounded-full border-2 border-slate-100 p-0.5">
            <Image
              source={{ uri: AVATAR_URL + (myProfile?.full_name || "User") }}
              className="w-full h-full rounded-full"
            />
          </View>
        </TouchableOpacity>
      </View>

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
        {loading && <ActivityIndicator color="#ff6d1f" className="mb-4" />}

        {/* --- TEAM OVERVIEW (Admin/Lead) --- */}
        {(myProfile?.role === "admin" || myProfile?.role === "lead") && (
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Monitor size={24} color="#0f172a" variant="Bold" />
              <Text className="text-2xl font-bold text-slate-900 ml-2">
                Team Overview
              </Text>
            </View>

            <Accordion
              title="Upcoming Tasks"
              count={managedCats.upcoming.length}
              color="blue"
            >
              {managedCats.upcoming.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assignee?.full_name}
                  viewMode="monitoring"
                  onNudge={() =>
                    Alert.alert("Nudge", `Sent to ${t.assignee?.full_name}`)
                  }
                />
              ))}
            </Accordion>

            <Accordion
              title="Ongoing Tasks"
              count={managedCats.ongoing.length}
              color="yellow"
              isOpenDefault
            >
              {managedCats.ongoing.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assignee?.full_name}
                  viewMode="monitoring"
                />
              ))}
            </Accordion>

            <Accordion
              title="Pending Tasks"
              count={managedCats.pending.length}
              color="red"
              isOpenDefault
            >
              {managedCats.pending.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assignee?.full_name}
                  viewMode="monitoring"
                  onNudge={() =>
                    Alert.alert("Nudge", `Sent to ${t.assignee?.full_name}`)
                  }
                />
              ))}
            </Accordion>

            <Accordion
              title="Completed Tasks"
              count={managedCats.completed.length}
              color="green"
            >
              {managedCats.completed.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assignee?.full_name}
                  viewMode="monitoring"
                />
              ))}
            </Accordion>
          </View>
        )}

        {/* --- MY TASKS --- */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <TaskIcon size={24} color="#ff6d1f" variant="Bold" />
            <Text className="text-2xl font-bold text-[#ff6d1f] ml-2">
              My Tasks
            </Text>
          </View>

          {/* 1. UPCOMING */}
          {myCats.upcoming.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-bold text-blue-600 uppercase mb-3 ml-1">
                Upcoming (Locked)
              </Text>
              {myCats.upcoming.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assigner?.full_name}
                  viewMode="my_tasks"
                  onAction={() => updateTaskStatus(t.id, t.status)}
                />
              ))}
            </View>
          )}

          {/* 2. ONGOING */}
          {myCats.ongoing.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-bold text-yellow-600 uppercase mb-3 ml-1">
                In Progress
              </Text>
              {myCats.ongoing.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assigner?.full_name}
                  viewMode="my_tasks"
                  onAction={() => updateTaskStatus(t.id, t.status)}
                />
              ))}
            </View>
          )}

          {/* 3. PENDING (Action Required) */}
          {myCats.pending.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-bold text-red-600 uppercase mb-3 ml-1">
                Pending Action
              </Text>
              {myCats.pending.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assigner?.full_name}
                  viewMode="my_tasks"
                  onAction={() => updateTaskStatus(t.id, t.status)}
                />
              ))}
            </View>
          )}

          {/* 4. COMPLETED */}
          {myCats.completed.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-bold text-green-600 uppercase mb-3 ml-1">
                Completed
              </Text>
              {myCats.completed.map((t) => (
                <TaskCard
                  key={t.id}
                  {...t}
                  assignedName={t.assigner?.full_name}
                  viewMode="my_tasks"
                />
              ))}
            </View>
          )}

          {!loading && myTasks.length === 0 && (
            <View className="bg-slate-50 p-6 rounded-2xl items-center">
              <Text className="text-slate-400 font-medium">
                You have no tasks assigned.
              </Text>
            </View>
          )}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* FAB */}
      {(myProfile?.role === "admin" || myProfile?.role === "lead") && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="absolute bottom-24 right-6 w-16 h-16 bg-black rounded-full items-center justify-center shadow-xl z-50"
        >
          <Add size={32} color="white" />
        </TouchableOpacity>
      )}

      {/* ASSIGN MODAL (Same as before) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-white rounded-t-[32px] h-[90%] w-full p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-slate-900">
                Assign Task
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseCircle size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* ... Keep the Form Logic (Title, Desc, Scope, Team Dropdown, Time) exactly as provided previously ... */}
              <Text className="text-slate-500 mb-2 font-medium ml-1">
                Title
              </Text>
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Task Title"
                className="bg-slate-50 p-4 rounded-2xl text-lg font-medium border border-slate-100 mb-4"
              />
              <TextInput
                value={newTaskDesc}
                onChangeText={setNewTaskDesc}
                placeholder="Instructions..."
                multiline
                numberOfLines={3}
                className="bg-slate-50 p-4 rounded-2xl text-base font-medium border border-slate-100 mb-6 h-24"
                style={{ textAlignVertical: "top" }}
              />

              <Text className="text-slate-500 mb-2 font-bold text-xs ml-1">
                ASSIGN TO
              </Text>
              <View className="flex-row space-x-3 mb-6">
                {["individual", "team", "everyone"].map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    onPress={() => setAssignScope(scope as any)}
                    className={`flex-1 py-3 rounded-xl border ${
                      assignScope === scope
                        ? "bg-black border-black"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-center font-bold capitalize ${
                        assignScope === scope ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {scope}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ... (Team Dropdown & Individual Search Logic from previous code) ... */}
              {assignScope === "team" && (
                <View className="mb-6 z-50">
                  <TouchableOpacity
                    onPress={() => setShowDeptDropdown(!showDeptDropdown)}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex-row justify-between items-center mb-4"
                  >
                    <Text className="font-bold text-slate-800">
                      {selectedDept}
                    </Text>
                    <ArrowDown2 size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showDeptDropdown && (
                    <View className="absolute top-16 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50">
                      {DEPARTMENTS.map((d) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => {
                            setSelectedDept(d);
                            setShowDeptDropdown(false);
                          }}
                          className="p-4 border-b border-slate-50"
                        >
                          <Text>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View className="flex-row space-x-4 -z-10">
                    <TouchableOpacity
                      onPress={() => setTeamTarget("entire")}
                      className={`flex-1 p-3 rounded-xl border ${
                        teamTarget === "entire"
                          ? "bg-orange-50 border-orange-500"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <Text className="text-center font-bold">Entire Team</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setTeamTarget("lead")}
                      className={`flex-1 p-3 rounded-xl border ${
                        teamTarget === "lead"
                          ? "bg-orange-50 border-orange-500"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <Text className="text-center font-bold">Lead Only</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {assignScope === "individual" && (
                <View className="mb-6">
                  <View className="bg-slate-50 border border-slate-200 rounded-2xl h-12 flex-row items-center px-4 mb-3">
                    <SearchNormal1 size={18} color="#94a3b8" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search name..."
                      className="flex-1 ml-3 font-medium"
                    />
                  </View>
                  <View className="h-40 bg-slate-50 rounded-2xl border border-slate-100">
                    <FlatList
                      data={filteredAssignees}
                      keyExtractor={(item) => item.id}
                      nestedScrollEnabled
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => setSelectedAssignee(item)}
                          className={`p-3 border-b border-slate-100 flex-row justify-between ${
                            selectedAssignee?.id === item.id
                              ? "bg-orange-100"
                              : ""
                          }`}
                        >
                          <Text className="font-bold text-slate-700">
                            {item.full_name}
                          </Text>
                          <Text className="text-xs text-slate-400 uppercase">
                            {item.department}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={handleCreateTask}
                className="bg-black py-4 rounded-2xl items-center shadow-lg mb-10 mt-4 -z-20"
              >
                <Text className="text-white font-bold text-lg">
                  Confirm Assignment
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNav />
    </View>
  );
}
