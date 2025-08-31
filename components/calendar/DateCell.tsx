import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CalendarDate, CalendarEventData, getEventColor } from '@/utils/calendarUtils';
import EventTooltip from '@/components/calendar/EventTooltip';

interface DateCellProps {
  calendarDate: CalendarDate;
  onPress: (date: Date) => void;
  size?: number;
}

const DateCell: React.FC<DateCellProps> = ({ 
  calendarDate, 
  onPress, 
  size = 44 
}) => {
  const { theme } = useTheme();
  const { date, day, isCurrentMonth, isToday, isSelected, events } = calendarDate;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handlePress = () => {
    onPress(date);
  };

  const handleLongPress = (event: any) => {
    if (events.length > 0) {
      // Get the position of the touch event
      const { pageX, pageY } = event.nativeEvent;
      setTooltipPosition({ x: pageX, y: pageY });
      setShowTooltip(true);
    }
  };

  const handleTooltipClose = () => {
    setShowTooltip(false);
  };

  const getDateCellStyle = () => {
    const baseStyle: ViewStyle = {
      width: size,
      height: size,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 1,
      position: 'relative',
      backgroundColor: theme.colors.card,
    };

    if (isSelected) {
      baseStyle.backgroundColor = theme.colors.primary;
    } else if (isToday) {
      baseStyle.borderColor = theme.colors.primary;
      baseStyle.borderWidth = 2;
    }

    if (!isCurrentMonth) {
      baseStyle.opacity = 0.3;
    }

    return baseStyle;
  };

  const getDateTextStyle = () => {
    const baseStyle: TextStyle = {
      textAlign: 'center',
      fontWeight: '500',
      color: theme.colors.text.primary,
      fontSize: size * 0.32, // Responsive font size
    };

    if (isSelected) {
      baseStyle.color = theme.colors.text.inverse;
      baseStyle.fontWeight = '600';
    } else if (isToday) {
      baseStyle.color = theme.colors.primary;
      baseStyle.fontWeight = '600';
    }

    if (!isCurrentMonth) {
      baseStyle.color = theme.colors.text.muted;
    }

    return baseStyle;
  };

  const renderEventIndicators = () => {
    if (events.length === 0) return null;

    // Show up to 3 event indicators
    const visibleEvents = events.slice(0, 3);
    const hasMoreEvents = events.length > 3;

    return (
      <View style={styles.eventIndicators}>
        <View style={styles.eventDots}>
          {visibleEvents.map((event, index) => (
            <View
              key={index}
              style={[
                styles.eventDot,
                {
                  backgroundColor: event.color || getEventColor(event.type),
                  width: size * 0.12,
                  height: size * 0.12,
                }
              ]}
            />
          ))}
          {hasMoreEvents && (
            <View
              style={[
                styles.eventDot,
                styles.moreEventsDot,
                {
                  backgroundColor: theme.colors.text.muted,
                  width: size * 0.12,
                  height: size * 0.12,
                }
              ]}
            />
          )}
        </View>
        {events.length > 1 && (
          <Text style={[
            styles.eventCount,
            {
              color: theme.colors.text.muted,
              fontSize: size * 0.18,
            }
          ]}>
            {events.length}
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={getDateCellStyle()}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${date.toLocaleDateString()}, ${events.length} events`}
        accessibilityRole="button"
        accessibilityState={{
          selected: isSelected,
        }}
      >
        <View style={styles.dateContent}>
          <Text style={getDateTextStyle()}>
            {day}
          </Text>
          {renderEventIndicators()}
        </View>
      </TouchableOpacity>

      <EventTooltip
        visible={showTooltip}
        events={events}
        date={date}
        position={tooltipPosition}
        onClose={handleTooltipClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  dateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  eventIndicators: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
    width: '100%',
  },
  eventDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginBottom: 1,
  },
  eventDot: {
    borderRadius: 50,
  },
  moreEventsDot: {
    opacity: 0.6,
  },
  eventCount: {
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DateCell;