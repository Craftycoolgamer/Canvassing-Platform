# Canvassing Platform - Business Map Tracker

A cross-platform React Native (Expo) application for business canvassing and outreach management. Track businesses on an interactive map, manage company data, and organize your canvassing efforts efficiently.

## 🌟 Features

### 📍 Interactive Map
- **Cross-platform map support**: React Native Maps for mobile, React Leaflet for web
- **Colored pins by status**: Green (open), Red (closed), Orange (pending)
- **Smooth animations**: Fly-to animations when navigating to pins
- **Add new businesses**: Long-press (mobile) or click (web) to add pins
- **Pin details**: View comprehensive business information

### 🏢 Business Management
- **Complete business profiles**: Name, status, address, contact info, notes
- **Status tracking**: Open, Closed, Pending with color coding
- **Contact information**: Name, phone, email, last contacted date
- **Canvassing details**: Who canvassed, visit outcomes, tags
- **Edit & delete**: Full CRUD operations for business data

### 🏭 Company Organization
- **Multi-company support**: Manage multiple companies in one app
- **Company switching**: Easy toggle between different companies
- **Company management**: Add, delete, and organize companies
- **Data isolation**: Businesses are organized by company

### 📱 Cross-Platform
- **Mobile**: iOS and Android with native map integration
- **Web**: Full-featured web version with responsive design
- **Consistent UI**: Same functionality across all platforms

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For mobile development: Expo Go app or Android/iOS simulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Craftycoolgamer/Canvassing-Platform.git
   cd Canvassing-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your preferred platform**
   - **Web**: Press `w` or visit `http://localhost:8081`
   - **Android**: Press `a` (requires Android Studio/emulator or Expo Go)
   - **iOS**: Press `i` (requires Xcode/simulator or Expo Go)

## 📖 Usage Guide

### Getting Started
1. **Select a Company**: Use the Settings tab to manage companies
2. **Add Businesses**: Click on the map to add new business pins
3. **View Details**: Tap pins to see business information
4. **Edit Data**: Use the Business List to edit business details
5. **Track Progress**: Update status and add notes as you canvass

### Map Navigation
- **View Business**: Click "View" in Business List to center map on that business
- **Add Pin**: Long-press (mobile) or click (web) on map to add new business
- **Pin Details**: Tap any pin to view/edit business information
- **Smooth Animation**: Map automatically animates to new locations

### Business Management
- **Edit**: Click "Edit" to modify business details
- **Delete**: Remove businesses with confirmation dialog
- **Status Updates**: Change business status (Open/Closed/Pending)
- **Contact Info**: Store contact names, phones, emails
- **Notes**: Add detailed notes about each business

### Company Settings
- **Add Company**: Create new companies for different campaigns
- **Switch Company**: Toggle between companies to view their businesses
- **Delete Company**: Remove empty companies (only if no businesses exist)

## 🛠️ Technical Details

### Architecture
- **Frontend**: React Native with Expo
- **State Management**: React Context API
- **Navigation**: React Navigation (Bottom Tabs)
- **Maps**: 
  - Mobile: `react-native-maps`
  - Web: `react-leaflet` with OpenStreetMap
- **Icons**: Expo Vector Icons (Ionicons)

### Project Structure
```
map-business-tracker/
├── components/
│   ├── MapView.native.js    # Mobile map component
│   └── MapView.web.js       # Web map component
├── context/
│   └── AppContext.js        # Global state management
├── screens/
│   ├── MapScreen.js         # Main map interface
│   ├── BusinessListScreen.js # Business management
│   └── SettingsScreen.js    # Company settings
├── constants/
│   └── StatusColors.js      # Status color definitions
├── assets/                  # App icons and images
├── App.js                   # Main app component
└── index.js                 # App entry point
```

### Key Features Implementation
- **Cross-platform maps**: Platform-specific components with shared interface
- **Smooth animations**: Fly-to animations using native map APIs
- **Real-time updates**: Context-based state management
- **Responsive design**: Adapts to different screen sizes
- **Data persistence**: Local state management (can be extended with backend)

## 🌐 Deployment

### Web Deployment (GitHub Pages)

1. **Build the web version**
   ```bash
   npx expo export:web
   ```

2. **Deploy to GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "Deploy from a branch"
   - Choose `gh-pages` branch and `/` folder
   - Click "Save"

3. **Set up GitHub Actions** (Optional)
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v2
       - uses: actions/setup-node@v2
         with:
           node-version: '18'
       - run: npm install
       - run: npx expo export:web
       - uses: peaceiris/actions-gh-pages@v3
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./web-build
   ```

### Mobile Deployment

1. **Build for production**
   ```bash
   # For Android
   npx expo build:android
   
   # For iOS
   npx expo build:ios
   ```

2. **Submit to app stores**
   - Follow Expo's deployment guide
   - Submit to Google Play Store and Apple App Store

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configurations:
```env
EXPO_PUBLIC_MAP_API_KEY=your_map_api_key
EXPO_PUBLIC_DEFAULT_LAT=37.78825
EXPO_PUBLIC_DEFAULT_LNG=-122.4324
```

### Customization
- **Map styling**: Modify map components in `components/`
- **Status colors**: Update `constants/StatusColors.js`
- **Default data**: Edit initial data in `context/AppContext.js`
- **UI styling**: Customize styles throughout the app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the code comments for implementation details
- **Community**: Join the Expo community for React Native help

## 🚀 Roadmap

- [ ] Backend integration for data persistence
- [ ] Offline support with local storage
- [ ] Export/import functionality
- [ ] Advanced filtering and search
- [ ] Route optimization for canvassing
- [ ] Analytics and reporting
- [ ] Team collaboration features
- [ ] Push notifications for follow-ups

---

**Built with ❤️ using React Native and Expo** 