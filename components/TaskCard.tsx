import { Lock1, Notification } from "iconsax-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TaskCardProps {
  title: string;
  description: string;
  assignedName: string;
  startTime?: string;
  endTime?: string;
  status: "pending" | "ongoing" | "completed";
  onAction?: () => void;
  onNudge?: () => void;
  viewMode: "my_tasks" | "monitoring";
}

export default function TaskCard({
  title,
  description,
  assignedName,
  startTime,
  endTime,
  status,
  onAction,
  onNudge,
  viewMode,
}: TaskCardProps) {
  const now = new Date();
  const start = startTime ? new Date(startTime) : null;
  const end = endTime ? new Date(endTime) : null;

  // Logic: Locked if Start Time is in FUTURE
  const isLocked = start && now < start && status === "pending";
  const isOverdue = end && now > end && status !== "completed";

  // Styles
  let containerStyle = "bg-[#f1f5f9] border-slate-200";
  let titleColor = "text-[#0f172a]";
  let btnStyle = "bg-[#020617]";
  let btnText = "Start Task";
  let btnTextColor = "text-white";

  if (status === "ongoing") {
    containerStyle = "bg-[#fefce8] border-[#facc15]";
    titleColor = "text-[#ca8a04]";
    btnStyle = "bg-[#eab308]";
    btnText = "Mark Completed";
    btnTextColor = "text-[#fefce8]";
  } else if (status === "completed") {
    containerStyle = "bg-[#ecfdf5] border-[#4ade80]";
    titleColor = "text-[#16a34a]";
    btnStyle = "bg-[#bbf7d0]";
    btnText = "Completed"; // Text is back
    btnTextColor = "text-[#166534]";
  } else if (isOverdue) {
    containerStyle = "bg-[#fef2f2] border-[#f87171]";
    titleColor = "text-[#dc2626]";
  }

  const formatTime = () => {
    if (!start && !end) return "Flexible Timing";
    if (!start && end)
      return `Deadline: ${end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    if (start && end)
      return `${start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    return "";
  };

  return (
    <View
      className={`border ${containerStyle} rounded-[24px] p-5 mb-4 w-full relative`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <Text
          className={`font-bold text-[20px] tracking-[-1px] flex-1 ${titleColor}`}
        >
          {title}
        </Text>
        {viewMode === "monitoring" && status !== "completed" && (
          <TouchableOpacity
            onPress={onNudge}
            className="bg-white p-2 rounded-full border border-slate-100 shadow-sm"
          >
            <Notification size={18} color="#f97316" variant="Bold" />
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-slate-500 text-sm leading-5 mb-4 font-medium">
        {description}
      </Text>

      {/* Meta Info */}
      <View className="mb-4">
        <Text className="font-bold text-xs uppercase text-slate-400 mb-1">
          {viewMode === "my_tasks" ? "Assigned By" : "Assigned To"}
        </Text>
        <Text className="font-bold text-slate-800 text-sm mb-3">
          {assignedName}
        </Text>

        <Text className="font-bold text-xs uppercase text-slate-400 mb-1">
          Schedule
        </Text>
        <View className="flex-row items-center">
          {isLocked && <Lock1 size={14} color="#94a3b8" className="mr-1" />}
          <Text
            className={`font-bold text-sm ${
              isOverdue ? "text-red-500" : "text-slate-800"
            }`}
          >
            {formatTime()}
          </Text>
        </View>
      </View>

      {/* Action Button (Now shows for Completed too, but disabled) */}
      {viewMode === "my_tasks" && (
        <TouchableOpacity
          onPress={onAction}
          disabled={isLocked || status === "completed"} // Disabled if completed
          activeOpacity={0.8}
          className={`h-12 rounded-xl justify-center items-center ${
            isLocked ? "bg-slate-300" : btnStyle
          }`}
        >
          <Text
            className={`font-bold text-base ${
              isLocked ? "text-slate-500" : btnTextColor
            }`}
          >
            {isLocked
              ? `Starts at ${start?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : btnText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
