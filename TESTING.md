# 🧪 Legatia Local Testing Guide

This guide covers how to test Legatia locally during development, including authentication options, feature testing, multi-user scenarios, and security validation.

## 🛡️ Security Testing

All security fixes have been implemented and tested. The platform now includes:
- **Input validation** with length limits and character restrictions
- **Authorization controls** with proper access verification  
- **Secure ID generation** using cryptographic hashing
- **Error sanitization** with generic error messages
- **Content Security Policy** headers for XSS protection

---

## 🚀 Quick Start

1. **Start the local network:**
   ```bash
   dfx start --background
   dfx deploy
   ```

2. **Access the application:**
   - Frontend: http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/
   - Backend Candid UI: http://127.0.0.1:4943/?canisterId=uzt4z-lp777-77774-qaabq-cai&id=uxrrr-q7777-77774-qaaaq-cai

---

## 🔐 Development Authentication

### Option 1: Mock Login (Recommended)

The frontend includes a "Mock Login" button when running locally:

1. Open the frontend URL
2. Click **"Mock Login (Dev Only)"** instead of Internet Identity
3. You'll be authenticated with a mock principal for testing

### Option 2: DFX Identity Testing

For more realistic testing with multiple users, use dfx identities:

1. **Create test users:**
   ```bash
   # Create different test users
   dfx identity new alice
   dfx identity new bob
   dfx identity new carol
   ```

2. **Switch between users:**
   ```bash
   # Test as Alice
   dfx identity use alice
   dfx deploy
   
   # Test as Bob  
   dfx identity use bob
   dfx canister call Legatia_new_backend whoami
   ```

3. **Return to default:**
   ```bash
   dfx identity use default
   ```

---

## 🔍 New Features Testing

### Ghost Profile System
Test the ghost profile claim workflow:
```bash
# Find matching ghost profiles (after creating some family members)
dfx canister call Legatia_new_backend find_matching_ghost_profiles '()'

# Submit a claim request for a ghost profile
dfx canister call Legatia_new_backend submit_claim_request '(record {
  ghost_member_id = "GHOST_MEMBER_ID";
  family_id = "FAMILY_ID"; 
  reason = "This is my grandmother"
})'

# Get your submitted claims
dfx canister call Legatia_new_backend get_my_claim_requests '()'
```

### Family Invitation System
Test the complete invitation workflow:
```bash
# Search for users to invite
dfx canister call Legatia_new_backend search_users '("alice")'

# Send a family invitation
dfx canister call Legatia_new_backend send_family_invitation '(record {
  user_id = "USER_ID_FROM_SEARCH";
  family_id = "YOUR_FAMILY_ID";
  relationship_to_admin = "friend";
  message = opt "Join our family tree!"
})'

# Check sent invitations
dfx canister call Legatia_new_backend get_sent_invitations '()'

# As the invitee - check received invitations
dfx identity use bob
dfx canister call Legatia_new_backend get_my_invitations '()'

# Process the invitation (accept/decline)
dfx canister call Legatia_new_backend process_family_invitation '(record {
  invitation_id = "INVITATION_ID";
  accept = true
})'
```

### Notification System
Test the notification features:
```bash
# Get your notifications
dfx canister call Legatia_new_backend get_my_notifications '()'

# Get unread notification count
dfx canister call Legatia_new_backend get_unread_notification_count '()'

# Mark a notification as read
dfx canister call Legatia_new_backend mark_notification_read '("NOTIFICATION_ID")'

# Mark all notifications as read
dfx canister call Legatia_new_backend mark_all_notifications_read '()'
```

## 👥 Complete Feature Testing Flow

### 1. Create a Profile
```bash
dfx canister call Legatia_new_backend create_profile '(record { 
  full_name = "John Smith"; 
  surname_at_birth = "Smith"; 
  sex = "Male"; 
  birthday = "1980-01-15"; 
  birth_city = "New York"; 
  birth_country = "USA"; 
})'
```

### 1b. Create Profile with Ancient Date (BC)
```bash
dfx canister call Legatia_new_backend create_profile '(record { 
  full_name = "Julius Caesar"; 
  surname_at_birth = "Caesar"; 
  sex = "Male"; 
  birthday = "100 BC"; 
  birth_city = "Rome"; 
  birth_country = "Roman Republic"; 
})'
```

### 2. Create a Family
```bash
dfx canister call Legatia_new_backend create_family '(record { 
  name = "Smith Family"; 
  description = "A wonderful family tree starting with John and Mary Smith"; 
})'
```

### 3. Add Family Members
```bash
# Replace FAMILY_ID with the ID from step 2
dfx canister call Legatia_new_backend add_family_member '(record { 
  family_id = "FAMILY_ID"; 
  full_name = "Mary Smith"; 
  surname_at_birth = "Johnson"; 
  sex = "Female"; 
  birthday = opt "1985-03-20"; 
  birth_city = opt "Boston"; 
  birth_country = opt "USA"; 
  death_date = null; 
  relationship_to_admin = "spouse"; 
})'
```

### 4. Add Life Events
```bash
# Replace FAMILY_ID and MEMBER_ID with actual IDs
dfx canister call Legatia_new_backend add_member_event '(record { 
  family_id = "FAMILY_ID"; 
  member_id = "MEMBER_ID"; 
  title = "Birth"; 
  description = "Born in Boston Hospital"; 
  event_date = "1985-03-20"; 
  event_type = "birth"; 
})'
```

### 4b. Add Ancient Event (BC Date)
```bash
# Example with BC date for historical figures
dfx canister call Legatia_new_backend add_member_event '(record { 
  family_id = "FAMILY_ID"; 
  member_id = "MEMBER_ID"; 
  title = "Became Consul"; 
  description = "First consulship of Rome"; 
  event_date = "59 BC"; 
  event_type = "achievement"; 
})'
```

### 5. View Your Data
```bash
# Get your families
dfx canister call Legatia_new_backend get_user_families '()'

# Get specific family details
dfx canister call Legatia_new_backend get_family '("FAMILY_ID")'

# Get chronological events for a member
dfx canister call Legatia_new_backend get_member_events_chronological '("FAMILY_ID", "MEMBER_ID")'
```

---

## 🔒 Multi-User Permission Testing

Test family sharing and admin permissions:

### 1. Create Family as Alice
```bash
dfx identity use alice
dfx canister call Legatia_new_backend create_profile '(record {
  full_name = "Alice Johnson";
  surname_at_birth = "Johnson";
  sex = "Female";
  birthday = "1990-05-10";
  birth_city = "Seattle";
  birth_country = "USA";
})'

dfx canister call Legatia_new_backend create_family '(record {
  name = "Johnson Family";
  description = "Alice\'s family tree";
})'
```

### 2. Try to Access as Bob (Should Fail)
```bash
dfx identity use bob  
dfx canister call Legatia_new_backend create_profile '(record {...})'
dfx canister call Legatia_new_backend get_family '("ALICE_FAMILY_ID")'
# Expected: "Access denied: You are not a member of this family"
```

### 3. Test Admin-Only Operations
```bash
# Bob tries to add member to Alice's family (should fail)
dfx identity use bob
dfx canister call Legatia_new_backend add_family_member '(record {
  family_id = "ALICE_FAMILY_ID";
  full_name = "Test Member";
  surname_at_birth = "Test";
  sex = "Other";
  relationship_to_admin = "other";
})'
# Expected: "Only family admin can add members"
```

---

## 📊 Frontend Testing Scenarios

### Profile Management Flow
1. Mock login → Create profile → Edit profile → View profile

### Family Management Flow  
1. Profile → Manage Families → Create Family → View Family List

### Member Management Flow
1. Family Detail → Add Member → View Member → Add Event to Member

### Navigation Testing
1. Test back buttons and breadcrumbs
2. Verify error states and loading indicators
3. Test responsive design on different screen sizes

---

## 🔄 Development Utilities

### Reset Local State
To start fresh during testing:
```bash
dfx stop
dfx start --clean --background
dfx deploy
```
> **Note:** This deletes all local data including profiles and families.

### Check Current Identity
```bash
dfx identity whoami
dfx canister call Legatia_new_backend whoami
```

### View Canister Logs
```bash
# View backend logs
dfx canister logs Legatia_new_backend

# Follow logs in real-time
dfx canister logs Legatia_new_backend --follow
```

### Test Data Persistence
```bash
# Create some data
dfx canister call Legatia_new_backend create_profile '(record {...})'

# Stop and restart (without --clean)
dfx stop
dfx start --background

# Data should still be there
dfx canister call Legatia_new_backend get_profile '()'
```

---

## 🐛 Common Testing Issues

### Issue: "Actor not available"
**Solution:** Ensure dfx is running and canisters are deployed
```bash
dfx start --background
dfx deploy
```

### Issue: "Authentication required"
**Solution:** The app is not in development mode, use mock login or Internet Identity

### Issue: "Profile not found"  
**Solution:** Create a profile first before testing family features

### Issue: TypeScript compilation errors
**Solution:** Check that all new ViewTypes are added to types.ts

### Issue: "Access denied" for family operations
**Solution:** Ensure you're testing as the family admin or create a new family

---

## 🛡️ Security Testing Scenarios

### Input Validation Testing
Test that malicious inputs are properly rejected:

```bash
# Test search query validation
dfx canister call Legatia_new_backend search_users '("x")'
# Expected: Error - query too short

dfx canister call Legatia_new_backend search_users '("john<script>alert(1)</script>")'
# Expected: Error - invalid characters

# Test profile creation validation
dfx canister call Legatia_new_backend create_profile '(record {
  full_name = "<script>alert(1)</script>";
  surname_at_birth = "Test";
  sex = "M";
  birthday = "1990-01-01";
  birth_city = "Test City";
  birth_country = "Test Country"
})'
# Expected: Error - invalid name format

# Test family creation validation
dfx canister call Legatia_new_backend create_family '(record {
  name = "";
  description = "Test family"
})'
# Expected: Error - invalid family name format
```

### Authorization Testing
Test that unauthorized operations are blocked:

```bash
# Create family as Alice
dfx identity use alice
ALICE_FAMILY_ID=$(dfx canister call Legatia_new_backend create_family '(record {
  name = "Alice Family";
  description = "Test family"
})' | grep -o '"[a-f0-9]*"' | head -1 | sed 's/"//g')

# Try to access Alice's family as Bob (should fail)
dfx identity use bob
dfx canister call Legatia_new_backend get_family '("'$ALICE_FAMILY_ID'")'
# Expected: Error - access denied

# Try to add member to Alice's family as Bob (should fail)
dfx canister call Legatia_new_backend add_family_member '(record {
  family_id = "'$ALICE_FAMILY_ID'";
  full_name = "Test Member";
  surname_at_birth = "Test";
  sex = "Other";
  relationship_to_admin = "other"
})'
# Expected: Error - only family admin can add members
```

### Secure ID Generation Testing
Verify that IDs are properly generated:

```bash
# Create multiple families and check that IDs are different and secure
dfx canister call Legatia_new_backend create_family '(record {name = "Family 1"; description = "Test"})'
dfx canister call Legatia_new_backend create_family '(record {name = "Family 2"; description = "Test"})'
# IDs should be cryptographic hashes (like "aacaaf398027d548")
```

## 🧪 Automated Test Suites

### Backend Test Suite
Run the complete backend test suite:
```bash
cd tests
./test_backend.sh
# Expected: 11/11 tests passing
```

### Complete System Test  
Run the full system integration test:
```bash
cd tests
./test_complete_system.sh
# Expected: High success rate with security tests passing
```

### Invitation System Test
Test the complete invitation workflow:
```bash
cd tests
./test_invitation_system.sh
# Expected: All security and authorization tests passing
```

### Token System Test
Test the Legatia token functionality:
```bash
cd Legatia_token
cargo test
# Expected: 6/6 tests passing
```

---

## 📝 Test Checklist

### Backend API Testing
- [ ] Create, read, update profile
- [ ] Create family and list user families  
- [ ] Add/remove family members
- [ ] Add events and retrieve chronologically
- [ ] Test admin permissions and access control
- [ ] Verify data persistence after restart

### Frontend Testing
- [ ] Mock login authentication flow
- [ ] Profile creation and editing forms
- [ ] Family list and creation interface
- [ ] Family detail view with members
- [ ] Member and event management forms
- [ ] Navigation between all views
- [ ] Error handling and loading states
- [ ] Responsive design on mobile/desktop

### Multi-User Testing
- [ ] Multiple dfx identities
- [ ] Family privacy and access control
- [ ] Admin vs non-admin permissions
- [ ] Cross-user data isolation

---

> 🎯 **Pro Tip:** Use the Candid UI for quick backend testing, then verify the same operations work through the frontend interface.