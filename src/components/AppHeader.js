import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import colors from '../theme/colors';
import { Settings } from 'lucide-react-native';

const AppHeader = ({ onSettingsPress }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>NotifyMe</Text>
      </View>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onSettingsPress}
        activeOpacity={0.75}
      >
        <Settings />
      </TouchableOpacity>
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
  greeting: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  settingsButton: {
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
