import React, { useCallback, useState, useEffect } from 'react';
import {
  AppState,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import {
  ArrowLeft,
  Volume2,
  Languages,
  Play,
  ShieldCheck,
  Bell,
  ChevronRight,
  Info,
  LockKeyhole,
  Smartphone,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

import colors from '../theme/colors';
import Settings from '../native/Settings';

const SettingsScreen = ({ navigation }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationAccess, setNotificationAccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingVoice, setSavingVoice] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [openingSettings, setOpeningSettings] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [voiceStatus, accessStatus] = await Promise.all([
        Settings.getVoiceEnabled(),
        Settings.isNotificationAccessEnabled(),
      ]);

      setVoiceEnabled(voiceStatus);
      setNotificationAccess(accessStatus);
    } catch (error) {
      console.log('Settings loading error:', error);
      Alert.alert('Error', 'Unable to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadSettings();
      }
    });

    return () => subscription.remove();
  }, [loadSettings]);

  const handleVoiceToggle = async value => {
    if (savingVoice) return;

    setSavingVoice(true);

    try {
      await Settings.setVoiceEnabled(value);
      setVoiceEnabled(value);
    } catch (error) {
      console.log('Voice preference error:', error);

      Alert.alert(
        'Unable to update',
        'Voice preference could not be saved. Please try again.',
      );
    } finally {
      setSavingVoice(false);
    }
  };

  const handleTestVoice = async () => {
    if (testingVoice) return;

    setTestingVoice(true);

    try {
      await Settings.testVoice();
    } catch (error) {
      console.log('Test voice error:', error);

      Alert.alert(
        'Voice Test Failed',
        error?.message || 'Unable to play the Hindi test announcement.',
      );
    } finally {
      setTestingVoice(false);
    }
  };

  const handleNotificationSettings = async () => {
    if (openingSettings) return;

    setOpeningSettings(true);

    try {
      await Settings.openNotificationSettings();
    } catch (error) {
      console.log('Notification settings error:', error);

      Alert.alert(
        'Unable to open settings',
        'Please open Android Notification Access settings manually.',
      );
    } finally {
      setOpeningSettings(false);
    }
  };

  const SettingCard = ({ children, style }) => (
    <View style={[styles.card, style]}>{children}</View>
  );

  const SectionTitle = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const IconContainer = ({ children, backgroundColor }) => (
    <View
      style={[
        styles.iconContainer,
        { backgroundColor: backgroundColor || colors.primaryLight },
      ]}
    >
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle="dark-content"
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={21} color={colors.textPrimary} />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your app preferences</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Voice Settings */}
        <SectionTitle title="VOICE & ANNOUNCEMENTS" />

        <SettingCard>
          <View style={styles.settingRow}>
            <IconContainer>
              <Volume2 size={21} color={colors.primary} />
            </IconContainer>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Voice Announcements</Text>
              <Text style={styles.settingDescription}>
                Automatically announce received payments.
              </Text>
            </View>

            <Switch
              value={voiceEnabled}
              onValueChange={handleVoiceToggle}
              disabled={savingVoice}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          {savingVoice && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.inlineLoadingText}>Saving preference...</Text>
            </View>
          )}

          <View style={styles.cardDivider} />

          <View style={styles.settingRow}>
            <IconContainer>
              <Languages size={21} color={colors.primary} />
            </IconContainer>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Announcement Language</Text>
              <Text style={styles.settingDescription}>
                Language used for payment announcements.
              </Text>
            </View>

            <View style={styles.languageBadge}>
              <Text style={styles.languageText}>Hindi</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.testVoiceRow}>
            <View style={styles.testVoiceInfo}>
              <Text style={styles.settingTitle}>Test Voice</Text>
              <Text style={styles.settingDescription}>
                Play a sample Hindi announcement.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.testButton, testingVoice && styles.disabledButton]}
              onPress={handleTestVoice}
              disabled={testingVoice}
              activeOpacity={0.8}
            >
              {testingVoice ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              )}

              <Text style={styles.testButtonText}>
                {testingVoice ? 'Playing' : 'Test'}
              </Text>
            </TouchableOpacity>
          </View>
        </SettingCard>

        {/* Permissions */}
        <SectionTitle title="PERMISSIONS" />

        <SettingCard>
          <View style={styles.settingRow}>
            <IconContainer>
              <Bell size={21} color={colors.primary} />
            </IconContainer>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notification Access</Text>

              <Text style={styles.settingDescription}>
                Required to detect incoming Google Pay notifications.
              </Text>

              <View style={styles.permissionStatus}>
                {notificationAccess ? (
                  <>
                    <CheckCircle2 size={14} color={colors.success} />
                    <Text style={styles.enabledText}>Enabled</Text>
                  </>
                ) : (
                  <>
                    <XCircle size={14} color={colors.danger} />
                    <Text style={styles.disabledText}>Not enabled</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleNotificationSettings}
            disabled={openingSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>
              {openingSettings
                ? 'Opening Android settings...'
                : 'Manage Notification Access'}
            </Text>

            {openingSettings ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ChevronRight size={19} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </SettingCard>

        {/* Privacy */}
        <SectionTitle title="PRIVACY & SECURITY" />

        <SettingCard>
          <View style={styles.settingRow}>
            <IconContainer>
              <ShieldCheck size={21} color={colors.success} />
            </IconContainer>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Your Data Stays Private</Text>
              <Text style={styles.settingDescription}>
                Payment records are stored locally in encrypted app storage.
              </Text>
            </View>

            <LockKeyhole size={19} color={colors.success} />
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              NotifyMe uses notification access only to detect supported payment
              notifications. Your payment history is not uploaded to a NotifyMe
              cloud server.
            </Text>
          </View>
        </SettingCard>

        {/* About */}
        <SectionTitle title="ABOUT" />

        <SettingCard>
          <View style={styles.settingRow}>
            <IconContainer>
              <Smartphone size={21} color={colors.primary} />
            </IconContainer>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>NotifyMe</Text>
              <Text style={styles.settingDescription}>
                Personal payment notification assistant.
              </Text>
            </View>

            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v1.0</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.settingRow}>
            <IconContainer>
              <Info size={21} color={colors.primary} />
            </IconContainer>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Application</Text>
              <Text style={styles.settingDescription}>
                Built for private and convenient payment tracking.
              </Text>
            </View>
          </View>
        </SettingCard>

        <Text style={styles.footerText}>
          Made with care for your everyday payments.
        </Text>
        <View style={styles.brandContainer}>
          <View style={styles.brandLine} />

          <View style={styles.brandContent}>
            <Text style={styles.brandEyebrow}>POWERED BY</Text>
            <Text style={styles.brandTitle}>THE BUGAULI PRODUCT</Text>
            <Text style={styles.brandSubtitle}>INNOVATION WITH PURPOSE</Text>
          </View>

          <View style={styles.brandLine} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 10,
    paddingBottom: 22,
  },

  backButton: {
    height: 44,
    width: 44,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 23,
    color: colors.textPrimary,
    fontWeight: '800',
  },

  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  scrollContent: {
    paddingBottom: 35,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 11,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 19,
    borderWidth: 1,
    borderColor: colors.border,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },

  iconContainer: {
    height: 43,
    width: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  settingDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },

  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  languageBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },

  languageText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  testVoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    gap: 10,
  },

  testVoiceInfo: {
    flex: 1,
  },

  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 11,
    minWidth: 85,
  },

  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.65,
  },

  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },

  inlineLoadingText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  enabledText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },

  disabledText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },

  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },

  privacyNote: {
    paddingVertical: 13,
  },

  privacyText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },

  versionBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  versionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },

  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  brandLine: {
    width: 45,
    height: 3,
    borderRadius: 5,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },

  brandContent: {
    alignItems: 'center',
    marginVertical: 12,
  },

  brandEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  brandTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: colors.primary,
    textAlign: 'center',
  },

  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textSecondary,
    marginTop: 7,
  },
});

export default SettingsScreen;
