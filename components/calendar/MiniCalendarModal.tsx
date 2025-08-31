import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  getCurrentDateInfo, 
  getPreviousMonth, 
  getNextMonth,
  CalendarEventData 
} from '@/utils/calendarUtils';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarGrid from '@/components/calendar/CalendarGrid';

const { width, height } = Dimensions.get('window');

interface MiniCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  eventData?: CalendarEventData[];
  position?: { x: number; y: number };
}

const MiniCalendarModal: React.FC<MiniCalendarModalProps> = ({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  eventData = [],
  position,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Calendar state
  const currentDateInfo = getCurrentDateInfo();
  const [currentMonth, setCurrentMonth] = useState(currentDateInfo.month);
  const [currentYear, setCurrentYear] = useState(currentDateInfo.year);
  
  // Animation effects
  useEffect(() => {
    let fadeAnimation: Animated.CompositeAnimation;
    let scaleAnimation: Animated.CompositeAnimation;
    
    if (visible) {
      fadeAnimation = Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      });
      
      scaleAnimation = Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      });
      
      Animated.parallel([fadeAnimation, scaleAnimation]).start();
    } else {
      fadeAnimation = Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      });
      
      scaleAnimation = Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      });
      
      Animated.parallel([fadeAnimation, scaleAnimation]).start();
    }
    
    // Cleanup animations when component unmounts
    return () => {
      fadeAnimation?.stop();
      scaleAnimation?.stop();
    };
  }, [visible, fadeAnim, scaleAnim]);
  
  const handlePreviousMonth = () => {
    const { month, year } = getPreviousMonth(currentMonth, currentYear);
    setCurrentMonth(month);
    setCurrentYear(year);
  };
  
  const handleNextMonth = () => {
    const { month, year } = getNextMonth(currentMonth, currentYear);
    setCurrentMonth(month);
    setCurrentYear(year);
  };
  
  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    // Optionally close modal after selection
    // onClose();
  };
  
  const handleBackdropPress = () => {
    onClose();
  };
  
  const getModalStyle = () => {
    const isMobile = width < 768;
    
    if (isMobile) {
      // Mobile: Center modal
      return {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      };
    } else {
      // Desktop/Tablet: Position near calendar button if position provided
      if (position) {
        const modalWidth = 320;
        const modalHeight = 400;
        
        let left = position.x - modalWidth / 2;
        let top = position.y + 10;
        
        // Ensure modal stays within screen bounds
        if (left < 20) left = 20;
        if (left + modalWidth > width - 20) left = width - modalWidth - 20;
        if (top + modalHeight > height - 20) top = position.y - modalHeight - 10;
        if (top < 20) top = 20;
        
        return {
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          paddingTop: top,
          paddingLeft: left,
        };
      }
      
      // Fallback to center
      return {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      };
    }
  };
  
  const getCalendarContainerStyle = () => {
    const isMobile = width < 768;
    
    return [
      styles.calendarContainer,
      {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.shadow,
        width: isMobile ? '100%' : 320,
        maxWidth: isMobile ? 400 : 320,
      }
    ];
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[styles.modalOverlay, getModalStyle()]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                getCalendarContainerStyle(),
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              {/* Calendar Header */}
              <CalendarHeader
                currentMonth={currentMonth}
                currentYear={currentYear}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                onClose={onClose}
                showCloseButton={true}
              />
              
              {/* Calendar Grid */}
              <View style={styles.calendarContent}>
                <CalendarGrid
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  selectedDate={selectedDate}
                  eventData={eventData}
                  onDateSelect={handleDateSelect}
                />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  calendarContent: {
    padding: 16,
  },
});

export default MiniCalendarModal;