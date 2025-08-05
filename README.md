# Appointment App - Login System

A React Native Expo app with a simple login system and Redux integration, following SOLID principles.

## Features

- ✅ Mock authentication system
- ✅ Beautiful login and home screens
- ✅ Redux Toolkit + Redux Saga integration
- ✅ AsyncStorage for token persistence
- ✅ SOLID principles implementation
- ✅ Snake case file naming convention
- ✅ TypeScript to JavaScript conversion
- ✅ Ready for production integration

## Project Structure

```
src/app/
├── components/          # Reusable UI components
├── constants/          # App constants and configurations
├── helpers/           # Utility helper functions
├── navigations/       # Navigation setup
├── screens/           # App screens
│   ├── login_screen.js
│   ├── home_screen.js
│   ├── login_screen_redux.js
│   └── home_screen_redux.js
├── services/          # Business logic services
│   ├── auth_service.js
│   └── storage_service.js
├── state/             # Redux state management
│   ├── hooks/
│   │   └── use_auth.js
│   ├── stores/
│   │   ├── auth/
│   │   │   ├── actions.js
│   │   │   ├── reducers.js
│   │   │   ├── sagas.js
│   │   │   ├── selectors.js
│   │   │   └── index.js
│   │   ├── root_reducer.js
│   │   ├── root_saga.js
│   │   └── store.js
│   └── reducers/
└── utils/             # Utility functions
```

## Demo Credentials

- **Email:** `user@example.com`
- **Password:** `password123`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Usage

### Current Implementation (Non-Redux)

The app currently uses the non-Redux version by default. To switch to Redux:

1. Update `App.tsx` to import `AppRedux`:
```javascript
import AppRedux from './App_redux';
export default AppRedux;
```

### Redux Integration

The Redux setup is ready and includes:

- **Actions:** Login, logout, and auth checking
- **Reducers:** State management for authentication
- **Sagas:** Side effects handling (API calls, storage)
- **Selectors:** State access patterns
- **Custom Hooks:** `useAuth()` for easy state access

#### Redux Files:
- `src/app/state/stores/auth/` - Authentication store
- `src/app/state/hooks/use_auth.js` - Custom hook
- `src/app/screens/*_redux.js` - Redux-enabled screens

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- `AuthService` - Handles only authentication logic
- `StorageService` - Handles only storage operations
- Each reducer handles only its specific domain

### Open/Closed Principle (OCP)
- Redux actions and reducers are extensible without modification
- Service classes can be extended without changing existing code

### Liskov Substitution Principle (LSP)
- All services implement consistent interfaces
- Redux selectors can be substituted without breaking functionality

### Interface Segregation Principle (ISP)
- Custom hooks provide only necessary methods
- Actions are grouped by functionality

### Dependency Inversion Principle (DIP)
- Components depend on abstractions (hooks, services)
- High-level modules don't depend on low-level modules

## File Naming Convention

All files use snake_case naming:
- `login_screen.js`
- `auth_service.js`
- `storage_service.js`
- `use_auth.js`

## Mock Authentication

The app includes a mock authentication system with:
- Simulated API delays
- Token generation
- User data persistence
- Error handling

## Storage

Uses AsyncStorage for:
- Authentication tokens
- User data
- Session persistence

## Navigation

- Stack navigation for authentication flow
- Automatic redirects based on auth state
- Loading states during authentication checks

## Error Handling

- Form validation
- API error handling
- User-friendly error messages
- Graceful fallbacks

## Future Enhancements

1. **Real API Integration:**
   - Replace mock service with real API calls
   - Add proper error handling
   - Implement refresh tokens

2. **Additional Features:**
   - User registration
   - Password reset
   - Profile management
   - Appointment scheduling

3. **Security:**
   - Biometric authentication
   - Token encryption
   - Secure storage

4. **Testing:**
   - Unit tests for services
   - Integration tests for Redux
   - E2E tests for user flows

## Dependencies

- React Native
- Expo
- React Navigation
- Redux Toolkit
- Redux Saga
- AsyncStorage

## Contributing

1. Follow SOLID principles
2. Use snake_case for file naming
3. Write clean, readable code
4. Add proper error handling
5. Test your changes

## License

MIT License 