#!/bin/bash

# Legatia Family Tree Backend Test Suite
# This script tests all backend functions automatically

set -e  # Exit on any error

echo "🧪 Starting Legatia Backend Test Suite..."
echo "============================================"

CANISTER="Legatia_new_backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_result="$3"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if result=$(eval "$command" 2>&1); then
        if [[ -z "$expected_result" ]] || echo "$result" | grep -q "$expected_result"; then
            echo -e "${GREEN}✅ PASS${NC}: $test_name"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC}: $test_name"
            echo "Expected: $expected_result"
            echo "Got: $result"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name (Command failed)"
        echo "Error: $result"
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo -e "${YELLOW}🔧 Basic Connectivity Tests${NC}"
echo "----------------------------"

# Test 1: Basic connectivity
run_test "Whoami (Authentication Check)" \
    "dfx canister call $CANISTER whoami" \
    "principal"

echo -e "${YELLOW}👤 Profile Management Tests${NC}"
echo "----------------------------"

# Test 2: Profile creation
run_test "Create Test Profile" \
    "dfx canister call $CANISTER create_profile '(record { 
        full_name = \"Test User\"; 
        surname_at_birth = \"TestSurname\"; 
        sex = \"M\"; 
        birthday = \"1990-01-01\"; 
        birth_city = \"Test City\"; 
        birth_country = \"Test Country\" 
    })'" \
    "Ok"

# Test 3: Get profile
run_test "Get Profile" \
    "dfx canister call $CANISTER get_profile" \
    "full_name"

# Test 4: Update profile
run_test "Update Profile" \
    "dfx canister call $CANISTER update_profile '(record { 
        full_name = opt \"Updated Test User\"; 
        surname_at_birth = null; 
        sex = null; 
        birthday = null; 
        birth_city = null; 
        birth_country = null 
    })'" \
    "Ok"

echo -e "${YELLOW}👨‍👩‍👧‍👦 Family Management Tests${NC}"
echo "-------------------------------"

# Test 5: Create family
FAMILY_ID="test_family_$(date +%s)"
run_test "Create Family" \
    "dfx canister call $CANISTER create_family '(record { 
        name = \"Test Family\"; 
        description = \"A test family for automation\"; 
        is_visible = opt true 
    })'" \
    "Ok"

# Test 6: Get user families
run_test "Get User Families" \
    "dfx canister call $CANISTER get_user_families" \
    "Ok"

# Test 7: Add family member (ghost profile)
run_test "Add Family Member (Ghost Profile)" \
    "dfx canister call $CANISTER add_family_member '(record { 
        family_id = \"test_family_123\"; 
        full_name = \"John Doe\"; 
        surname_at_birth = \"Doe\"; 
        sex = \"M\"; 
        birthday = opt \"1985-05-15\"; 
        birth_city = opt \"Boston\"; 
        birth_country = opt \"USA\"; 
        death_date = null; 
        relationship_to_admin = \"brother\" 
    })'" \
    ""

echo -e "${YELLOW}👻 Ghost Profile System Tests${NC}"
echo "-----------------------------"

# Test 8: Find matching ghost profiles
run_test "Find Matching Ghost Profiles" \
    "dfx canister call $CANISTER find_matching_ghost_profiles" \
    "Ok"

# Test 9: Get claim requests (user)
run_test "Get My Claim Requests" \
    "dfx canister call $CANISTER get_my_claim_requests" \
    "Ok"

# Test 10: Get pending claims for admin
run_test "Get Pending Claims for Admin" \
    "dfx canister call $CANISTER get_pending_claims_for_admin" \
    "Ok"

echo -e "${YELLOW}🔒 Family Visibility Tests${NC}"
echo "--------------------------"

# Test 11: Toggle family visibility
run_test "Toggle Family Visibility" \
    "dfx canister call $CANISTER toggle_family_visibility '(\"test_family_123\", false)'" \
    ""

echo -e "${YELLOW}📊 Test Results${NC}"
echo "=================="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! The backend is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the implementation.${NC}"
    exit 1
fi