# Serrano Tex - Inventory Management System (UI Demo)

A clean, modern React Native inventory management system focused purely on UI/UX design and frontend functionality.

## 🎯 Overview

This is a **UI-only demo version** of an inventory management system built with React Native and Expo. All database functionality has been removed to create a lightweight, frontend-focused application perfect for:

- UI/UX demonstrations
- Frontend development
- Design system showcasing
- Mobile app prototyping

## ✨ Features

### 🔐 Authentication System
- Role-based login with demo credentials
- Four user roles: Super Admin, Admin, Sales Manager, Investor
- Permission-based UI components
- Local session management

### 📱 Core Modules
- **Dashboard**: Analytics and KPI overview
- **Products**: Product catalog management
- **Inventory**: Stock tracking and location management
- **Sales**: Sales transactions and invoicing
- **Customers**: Customer relationship management
- **Suppliers**: Supplier management
- **Samples**: Sample tracking system
- **Reports**: Business analytics and reporting
- **Notifications**: Alert and notification center
- **Settings**: User and system configuration

### 🎨 Design System
- **Dual Theme**: Light and dark mode support
- **Responsive Design**: Mobile-first with tablet support
- **Modern UI**: Clean, professional interface
- **Consistent Icons**: Lucide React Native icon set
- **Color System**: Comprehensive color palette
- **Typography**: Consistent text styling

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd project

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Demo Credentials

Use these credentials to test different user roles:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Super Admin | admin@serranotex.com | Admin123! | Full system access |
| Sales Manager | sales@serranotex.com | Sales123! | Sales and customer management |
| Investor | investor@serranotex.com | Investor123! | Read-only dashboard access |

## 📁 Project Structure

```
project/
├── app/                    # Screen components (Expo Router)
├── components/             # Reusable UI components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── constants/             # App constants and themes
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── assets/               # Images and static assets
```

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Language**: TypeScript
- **State Management**: React Context API
- **Storage**: AsyncStorage (local only)
- **Icons**: Lucide React Native
- **Charts**: react-native-pie-chart
- **Styling**: StyleSheet with dynamic theming

## 🎨 Theme System

The app includes a comprehensive theme system with:

- Light and dark mode support
- Consistent color palette
- Responsive spacing system
- Typography scales
- Component-specific styling

## 📱 Responsive Design

- Mobile-first approach
- Tablet-optimized layouts
- Adaptive navigation
- Touch-friendly interactions

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build:web    # Build for web
npm run lint         # Run ESLint
```

### Adding New Features

1. Create new screen in `app/` directory
2. Add reusable components in `components/`
3. Update navigation in `app/_layout.tsx`
4. Add types in `types/` directory
5. Update theme if needed in `constants/theme-colors.ts`

## 📝 Notes

- This is a **UI-only demo** with no backend connectivity
- All data is mocked for demonstration purposes
- Perfect for frontend development and design showcasing
- Can be easily extended with real backend integration

## 🤝 Contributing

This is a demo project focused on UI/UX. Contributions for improving the design system, adding new UI components, or enhancing the user experience are welcome.

## 📄 License

This project is for demonstration purposes.