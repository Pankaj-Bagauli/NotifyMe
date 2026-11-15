import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import Settings from '../native/Settings';

const NotificationAccessContext = createContext(null);

export const NotificationAccessProvider = ({ children }) => {
  const [hasAccess, setHasAccess] = useState(true);
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  const initialCheckDone = useRef(false);

  const checkPermission = useCallback(async () => {
    try {
      const enabled = await Settings.isNotificationAccessEnabled();

      setHasAccess(enabled);

      if (!initialCheckDone.current) {
        initialCheckDone.current = true;
        setShowPermissionPopup(!enabled);
      } else if (enabled) {
        setShowPermissionPopup(false);
      }

      setPermissionChecked(true);
      return enabled;
    } catch (error) {
      console.warn('Notification access check failed:', error);
      setPermissionChecked(true);
      return false;
    }
  }, []);

  useEffect(() => {
    checkPermission();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkPermission();
      }
    });

    return () => subscription.remove();
  }, [checkPermission]);

  const dismissPermissionPopup = () => {
    setShowPermissionPopup(false);
  };

  const openNotificationSettings = async () => {
    try {
      await Settings.openNotificationSettings();
    } catch (error) {
      console.warn('Unable to open notification settings:', error);
    }
  };

  return (
    <NotificationAccessContext.Provider
      value={{
        hasAccess,
        showPermissionPopup,
        permissionChecked,
        dismissPermissionPopup,
        openNotificationSettings,
        checkPermission,
      }}
    >
      {children}
    </NotificationAccessContext.Provider>
  );
};

export const useNotificationAccess = () => {
  const context = useContext(NotificationAccessContext);

  if (!context) {
    throw new Error(
      'useNotificationAccess must be used inside NotificationAccessProvider',
    );
  }

  return context;
};
