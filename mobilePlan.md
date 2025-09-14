# Legatia Mobile App Development Plan

Based on analysis of the current Legatia project, here's a comprehensive plan for developing a mobile version using React Native and ICP integration.

## Current Architecture Overview
Your Legatia app is a family genealogy platform with:
- **Backend**: Rust canister with comprehensive family management features
- **Frontend**: TypeScript/Vite web app with Internet Identity authentication
- **Core Features**: Profile management, family trees, ghost profile matching, invitations, notifications

## Mobile Development Plan

### Phase 1: Project Setup & Core Infrastructure
1. **Create React Native project structure**
   ```
   legatia-mobile/
   ├── src/
   │   ├── services/          # ICP agent and canister integration
   │   ├── components/        # Reusable UI components
   │   ├── screens/          # Screen components
   │   ├── navigation/       # Navigation setup
   │   ├── types/           # TypeScript interfaces (reuse from web)
   │   └── utils/           # Helper functions
   ├── declarations/        # Generated canister interfaces
   └── assets/             # Images, fonts, etc.
   ```

2. **Install key dependencies**
   ```json
   {
     "@dfinity/agent": "latest",
     "@dfinity/candid": "latest", 
     "@dfinity/principal": "latest",
     "@noble/curves": "latest",
     "react-native": "latest",
     "@react-navigation/native": "latest",
     "react-native-keychain": "latest"
   }
   ```

### Phase 2: ICP Integration Layer
1. **Port canister declarations**
   - Copy your existing `declarations/Legatia_new_backend/` to mobile project
   - Ensure React Native compatibility for generated types

2. **Create mobile-optimized agent service**
   ```typescript
   // services/icp-agent.ts
   import { HttpAgent, Actor } from '@dfinity/agent';
   import { Principal } from '@dfinity/principal';
   import { idlFactory } from '../declarations/Legatia_new_backend';
   
   export class MobileICPService {
     private agent: HttpAgent;
     private actor: any;
     
     async initialize(identity?: Identity) {
       // Configure for mobile environment
       this.agent = new HttpAgent({
         host: 'https://ic0.app',
         identity: identity || new AnonymousIdentity()
       });
       
       this.actor = Actor.createActor(idlFactory, {
         agent: this.agent,
         canisterId: 'your-canister-id'
       });
     }
   }
   ```

### Phase 3: Authentication Strategy
1. **Implement secure proxy authentication**
   - Create lightweight web app for II authentication flow
   - Use deep linking to return delegation to mobile app
   - Implement secure storage for delegation chains

2. **Mobile authentication flow**
   ```typescript
   // services/auth.ts
   export class MobileAuthService {
     async authenticate(): Promise<boolean> {
       // 1. Open secure web proxy in browser
       // 2. Handle II authentication there
       // 3. Return delegation via app link
       // 4. Validate and store delegation securely
     }
   }
   ```

### Phase 4: Core Feature Implementation
1. **Port existing components to React Native**
   - Profile management screens
   - Family tree visualization (using react-native-svg)
   - Ghost profile matching interface
   - Invitation system

2. **Mobile-specific enhancements**
   - Touch-optimized family tree navigation
   - Camera integration for profile photos
   - Push notifications for invitations
   - Offline data caching

### Phase 5: Platform-Specific Features
1. **iOS Implementation**
   - Universal Links configuration
   - Keychain Services integration
   - App Store compliance

2. **Android Implementation**
   - App Links configuration  
   - Android Keystore integration
   - Play Store compliance

## Technical Implementation Details

### Internet Identity Mobile Integration
Based on ICP community guidance, here's the secure authentication approach:

1. **Secure Proxy Web App** (`legatia-auth-proxy.com`)
   ```typescript
   // Minimal web app for II authentication
   const handleAuth = async () => {
     const authClient = await AuthClient.create();
     await authClient.login({
       onSuccess: async () => {
         const delegation = await authClient.getIdentity().getDelegation();
         // Securely pass delegation to mobile app via app link
         window.location.href = `legatia://auth-success?delegation=${encodeURIComponent(delegation)}`;
       }
     });
   };
   ```

2. **Mobile App Deep Link Handler**
   ```typescript
   // Handle returning delegation from web proxy
   const handleAuthDeepLink = async (url: string) => {
     const delegation = extractDelegationFromUrl(url);
     if (await validateDelegation(delegation)) {
       await securelyStoreDelegation(delegation);
       initializeAuthenticatedSession();
     }
   };
   ```

### Backend Canister Methods Available
The mobile app will have access to all existing backend functionality:

#### Profile Management
- `create_profile()`
- `update_profile()`
- `get_profile()`
- `create_profile_with_ghost_check()`
- `update_profile_with_ghost_check()`

#### Family Management
- `create_family()`
- `get_user_families()`
- `get_family()`
- `add_family_member()`
- `remove_family_member()`
- `toggle_family_visibility()`

#### Events & Timeline
- `add_member_event()`
- `get_member_events_chronological()`

#### Ghost Profile System
- `find_matching_ghost_profiles()`
- `submit_ghost_profile_claim()`
- `get_pending_claims_for_admin()`
- `process_ghost_profile_claim()`
- `get_my_claim_requests()`

#### User Search & Invitations
- `search_users()`
- `send_family_invitation()`
- `process_family_invitation()`
- `get_my_invitations()`
- `get_sent_invitations()`

#### Notifications
- `get_my_notifications()`
- `get_unread_notification_count()`
- `mark_notification_read()`
- `mark_all_notifications_read()`

### Key Advantages of This Approach
- **Reuse existing backend**: No canister modifications needed
- **Full feature parity**: All 20+ backend methods available
- **Secure authentication**: Following ICP best practices
- **Platform native**: True mobile app experience
- **Future-proof**: Compatible with upcoming ICP mobile improvements

### Development Timeline
- **Week 1-2**: Project setup and ICP integration
- **Week 3-4**: Authentication implementation  
- **Week 5-8**: Core feature development
- **Week 9-10**: Platform-specific optimizations
- **Week 11-12**: Testing and deployment

### Mobile-Specific Considerations

#### Performance Optimizations
- Implement lazy loading for family tree data
- Cache frequently accessed family information
- Optimize image loading and storage
- Background sync for notifications

#### User Experience Enhancements
- Touch gestures for family tree navigation
- Swipe actions for quick operations
- Haptic feedback for important actions
- Dark mode support

#### Security Measures
- Secure keychain storage for delegations
- Certificate pinning for canister communication
- Biometric authentication integration
- Session timeout management

This plan leverages your existing robust backend while providing a native mobile experience that follows ICP ecosystem best practices.