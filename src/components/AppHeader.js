import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

import colors from '../theme/colors';
import { Settings, RefreshCw } from 'lucide-react-native';

const AppHeader = ({ onSettingsPress, onRefreshPress, refreshing = false }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const animation = useRef(null);

  useEffect(() => {
    if (refreshing) {
      rotation.setValue(0);

      animation.current = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 850,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

      animation.current.start();
    } else {
      animation.current?.stop();
      rotation.stopAnimation();
      rotation.setValue(0);
    }

    return () => {
      animation.current?.stop();
    };
  }, [refreshing, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>NotifyMe</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRefreshPress}
          disabled={refreshing}
          activeOpacity={0.75}
          accessibilityLabel="Refresh payment history"
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <RefreshCw color={colors.primary} size={21} />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onSettingsPress}
          activeOpacity={0.75}
          accessibilityLabel="Settings"
        >
          <Settings color={colors.textPrimary} size={21} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});

export default AppHeader;
