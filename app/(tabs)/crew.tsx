import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View
} from "react-native";
import BottomNav from "../../components/BottomNav";
import VolunteerCard from "../../components/VolunteerCard";
import { supabase } from "../../lib/supabase";

// Define the departments we expect
const DEPARTMENTS = [
  "Technical",
  "Design",
  "Marketing",
  "Logistics",
  "Finance",
];

export default function CrewPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCrew();
  }, []);

  const fetchCrew = async () => {
    setLoading(true);
    // Fetch all profiles that have a name
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .not("full_name", "is", null);

    if (data) setProfiles(data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCrew();
    setRefreshing(false);
  }, []);

  // --- HELPER: Get Secretary (First Admin Found) ---
  const getSecretary = () => {
    return profiles.find((p) => p.role === "admin") || profiles[0];
  };

  // --- HELPER: Get Crew by Dept ---
  const getCrewByDept = (dept: string) => {
    return profiles.filter((p) => p.department === dept && p.role !== "admin");
  };

  const secretary = getSecretary();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* HEADER */}
      <View className="pt-16 px-6 pb-2 items-center bg-white z-10">
        <Text className="font-bold text-3xl text-[#ff6d1f] tracking-tighter">
          Event Crew
        </Text>
        <Text className="text-slate-400 font-medium uppercase text-l tracking-[4px] mt-1">
          The Team Behind Axiom
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView
        className="flex-1 pt-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff6d1f"
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#ff6d1f" className="mt-20" />
        ) : (
          <View className="pb-32">
            {/* 1. ORGANIZING SECRETARY (Horizontal Card) */}
            {secretary && (
              <View className="items-center mb-8 px-6">
                {/* Removed the separate text header here as requested */}
                <VolunteerCard
                  type="horizontal"
                  name={secretary.full_name}
                  role="Organizing Secretary"
                />
              </View>
            )}

            {/* 2. DEPARTMENT SECTIONS */}
            {DEPARTMENTS.map((dept) => {
              const crewMembers = getCrewByDept(dept);
              if (crewMembers.length === 0) return null; // Skip empty departments

              return (
                <View key={dept} className="mb-8">
                  <View className="px-6 mb-4 flex-row items-center">
                    <View className="w-1 h-6 bg-[#ff6d1f] rounded-full mr-3" />
                    <Text className="text-2xl font-bold text-slate-800 tracking-tight">
                      {dept} Crew
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                  >
                    {crewMembers.map((member) => (
                      <VolunteerCard
                        key={member.id}
                        type="vertical"
                        name={member.full_name}
                        // If they are a 'lead', show 'Technical Head', otherwise 'Volunteer'
                        role={
                          member.role === "lead" ? `${dept} Head` : "Volunteer"
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}
