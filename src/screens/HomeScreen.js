import React, { useEffect, useCallback, useMemo, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  NativeEventEmitter,
  NativeModules,
  TouchableOpacity,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ghost, RefreshCw, BellRing } from 'lucide-react-native';

import colors from '../theme/colors';
import AppHeader from '../components/AppHeader';
import BalanceCard from '../components/BalanceCard';
import PaymentHistoryItem from '../components/PaymentHistoryItem';
import PaymentStorage from '../native/PaymentStorage';
import { useNotificationAccess } from '../context/NotificationAccessContext';

const getDateKey = timestamp => {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateHeading = timestamp => {
  const date = new Date(timestamp);
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dateKey = getDateKey(timestamp);

  if (dateKey === getDateKey(today.getTime())) {
    return 'Today';
  }

  if (dateKey === getDateKey(yesterday.getTime())) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
  });
};

const getPeriodStart = period => {
  const now = new Date();
  const start = new Date(now);

  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      return start.getTime();

    case 'week': {
      const day = start.getDay();
      const difference = day === 0 ? 6 : day - 1;

      start.setDate(start.getDate() - difference);
      return start.getTime();
    }

    case 'month':
      start.setDate(1);
      return start.getTime();

    case 'year':
      start.setMonth(0, 1);
      return start.getTime();

    default:
      return 0;
  }
};

const HomeScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { hasAccess, openNotificationSettings } = useNotificationAccess();

  const loadPayments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const records = await PaymentStorage.getPayments();
      setPayments(records);
    } catch (err) {
      console.error('Unable to load payment history:', err?.code || 'UNKNOWN');
      setError('Unable to load payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const paymentEvents = new NativeEventEmitter(NativeModules.PaymentEvents);

    const subscription = paymentEvents.addListener('PaymentSaved', () => {
      console.log('New payment received. Refreshing history...');
      loadPayments(true);
    });

    return () => {
      subscription.remove();
    };
  }, [loadPayments]);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments]),
  );

  const filteredPayments = useMemo(() => {
    const startTime = getPeriodStart(selectedPeriod);

    return payments
      .filter(item => item.receivedAt >= startTime)
      .sort((a, b) => b.receivedAt - a.receivedAt);
  }, [payments, selectedPeriod]);

  const groupedPayments = useMemo(() => {
    const groups = {};

    filteredPayments.forEach(item => {
      const dateKey = getDateKey(item.receivedAt);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([dateKey, groupPayments]) => ({
      dateKey,
      timestamp: groupPayments[0].receivedAt,
      payments: groupPayments,
    }));
  }, [filteredPayments]);

  const totalReceivedPaise = filteredPayments.reduce(
    (total, item) => total + item.amountPaise,
    0,
  );

  const totalReceived = totalReceivedPaise / 100;

  const handleRefresh = useCallback(async () => {
    try {
      if (NativeModules.PaymentEvents?.refreshActiveNotifications) {
        await NativeModules.PaymentEvents.refreshActiveNotifications();
      }
    } catch (err) {
      console.warn(
        'Active notification scan unavailable:',
        err?.code || 'UNKNOWN',
      );
    }

    await loadPayments(true);
  }, [loadPayments]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <AppHeader
          onSettingsPress={() => navigation.navigate('Settings')}
          onRefreshPress={handleRefresh}
          refreshing={refreshing}
        />

        {!hasAccess && (
          <View style={styles.permissionBanner}>
            <BellRing size={15} color="#D97706" strokeWidth={2} />

            <Text style={styles.permissionText}>
              Notification access is disabled.
            </Text>

            <TouchableOpacity
              onPress={openNotificationSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.permissionLink}>Allow access</Text>
            </TouchableOpacity>
          </View>
        )}

        <BalanceCard
          amount={totalReceived}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Payment History</Text>

          <Text style={styles.historyCount}>
            {filteredPayments.length} payments
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading payments...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error}</Text>

            <Text style={styles.retryText} onPress={() => loadPayments(true)}>
              <RefreshCw size={13} /> Retry
            </Text>
          </View>
        ) : groupedPayments.length > 0 ? (
          groupedPayments.map(group => (
            <View key={group.dateKey} style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateTitle}>
                  {getDateHeading(group.timestamp)}
                </Text>

                <Text style={styles.dateSubtitle}>
                  {new Date(group.timestamp).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.historyCard}>
                {group.payments.map(item => (
                  <PaymentHistoryItem key={item.id} item={item} />
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ghost size={38} color={colors.textMuted} strokeWidth={1.5} />

            <Text style={styles.emptyTitle}>No payments yet</Text>

            <Text style={styles.emptySubtitle}>
              Received payments will appear here.
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          NotifyMe • Your personal payment assistant
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginVertical: 10,
    gap: 7,
  },
  permissionText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  permissionLink: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  historyCount: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  dateSection: {
    marginBottom: 22,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 3,
  },
  dateTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  dateSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 40,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 10,
  },
});

export default HomeScreen;
