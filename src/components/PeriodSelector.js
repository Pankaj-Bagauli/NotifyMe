import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import colors from '../theme/colors';

import {
  Calendar1,
  CalendarDays,
  Calendars,
  SquareLetterY,
} from 'lucide-react-native';

const periods = [
  { id: 'today', label: 'Today', icon: Calendar1 },
  { id: 'week', label: 'Week', icon: CalendarDays },
  { id: 'month', label: 'Month', icon: Calendars },
  { id: 'year', label: 'Year', icon: SquareLetterY },
];

const PeriodSelector = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      {periods.map(item => {
        const active = selected === item.id;

        // Dynamic icon component
        const Icon = item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, active && styles.activeItem]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
          >
            <Icon
              size={22}
              color={active ? colors.primary : colors.icon}
              strokeWidth={2}
            />

            <Text style={[styles.label, active && styles.activeText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    marginHorizontal: 2,
    gap: 6,
  },
  activeItem: {
    backgroundColor: colors.primaryLight,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default PeriodSelector;
