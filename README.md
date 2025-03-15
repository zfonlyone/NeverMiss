# NeverMiss

NeverMiss is a task management app that helps you never miss important deadlines. It features recurring tasks, customizable reminders, and a clean, intuitive interface.

## Features

- Create and manage recurring tasks with flexible patterns
  - Daily, weekly, monthly, or custom intervals
  - Set custom start and due dates
  - Automatic cycle creation for recurring tasks
- Smart reminders and notifications
  - Customizable reminder times before deadlines
  - Background task monitoring
  - Overdue task detection
- Modern and intuitive UI
  - Dark mode support
  - Clean, minimalist design
  - Smooth animations and transitions
- Offline-first architecture
  - SQLite local database
  - No internet connection required
  - Fast and reliable data access

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later) or yarn (v1.22 or later)
- Expo CLI (`npm install -g expo-cli`)
- For Android development:
  - Android Studio
  - Android SDK (API Level 33 or higher)
  - Java Development Kit (JDK)
- For iOS development:
  - Xcode (Mac only)
  - iOS Simulator or physical device

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nevermiss.git
cd nevermiss
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on your device:
- For Android:
  ```bash
  npm run android
  # or
  yarn android
  ```
- For iOS:
  ```bash
  npm run ios
  # or
  yarn ios
  ```

### Development Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start the app on Android
- `npm run ios` - Start the app on iOS
- `npm run web` - Start the app in a web browser
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clear cache and restart the development server

## Project Structure

```
nevermiss/
├── app/                    # App routes and navigation
│   ├── _layout.tsx        # Root layout with navigation setup
│   └── index.tsx          # Home screen
├── assets/                 # Static assets (images, fonts)
├── components/            # Reusable React components
│   ├── TaskList.tsx      # Task list component
│   ├── TaskForm.tsx      # Task creation/editing form
│   └── TaskDetail.tsx    # Task details view
├── models/                # TypeScript interfaces and types
│   └── Task.ts          # Task and cycle type definitions
├── services/             # Business logic and database services
│   ├── database.ts      # SQLite database setup and management
│   ├── taskService.ts   # Task CRUD operations
│   └── notificationService.ts # Push notification handling
└── types/                # Type declarations
```

## Tech Stack

- [React Native](https://reactnative.dev/) - Mobile app framework
- [Expo](https://expo.dev/) - Development platform
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [SQLite](https://www.sqlite.org/) (via expo-sqlite) - Local database
- [date-fns](https://date-fns.org/) - Date manipulation
- [React Navigation](https://reactnavigation.org/) - Navigation
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) for the mobile framework
- [SQLite](https://www.sqlite.org/) for the reliable database engine
- [date-fns](https://date-fns.org/) for date manipulation utilities
- [React Navigation](https://reactnavigation.org/) for navigation solutions 
