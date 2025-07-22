# Legatia Family Tree - Test Suite

This directory contains automated tests for the Legatia Family Tree system.

## Test Scripts

### 🧪 `test_backend.sh`
Basic backend functionality tests covering:
- ✅ Authentication and connectivity
- ✅ Profile creation and management  
- ✅ Family creation and management
- ✅ Ghost profile system
- ✅ Family visibility controls

### 👻 `test_ghost_profile_workflow.sh`
Complete ghost profile claiming workflow test:
- ✅ Admin profile creation
- ✅ Family creation with ghost profiles
- ✅ Ghost profile discovery algorithm
- ✅ Family visibility toggle (anti-spam)
- ✅ Claim management interfaces

### 🚀 `run_all_tests.sh`
Master test runner that executes all tests in sequence.

## Running Tests

### Prerequisites
1. Start the local DFX network:
   ```bash
   dfx start --clean
   ```

2. Deploy the canisters:
   ```bash
   dfx deploy
   ```

### Run All Tests
```bash
cd tests
./run_all_tests.sh
```

### Run Individual Tests
```bash
# Basic backend tests
./test_backend.sh

# Ghost profile workflow tests  
./test_ghost_profile_workflow.sh
```

## Test Coverage

### Core Features Tested ✅
- **Profile Management**: Create, read, update profiles
- **Family Management**: Create families, add members, manage events
- **Ghost Profile System**: Similarity matching, claim requests
- **Family Visibility**: Anti-spam controls for family admins
- **Authentication**: Principal-based access control

### Frontend Integration 🔄
The automated tests focus on backend functionality. Frontend testing should be done manually through the web interface at:
- **Frontend**: http://[frontend-canister-id].localhost:4943/
- **Candid UI**: http://127.0.0.1:4943/?canisterId=[candid-ui-id]&id=[backend-canister-id]

## Test Results

All tests include colored output:
- 🟢 **Green**: Tests passed
- 🔴 **Red**: Tests failed  
- 🟡 **Yellow**: Warnings or informational messages
- 🔵 **Blue**: Test step indicators

## Debugging Failed Tests

If tests fail:

1. **Check DFX Status**: Ensure `dfx start` is running
2. **Check Deployment**: Verify canisters are deployed with `dfx canister status --all`
3. **Check Logs**: Use `dfx canister logs Legatia_new_backend` for backend logs
4. **Manual Testing**: Use the Candid UI for manual function testing

## Adding New Tests

To add new tests:

1. Add test functions to existing scripts, or
2. Create new test scripts following the existing pattern:
   ```bash
   #!/bin/bash
   set -e
   # Your tests here
   ```

3. Make scripts executable: `chmod +x your_test.sh`
4. Update `run_all_tests.sh` to include your new tests

## Notes

- Tests create temporary data (profiles, families) that persist in the local canister state
- For clean test runs, use `dfx start --clean` to reset state
- Some tests may show warnings for expected error conditions - this is normal
- Ghost profile discovery tests may return empty results if no matching profiles exist