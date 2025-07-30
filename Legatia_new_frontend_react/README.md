# 🚀 Legatia React Frontend

Modern React frontend for the Legatia family genealogy platform built on the Internet Computer.

## ✨ Features

### 🎨 **Modern UI/UX**
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** design system
- **Responsive mobile-first** design
- **Glass morphism** and modern visual effects
- **Dark/light mode** support (coming soon)

### 🔐 **Authentication**
- **Internet Identity** integration
- **Protected routes** with authentication guards
- **Profile management** with secure storage
- **Session persistence** across browser tabs

### 👨‍👩‍👧‍👦 **Family Management**
- **Create and manage** family trees
- **Add family members** with detailed profiles
- **Family events** and timeline management
- **Privacy controls** (public/private families)
- **Family search** and discovery

### 📱 **Responsive Design**
- **Mobile-first** approach
- **Touch-friendly** interactions
- **Adaptive layouts** for all screen sizes
- **Progressive Web App** ready

## 🛠️ Tech Stack

### **Core**
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing

### **State Management**
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### **UI/UX**
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Notifications

### **ICP Integration**
- **@dfinity/agent** - ICP canister communication
- **@dfinity/auth-client** - Internet Identity
- **@dfinity/principal** - Principal management

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ and npm 7+
- DFX (DFINITY SDK)
- Running Legatia backend canister

### Installation

1. **Install dependencies**
   ```bash
   cd Legatia_new_frontend_react
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Copy from your dfx deployment
   export CANISTER_ID_LEGATIA_NEW_BACKEND="your-backend-canister-id"
   export DFX_NETWORK="local" # or "ic" for mainnet
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui base components
│   ├── auth/            # Authentication components
│   ├── family/          # Family-specific components
│   ├── profile/         # Profile components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── pages/               # Page components
├── services/            # ICP integration services
├── stores/              # Zustand state stores
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## 🔧 Key Components

### **Authentication Flow**
- `LoginPage` - Internet Identity login
- `ProtectedRoute` - Route protection
- `CreateProfilePage` - Initial profile setup

### **Family Management**
- `FamiliesPage` - Family overview dashboard
- `FamilyCard` - Family preview cards
- `CreateFamilyForm` - New family creation
- `FamilyDetail` - Detailed family tree view

### **State Management**
- `authStore` - Authentication state
- `familyStore` - Family data management
- `notificationStore` - Notifications handling

## 🎨 Design System

### **Colors**
- **Primary**: Emerald green (`#059669`)
- **Secondary**: Slate gray (`#64748b`)
- **Background**: Gradient from slate to emerald
- **Cards**: Glass morphism with backdrop blur

### **Typography**
- **Headings**: Bold, clear hierarchy
- **Body**: Readable font sizes and line heights
- **Code**: Monospace for technical content

### **Components**
- **Consistent** spacing and sizing
- **Accessible** color contrast
- **Smooth** animations and transitions
- **Touch-friendly** interaction targets

## 🔐 Security Features

### **Authentication**
- Internet Identity integration
- Secure session management
- Principal-based authorization
- Protected route guards

### **Data Protection**
- Type-safe API calls
- Input validation with Zod
- Error boundary protection
- Secure canister communication

## 📱 Mobile Optimization

### **Responsive Design**
- Mobile-first CSS approach
- Flexible grid layouts
- Touch-optimized interactions
- Adaptive navigation

### **Performance**
- Code splitting by routes
- Lazy loading components
- Optimized bundle sizes
- Fast initial page loads

## 🚀 Deployment

### **Local Development**
```bash
# Start local replica
dfx start --background

# Deploy canisters
dfx deploy

# Start React app
npm run dev
```

### **Production Build**
```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### **IC Mainnet**
```bash
# Set network to IC
export DFX_NETWORK=ic

# Deploy to mainnet
dfx deploy --network ic
```

## 🔄 Integration with Backend

### **Canister Communication**
- Automatic actor creation
- Type-safe method calls
- Error handling and retry logic
- Real-time data synchronization

### **State Synchronization**
- Zustand stores mirror canister state
- Optimistic updates for better UX
- Background data fetching
- Conflict resolution

## 🎯 Future Enhancements

### **Planned Features**
- **Real-time collaboration** on family trees
- **Advanced search** and filtering
- **Import/export** GEDCOM files
- **Media uploads** (photos, documents)
- **Family timeline** visualization
- **AI-powered** relationship suggestions

### **Technical Improvements**
- **PWA** capabilities
- **Offline mode** support
- **Push notifications**
- **Advanced caching**
- **Performance monitoring**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Legatia platform. See the main repository for license information.

---

**Built with ❤️ for preserving family histories on the Internet Computer**