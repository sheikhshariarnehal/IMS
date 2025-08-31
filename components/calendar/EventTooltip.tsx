import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CalendarEventData, getEventColor, formatDate } from '@/utils/calendarUtils';

interface EventTooltipProps {
  visible: boolean;
  events: CalendarEventData[];
  date: Date;
  position: { x: number; y: number };
  onClose: () => void;
}

const EventTooltip: React.FC<EventTooltipProps> = ({
  visible,
  events,
  date,
  position,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!visible || events.length === 0) return null;

  const renderEventItem = (event: CalendarEventData, index: number) => (
    <View key={index} style={styles.eventItem}>
      <View
        style={[
          styles.eventDot,
          {
            backgroundColor: event.color || getEventColor(event.type),
          }
        ]}
      />
      <View style={styles.eventDetails}>
        <Text style={[styles.eventTitle, { color: theme.colors.text.primary }]}>
          {event.title}
        </Text>
        <Text style={[styles.eventType, { color: theme.colors.text.secondary }]}>
          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          {event.count && ` (${event.count})`}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.tooltip,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                  left: Math.max(10, Math.min(position.x - 100, 300)),
                  top: position.y + 10,
                }
              ]}
            >
              <Text style={[styles.dateHeader, { color: theme.colors.text.primary }]}>
                {formatDate(date, 'long')}
              </Text>
              
              <View style={styles.eventsList}>
                {events.map(renderEventItem)}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    minWidth: 200,
    maxWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  eventsList: {
    gap: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventType: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default EventTooltip;