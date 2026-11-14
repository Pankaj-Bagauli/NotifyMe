import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import colors from '../theme/colors';
import { MoveDownLeft } from 'lucide-react-native';

const PaymentHistoryItem = ({ item }) => {
  const formattedTime = new Date(item.receivedAt)
    .toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();

  const amount = item.amountPaise / 100;

  const formattedAmount = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MoveDownLeft size={20} color={colors.success} strokeWidth={2} />
      </View>

      <View style={styles.details}>
        <Text style={styles.message} numberOfLines={2}>
          {item.sender || 'Unknown'}
        </Text>

        <Text style={styles.time}>{formattedTime}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>+ ₹{formattedAmount}</Text>

        <Text style={styles.received}>Received</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 5,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800',
  },
  received: {
    color: colors.success,
    fontSize: 10,
    marginTop: 4,
  },
});

export default PaymentHistoryItem;
