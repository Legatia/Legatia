#!/bin/bash

# Master Test Runner for Legatia Family Tree System
# Runs all automated tests

echo "🚀 Legatia Family Tree - Master Test Suite"
echo "=========================================="

# Check if dfx is running
if ! pgrep -f "dfx start" > /dev/null; then
    echo "⚠️  Warning: dfx might not be running. Please ensure 'dfx start' is running in another terminal."
    echo "Press Enter to continue or Ctrl+C to abort..."
    read -r
fi

# Check if canisters are deployed
echo "🔍 Checking canister deployment..."
if ! dfx canister status Legatia_new_backend &>/dev/null; then
    echo "❌ Backend canister not deployed. Deploying..."
    dfx deploy Legatia_new_backend
fi

echo ""
echo "📋 Running Basic Backend Tests..."
echo "================================"
if ./test_backend.sh; then
    echo "✅ Basic backend tests passed!"
else
    echo "❌ Basic backend tests failed!"
    exit 1
fi

echo ""
echo "👻 Running Ghost Profile Workflow Tests..."
echo "=========================================="
if ./test_ghost_profile_workflow.sh; then
    echo "✅ Ghost profile workflow tests passed!"
else
    echo "❌ Ghost profile workflow tests failed!"
    exit 1
fi

echo ""
echo "🎉 All Tests Completed Successfully!"
echo "==================================="
echo ""
echo "🌐 Frontend URL: http://$(dfx canister id Legatia_new_frontend).localhost:4943/"
echo "🔧 Backend Candid: http://127.0.0.1:4943/?canisterId=$(dfx canister id __Candid_UI)&id=$(dfx canister id Legatia_new_backend)"
echo ""
echo "✨ Your Legatia Family Tree system is fully functional and ready for use!"