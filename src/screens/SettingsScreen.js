import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '../theme/colors';

const SettingsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.icon}>⚙</Text>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.description}>
          Voice, language, permissions and privacy settings will be available
          here.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
  },
  title: {
    fontSize: 23,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  icon: {
    fontSize: 45,
    color: colors.primary,
  },
  heading: {
    fontSize: 21,
    color: colors.textPrimary,
    fontWeight: '800',
    marginTop: 15,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default SettingsScreen;
