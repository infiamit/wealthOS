/**
 * WealthOS — Bottom Tab Navigator
 * 
 * 4-tab navigation: Core, Daily, Snapshot, Learn
 * Premium glassmorphic tab bar with neon active states and haptic feedback.
 */

import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import CoreScreen from '@/screens/CoreScreen';
import DailyScreen from '@/screens/DailyScreen';
import SimulatorScreen from '@/screens/SimulatorScreen';
import SnapshotScreen from '@/screens/SnapshotScreen';
import LearnScreen from '@/screens/LearnScreen';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/styles/theme';

const Tab = createBottomTabNavigator();

// ============================================================
// TAB ICON LABEL — Simple emoji + glow effect
// ============================================================
function TabIconLabel({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
      <Text style={[styles.emojiText, { opacity: focused ? 1 : 0.5 }]}>
        {emoji}
      </Text>
    </View>
  );
}

// ============================================================
// TAB NAVIGATOR
// ============================================================
export default function TabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: ThemeColors.neonGreen,
          tabBarInactiveTintColor: ThemeColors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
        screenListeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          },
        }}
      >
        <Tab.Screen
          name="Core"
          component={CoreScreen}
          options={{
            tabBarLabel: 'Core',
            tabBarIcon: ({ focused }) => (
              <TabIconLabel emoji="📈" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Daily"
          component={DailyScreen}
          options={{
            tabBarLabel: 'Daily',
            tabBarIcon: ({ focused }) => (
              <TabIconLabel emoji="🎮" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Simulator"
          component={SimulatorScreen}
          options={{
            tabBarLabel: 'Simulator',
            tabBarIcon: ({ focused }) => (
              <TabIconLabel emoji="🎛️" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Snapshot"
          component={SnapshotScreen}
          options={{
            tabBarLabel: 'Snapshot',
            tabBarIcon: ({ focused }) => (
              <TabIconLabel emoji="📊" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Learn"
          component={LearnScreen}
          options={{
            tabBarLabel: 'Learn',
            tabBarIcon: ({ focused }) => (
              <TabIconLabel emoji="📖" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: ThemeColors.frostedPanelDark,
    borderTopColor: ThemeColors.borderLight,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.sm,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
  },
  tabIconWrapperActive: {
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 22,
  },
});
