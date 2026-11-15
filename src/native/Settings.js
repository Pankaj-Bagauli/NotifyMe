import { NativeModules } from 'react-native';

const { NotifyMeSettings } = NativeModules;

const Settings = {
  getVoiceEnabled: async () => {
    if (!NotifyMeSettings) {
      throw new Error('NotifyMeSettings native module is not available.');
    }

    return NotifyMeSettings.getVoiceEnabled();
  },

  setVoiceEnabled: async enabled => {
    if (!NotifyMeSettings) {
      throw new Error('NotifyMeSettings native module is not available.');
    }

    return NotifyMeSettings.setVoiceEnabled(enabled);
  },

  isNotificationAccessEnabled: async () => {
    if (!NotifyMeSettings) {
      throw new Error('NotifyMeSettings native module is not available.');
    }

    return NotifyMeSettings.isNotificationAccessEnabled();
  },

  openNotificationSettings: async () => {
    if (!NotifyMeSettings) {
      throw new Error('NotifyMeSettings native module is not available.');
    }

    return NotifyMeSettings.openNotificationSettings();
  },

  testVoice: async () => {
    if (!NotifyMeSettings) {
      throw new Error('NotifyMeSettings native module is not available.');
    }

    return NotifyMeSettings.testVoice();
  },
};

export default Settings;
