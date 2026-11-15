import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { useNotificationAccess } from '../context/NotificationAccessContext';

const NotificationAccessPrompt = () => {
  const {
    showPermissionPopup,
    permissionChecked,
    dismissPermissionPopup,
    openNotificationSettings,
  } = useNotificationAccess();

  return (
    <Modal
      visible={permissionChecked && showPermissionPopup}
      transparent
      animationType="fade"
      onRequestClose={dismissPermissionPopup}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={dismissPermissionPopup}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Bell size={27} color="#2563EB" />
          </View>

          <Text style={styles.title}>Enable Notification Access</Text>

          <Text style={styles.description}>
            Allow NotifyMe to detect your payment notifications and keep your
            payment history updated.
          </Text>

          <TouchableOpacity
            style={styles.allowButton}
            activeOpacity={0.8}
            onPress={openNotificationSettings}
          >
            <Text style={styles.allowButtonText}>Allow Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={dismissPermissionPopup}
            activeOpacity={0.7}
          >
            <Text style={styles.laterButtonText}>I'll do it later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 5,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  allowButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  laterButton: {
    paddingVertical: 13,
  },
  laterButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NotificationAccessPrompt;
