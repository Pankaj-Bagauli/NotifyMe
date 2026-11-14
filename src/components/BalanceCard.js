import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import colors from '../theme/colors';
import PeriodSelector from './PeriodSelector';

const BalanceCard = ({ amount, selectedPeriod, onPeriodChange }) => {
  const formattedAmount = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Total received</Text>

      <Text style={styles.amount}>₹ {formattedAmount}</Text>

      <Text style={styles.description}>Your received payments</Text>

      <View style={styles.divider} />

      <PeriodSelector selected={selectedPeriod} onSelect={onPeriodChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 22,
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  amount: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 7,
  },
  description: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 20,
  },
});

export default BalanceCard;
