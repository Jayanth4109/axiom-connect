import { ArrowDown2, ArrowRight2 } from "iconsax-react-native";
import React, { useState } from "react";
import {
    LayoutAnimation,
    Platform,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AccordionProps {
  title: string;
  count: number;
  color: string; // 'orange' | 'yellow' | 'green' | 'red' | 'blue'
  children: React.ReactNode;
  isOpenDefault?: boolean;
}

export default function Accordion({
  title,
  count,
  color,
  children,
  isOpenDefault = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  // Color Mapping
  const colors: any = {
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: "#9a3412",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "#854d0e",
    },
    green: {
      bg: "bg-emerald-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "#166534",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "#991b1b",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "#1e40af",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-800",
      icon: "#1e293b",
    },
  };

  const theme = colors[color] || colors.slate;

  // REMOVED: if (count === 0) return null; -> Now always shows!

  return (
    <View className={`mb-4 border ${theme.border} rounded-2xl overflow-hidden`}>
      <TouchableOpacity
        onPress={toggleOpen}
        activeOpacity={0.7}
        className={`flex-row justify-between items-center p-4 ${theme.bg}`}
      >
        <View className="flex-row items-center">
          <Text className={`font-bold text-lg ${theme.text}`}>{title}</Text>
          <View className="bg-white px-2 py-0.5 rounded-full ml-2 border border-white/50">
            <Text className={`font-bold text-xs ${theme.text}`}>{count}</Text>
          </View>
        </View>
        {isOpen ? (
          <ArrowDown2 size={20} color={theme.icon} />
        ) : (
          <ArrowRight2 size={20} color={theme.icon} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View className="p-4 bg-white border-t border-slate-100">
          {count === 0 ? (
            <Text className="text-slate-400 text-center italic py-2">
              No tasks in this category.
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </View>
  );
}
