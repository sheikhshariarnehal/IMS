import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FloatingActionMenu from '../FloatingActionMenu';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the theme context
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('FloatingActionMenu', () => {
  const mockOnMenuItemPress = jest.fn();

  beforeEach(() => {
    mockOnMenuItemPress.mockClear();
  });

  const renderComponent = () => {
    return render(
      <MockThemeProvider>
        <FloatingActionMenu onMenuItemPress={mockOnMenuItemPress} />
      </MockThemeProvider>
    );
  };

  it('renders the center button correctly', () => {
    const { getByTestId } = renderComponent();
    const centerButton = getByTestId('floating-menu-center-button');
    expect(centerButton).toBeTruthy();
  });

  it('opens menu when center button is pressed', async () => {
    const { getByTestId, queryByTestId } = renderComponent();
    const centerButton = getByTestId('floating-menu-center-button');
    
    // Menu should be closed initially
    expect(queryByTestId('floating-menu-overlay')).toBeNull();
    
    // Press the button to open the menu
    fireEvent.press(centerButton);
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(queryByTestId('floating-menu-overlay')).not.toBeNull();
    });
  });

  it('closes menu when overlay is pressed', async () => {
    const { getByTestId, queryByTestId } = renderComponent();
    const centerButton = getByTestId('floating-menu-center-button');
    
    // Open the menu first
    fireEvent.press(centerButton);
    
    // Wait for menu to open
    await waitFor(() => {
      const overlay = getByTestId('floating-menu-overlay-touchable');
      expect(overlay).toBeTruthy();
      
      // Press overlay to close
      fireEvent.press(overlay);
    });
    
    // Check if menu closed
    await waitFor(() => {
      expect(queryByTestId('floating-menu-overlay')).toBeNull();
    });
  });

  it('calls onMenuItemPress when menu item is clicked', async () => {
    const { getByTestId, queryByTestId } = renderComponent();
    const centerButton = getByTestId('floating-menu-center-button');
    
    // Open the menu
    fireEvent.press(centerButton);
    
    // Wait for menu to open and press a menu item
    await waitFor(() => {
      // Try to find the products button (first menu item)
      const menuItem = getByTestId('floating-menu-button-touchable-products');
      fireEvent.press(menuItem);
    });
    
    // Check if callback was called
    expect(mockOnMenuItemPress).toHaveBeenCalledTimes(1);
    expect(mockOnMenuItemPress.mock.calls[0][0].id).toBe('products');
  });

  it('displays all 5 menu options when opened', async () => {
    const { getByTestId, queryAllByTestId } = renderComponent();
    const centerButton = getByTestId('floating-menu-center-button');
    
    // Open the menu
    fireEvent.press(centerButton);
    
    // Check if all 5 menu buttons are rendered
    await waitFor(() => {
      const menuButtons = queryAllByTestId(/floating-menu-button-[a-z]+$/);
      expect(menuButtons.length).toBe(5);
    });
  });
});