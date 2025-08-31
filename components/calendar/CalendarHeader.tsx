import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getMonthName } from '@/utils/calendarUtils';

interface CalendarHeaderProps {
  currentMonth: number;
  currentYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onClose: () => void;
  showCloseButton?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  currentYear,
  onPreviousMonth,
  onNextMonth,
  onClose,
  showCloseButton = true,
}) => {
  const { theme } = useTheme();
  
  const monthName = getMonthName(currentMonth, 'long');
  
  return (
    <View 
      style={[styles.header, { borderBottomColor: theme.colors.border }]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`Calendar header for ${monthName} ${currentYear}`}
    >
      <View style={styles.headerContent}>
        {/* Navigation Controls */}
        <View style={styles.navigationControls}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={onPreviousMonth}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={`Previous month, ${getPreviousMonthName(currentMonth, currentYear)}`}
            accessibilityRole="button"
          >
            <ChevronLeft size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <View 
            style={styles.monthYearDisplay}
            accessible={true}
            accessibilityLabel={`Current view: ${monthName} ${currentYear}`}
          >
            <Text style={[styles.monthText, { color: theme.colors.text.primary }]}>
              {monthName}
            </Text>
            <Text style={[styles.yearText, { color: theme.colors.text.secondary }]}>
              {currentYear}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={onNextMonth}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={`Next month, ${getNextMonthName(currentMonth, currentYear)}`}
            accessibilityRole="button"
          >
            <ChevronRight size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Close Button */}
        {showCloseButton && (
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={onClose}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Close calendar"
            accessibilityRole="button"
          >
            <X size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Helper functions to get previous and next month names for accessibility
const getPreviousMonthName = (month: number, year: number): string => {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return `${getMonthName(prevMonth)} ${prevYear}`;
};

const getNextMonthName = (month: number, year: number): string => {
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  return `${getMonthName(nextMonth)} ${nextYear}`;
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default CalendarHeader;