import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Shadows } from '@/styles/theme';

export default function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  
  // Slide animation values (-100 to slide off-screen top, 0 to lock)
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      // Explicitly check for false, ignore booting null states
      const offline = state.isConnected === false;
      setIsOffline(offline);

      Animated.timing(slideAnim, {
        toValue: offline ? insets.top : -100,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
  }, [insets.top]);

  if (Platform.OS === 'web' || !isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.bannerText}>
        ⚡️ Offline Mode — Local MMKV Compounding Enabled
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 165, 0, 0.95)',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...Shadows.glow,
    shadowColor: '#FFA500',
    shadowOpacity: 0.3,
  },
  bannerText: {
    color: '#0B0C10',
    fontSize: Typography.size.small,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
