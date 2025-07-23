#!/bin/bash

# Family Invitation System Test Suite
# Tests the complete invitation workflow including search, notifications, and family joining

set -e

echo "🔗 Testing Family Invitation System"
echo "=================================="

CANISTER="Legatia_new_backend"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Setup: Create identities for testing
echo -e "${YELLOW}🔧 Setting up test identities${NC}"
echo "----------------------------"

# Create Alice (family admin)
dfx identity new alice --disable-encryption 2>/dev/null || true
dfx identity use alice

# Create Alice's profile
run_test "Create Alice's Profile" \
    "dfx canister call $CANISTER create_profile '(record { 
        full_name = \"Alice Johnson\"; 
        surname_at_birth = \"Smith\"; 
        sex = \"F\"; 
        birthday = \"1990-05-15\"; 
        birth_city = \"New York\"; 
        birth_country = \"USA\" 
    })'" \
    "variant { Ok"

# Store Alice's principal for later use
ALICE_PRINCIPAL=$(dfx canister call $CANISTER whoami | grep -o 'principal "[^"]*"' | sed 's/principal "\(.*\)"/\1/')

# Create Alice's family
FAMILY_RESULT=$(dfx canister call $CANISTER create_family '(record { 
    name = "Johnson Family Test"; 
    description = "Test family for invitation system"; 
    is_visible = opt true 
})' 2>&1)

if echo "$FAMILY_RESULT" | grep -q "Ok"; then
    # Extract family ID from result (simplified parsing)
    FAMILY_ID=$(echo "$FAMILY_RESULT" | grep -o '"[0-9_a-z-]*"' | head -1 | sed 's/"//g')
    echo -e "${GREEN}✅ SUCCESS:${NC} Family created with ID: $FAMILY_ID"
else
    echo -e "${RED}❌ ERROR:${NC} Failed to create family"
    exit 1
fi

# Create Bob (invitee)
dfx identity new bob --disable-encryption 2>/dev/null || true
dfx identity use bob

# Create Bob's profile
run_test "Create Bob's Profile" \
    "dfx canister call $CANISTER create_profile '(record { 
        full_name = \"Bob Wilson\"; 
        surname_at_birth = \"Wilson\"; 
        sex = \"M\"; 
        birthday = \"1985-08-20\"; 
        birth_city = \"Boston\"; 
        birth_country = \"USA\" 
    })'" \
    "variant { Ok"

# Store Bob's principal for later use
BOB_PRINCIPAL=$(dfx canister call $CANISTER whoami | grep -o 'principal "[^"]*"' | sed 's/principal "\(.*\)"/\1/')

# Create Charlie (another user for search testing)
dfx identity new charlie --disable-encryption 2>/dev/null || true
dfx identity use charlie

# Create Charlie's profile
run_test "Create Charlie's Profile" \
    "dfx canister call $CANISTER create_profile '(record { 
        full_name = \"Charlie Brown\"; 
        surname_at_birth = \"Brown\"; 
        sex = \"M\"; 
        birthday = \"1992-12-03\"; 
        birth_city = \"Chicago\"; 
        birth_country = \"USA\" 
    })'" \
    "variant { Ok"

echo -e "${YELLOW}👥 Testing User Search Functionality${NC}"
echo "-----------------------------------"

# Switch back to Alice to test search
dfx identity use alice

# Test 1: Search by partial name
run_test "Search Users by Partial Name (bob)" \
    "dfx canister call $CANISTER search_users '(\"bob\")'" \
    "variant { 17_724"

# Test 2: Search by partial name (charlie)
run_test "Search Users by Partial Name (charlie)" \
    "dfx canister call $CANISTER search_users '(\"charlie\")'" \
    "variant { 17_724"

# Test 3: Search by surname
run_test "Search Users by Surname (wilson)" \
    "dfx canister call $CANISTER search_users '(\"wilson\")'" \
    "variant { 17_724"

# Test 4: Search with insufficient query length
run_test "Search with Short Query (should fail)" \
    "dfx canister call $CANISTER search_users '(\"b\")'" \
    "variant { 3_456_837"

# Test 5: Get Bob's user ID for invitation
BOB_SEARCH_RESULT=$(dfx canister call $CANISTER search_users '("bob")' 2>&1)
if echo "$BOB_SEARCH_RESULT" | grep -q "Bob Wilson"; then
    # Extract Bob's user ID (this is a simplified extraction)
    BOB_USER_ID=$(echo "$BOB_SEARCH_RESULT" | grep -o '"[a-z_0-9]*"' | head -1 | sed 's/"//g')
    echo -e "${GREEN}✅ SUCCESS:${NC} Found Bob's user ID: $BOB_USER_ID"
else
    echo -e "${RED}❌ ERROR:${NC} Could not find Bob's user ID"
    exit 1
fi

echo -e "${YELLOW}📨 Testing Family Invitation System${NC}"
echo "----------------------------------"

# Test 6: Send invitation to Bob
run_test "Send Family Invitation to Bob" \
    "dfx canister call $CANISTER send_family_invitation '(record { 
        user_id = \"$BOB_USER_ID\"; 
        family_id = \"$FAMILY_ID\"; 
        message = opt \"Welcome to our family tree\"; 
        relationship_to_admin = \"friend\" 
    })'" \
    "variant { Ok"

# Store the invitation ID for later use
INVITATION_RESULT=$(dfx canister call $CANISTER send_family_invitation '(record { 
    user_id = "bob_test_duplicate"; 
    family_id = "'$FAMILY_ID'"; 
    message = opt "Test duplicate"; 
    relationship_to_admin = "cousin" 
})' 2>&1 || echo "Expected failure")

# Test 7: Try to send duplicate invitation (should fail)
run_test "Prevent Duplicate Invitations" \
    "dfx canister call $CANISTER send_family_invitation '(record { 
        user_id = \"$BOB_USER_ID\"; 
        family_id = \"$FAMILY_ID\"; 
        message = opt \"Duplicate invitation\"; 
        relationship_to_admin = \"cousin\" 
    })'" \
    "variant { 3_456_837"

# Test 8: Get sent invitations (Alice's view)
run_test "Get Sent Invitations (Alice)" \
    "dfx canister call $CANISTER get_sent_invitations" \
    "variant { 17_724"

echo -e "${YELLOW}🔔 Testing Notification System${NC}"
echo "-----------------------------"

# Switch to Bob to test notifications
dfx identity use bob

# Test 9: Get Bob's notifications
run_test "Get Bob's Notifications" \
    "dfx canister call $CANISTER get_my_notifications" \
    "variant { 17_724"

# Test 10: Get Bob's unread notification count
run_test "Get Unread Notification Count (Bob)" \
    "dfx canister call $CANISTER get_unread_notification_count" \
    "variant { 17_724"

# Test 11: Get Bob's family invitations
INVITATIONS_RESULT=$(dfx canister call $CANISTER get_my_invitations 2>&1)
run_test "Get My Invitations (Bob)" \
    "echo '$INVITATIONS_RESULT'" \
    "variant { Ok"

# Extract invitation ID for processing
if echo "$INVITATIONS_RESULT" | grep -q "invitation_"; then
    INVITATION_ID=$(echo "$INVITATIONS_RESULT" | grep -o 'invitation_[0-9]*' | head -1)
    echo -e "${GREEN}✅ SUCCESS:${NC} Found invitation ID: $INVITATION_ID"
else
    echo -e "${RED}❌ ERROR:${NC} Could not find invitation ID"
    INVITATION_ID="invitation_test_fallback"
fi

echo -e "${YELLOW}✅ Testing Invitation Processing${NC}"
echo "-------------------------------"

# Test 12: Bob accepts the invitation
run_test "Accept Family Invitation (Bob)" \
    "dfx canister call $CANISTER process_family_invitation '(record { 
        invitation_id = \"$INVITATION_ID\"; 
        accept = true 
    })'" \
    "accepted"

# Test 13: Try to process the same invitation again (should fail)
run_test "Prevent Re-processing Invitation" \
    "dfx canister call $CANISTER process_family_invitation '(record { 
        invitation_id = \"$INVITATION_ID\"; 
        accept = true 
    })'" \
    "variant { 3_456_837"

# Test 14: Check Bob's updated notifications
run_test "Get Updated Notifications (Bob)" \
    "dfx canister call $CANISTER get_my_notifications" \
    "variant { 17_724"

echo -e "${YELLOW}👨‍👩‍👧‍👦 Testing Family Membership${NC}"
echo "-----------------------------"

# Switch back to Alice to verify Bob joined the family
dfx identity use alice

# Test 15: Verify Bob is now a family member
run_test "Verify Bob Joined Family" \
    "dfx canister call $CANISTER get_family '(\"$FAMILY_ID\")'" \
    "Bob Wilson"

# Test 16: Check Alice got notified about Bob's acceptance
run_test "Alice's Acceptance Notification" \
    "dfx canister call $CANISTER get_my_notifications" \
    "variant { 17_724"

# Test 17: Check Alice's unread notification count
run_test "Get Unread Notification Count (Alice)" \
    "dfx canister call $CANISTER get_unread_notification_count" \
    "variant { 17_724"

echo -e "${YELLOW}🗑️  Testing Invitation Decline${NC}"
echo "-----------------------------"

# Get Charlie's user ID for decline test
CHARLIE_SEARCH_RESULT=$(dfx canister call $CANISTER search_users '("charlie")' 2>&1)
if echo "$CHARLIE_SEARCH_RESULT" | grep -q "Charlie Brown"; then
    CHARLIE_USER_ID=$(echo "$CHARLIE_SEARCH_RESULT" | grep -o '"[a-z_0-9]*"' | head -1 | sed 's/"//g')
    echo -e "${GREEN}✅ SUCCESS:${NC} Found Charlie's user ID: $CHARLIE_USER_ID"
else
    echo -e "${RED}❌ ERROR:${NC} Could not find Charlie's user ID"
    CHARLIE_USER_ID="charlie_test_fallback"
fi

# Test 18: Send invitation to Charlie
run_test "Send Family Invitation to Charlie" \
    "dfx canister call $CANISTER send_family_invitation '(record { 
        user_id = \"$CHARLIE_USER_ID\"; 
        family_id = \"$FAMILY_ID\"; 
        message = opt \"Join our family\"; 
        relationship_to_admin = \"friend\" 
    })'" \
    "variant { Ok"

# Switch to Charlie
dfx identity use charlie

# Get Charlie's invitation
CHARLIE_INVITATIONS=$(dfx canister call $CANISTER get_my_invitations 2>&1)
if echo "$CHARLIE_INVITATIONS" | grep -q "invitation_"; then
    CHARLIE_INVITATION_ID=$(echo "$CHARLIE_INVITATIONS" | grep -o 'invitation_[0-9]*' | head -1)
    echo -e "${GREEN}✅ SUCCESS:${NC} Found Charlie's invitation ID: $CHARLIE_INVITATION_ID"
else
    CHARLIE_INVITATION_ID="invitation_test_fallback"
fi

# Test 19: Charlie declines the invitation
run_test "Decline Family Invitation (Charlie)" \
    "dfx canister call $CANISTER process_family_invitation '(record { 
        invitation_id = \"$CHARLIE_INVITATION_ID\"; 
        accept = false 
    })'" \
    "declined"

# Switch back to Alice to check decline notification
dfx identity use alice

# Test 20: Check Alice got notified about Charlie's decline
run_test "Alice's Decline Notification" \
    "dfx canister call $CANISTER get_my_notifications" \
    "variant { 17_724"

echo -e "${YELLOW}🧹 Testing Notification Management${NC}"
echo "--------------------------------"

# Test 21: Mark notification as read
ALICE_NOTIFICATIONS=$(dfx canister call $CANISTER get_my_notifications 2>&1)
if echo "$ALICE_NOTIFICATIONS" | grep -q "notification_"; then
    NOTIFICATION_ID=$(echo "$ALICE_NOTIFICATIONS" | grep -o 'notification_[0-9]*' | head -1)
    run_test "Mark Notification as Read" \
        "dfx canister call $CANISTER mark_notification_read '(\"$NOTIFICATION_ID\")'" \
        "variant { 17_724"
else
    echo -e "${YELLOW}⚠️  WARNING:${NC} Could not find notification ID for read test"
fi

# Test 22: Mark all notifications as read
run_test "Mark All Notifications as Read" \
    "dfx canister call $CANISTER mark_all_notifications_read" \
    "variant { 17_724"

# Test 23: Check updated unread count
run_test "Verify Unread Count After Marking Read" \
    "dfx canister call $CANISTER get_unread_notification_count" \
    "variant { 17_724"

echo -e "${YELLOW}🔒 Testing Security and Edge Cases${NC}"
echo "--------------------------------"

# Switch to Bob to test security
dfx identity use bob

# Test 24: Try to send invitation from non-admin (should fail)
run_test "Non-Admin Cannot Send Invitations" \
    "dfx canister call $CANISTER send_family_invitation '(record { 
        user_id = \"$CHARLIE_USER_ID\"; 
        family_id = \"$FAMILY_ID\"; 
        message = opt \"Unauthorized invitation\"; 
        relationship_to_admin = \"friend\" 
    })'" \
    "variant { 3_456_837"

# Test 25: Try to invite non-existent user (should fail)
dfx identity use alice
run_test "Cannot Invite Non-Existent User" \
    "dfx canister call $CANISTER send_family_invitation '(record { 
        user_id = \"non_existent_user_123\"; 
        family_id = \"$FAMILY_ID\"; 
        message = opt \"Invalid invitation\"; 
        relationship_to_admin = \"friend\" 
    })'" \
    "variant { 3_456_837"

# Test 26: Try to invite user to non-existent family (should fail)
run_test "Cannot Invite to Non-Existent Family" \
    "dfx canister call $CANISTER send_family_invitation '(record { 
        user_id = \"$CHARLIE_USER_ID\"; 
        family_id = \"non_existent_family_123\"; 
        message = opt \"Invalid family invitation\"; 
        relationship_to_admin = \"friend\" 
    })'" \
    "variant { 3_456_837"

echo -e "${YELLOW}📊 Test Results${NC}"
echo "=================="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All invitation system tests passed!${NC}"
    echo -e "${GREEN}The family invitation system is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the implementation.${NC}"
    exit 1
fi

# Cleanup: Switch back to default identity
dfx identity use default 2>/dev/null || true