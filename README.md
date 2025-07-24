# 🏛️ Legatia

A decentralized family tree and digital legacy platform built on the Internet Computer. Create secure, eternal digital records for families and organizations.

> 📜 "Your living chronicle, preserved forever."

## ✨ Features

- 👤 **Web3 Profiles** with Internet Identity authentication
- 🏠 **Family Management** with member relationships and chronological events
- 👻 **Ghost Profile System** - claim and manage profiles of family members without accounts
- 📨 **Family Invitation System** - invite users to join families with notifications
- 🔐 **Privacy Controls** - family visibility settings and admin permissions
- 🔍 **User Search** - find and invite other users to join families
- 🔔 **Notification System** - stay updated on family activities
- 🪙 **Native Token (LGT)** - ICRC-1 compliant token for platform rewards
- 📱 **Responsive Design** - works on desktop and mobile
- 🌐 **Fully On-Chain** - no external databases, data lives forever
- 🛡️ **Security Hardened** - comprehensive input validation and protection

## 🧱 Tech Stack

- **Frontend**: TypeScript + lit-html with CSP security headers
- **Backend**: Rust canisters on Internet Computer with comprehensive security validation
- **Auth**: Internet Identity (passwordless) with development mock options
- **Storage**: IC Stable Memory with secure serialization
- **Token**: ICRC-1 compliant native token (LGT) with security-hardened implementation

## 🚀 Quick Start

**Prerequisites:** [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/sdk/), [Rust](https://rustup.rs/), Node.js

```bash
git clone <your-repo-url>
cd Legatia_new
dfx start --background
dfx deploy
```

**Access:** http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/

**Testing:** See [TESTING.md](./TESTING.md) for comprehensive testing guide including mock login and feature testing.

## 📱 What You Can Do

1. **Create Profile** - Set up your identity with Internet Identity or mock login for development
2. **Build Family Trees** - Add family members with relationships and chronological events
3. **Ghost Profile Management** - Create profiles for family members who don't have accounts yet
4. **Family Invitations** - Search for users and invite them to join your family
5. **Notification Center** - Stay updated on family activities and invitations
6. **Privacy Controls** - Control family visibility and manage member permissions
7. **Token Rewards** - Earn LGT tokens for platform participation (coming soon)

## 🔐 Authentication

Uses [Internet Identity](https://identity.ic0.app) - passwordless authentication with device biometrics. No emails or passwords stored.

For development and testing, a mock login option is available when running locally.

## 🛡️ Security Features

Legatia implements comprehensive security measures:

- **Input Validation** - All user inputs are validated and sanitized
- **Content Security Policy** - CSP headers prevent XSS attacks
- **Authorization Controls** - Proper access controls for family operations
- **Secure ID Generation** - Cryptographically secure hash-based IDs
- **Error Sanitization** - Generic error messages prevent information disclosure
- **Safe Serialization** - Proper error handling prevents panics and data corruption
- **Transaction Security** - ICRC-1 token with deduplication and overflow protection

## 🪙 Legatia Token (LGT)

The platform includes a native ICRC-1 compliant token located in `/Legatia_token/`:

- **Standard**: ICRC-1 for full interoperability
- **Security**: Comprehensive security hardening with overflow protection
- **Features**: Minting, burning, rewards system
- **Testing**: Full test suite with 6/6 tests passing

See [Legatia_token/README.md](./Legatia_token/README.md) for detailed token documentation.

## 🧪 Testing

Comprehensive test suite available:

- **Backend Tests**: 11/11 core functionality tests passing
- **Security Tests**: All input validation and authorization tests passing
- **System Tests**: Full end-to-end workflow testing
- **Token Tests**: Complete ICRC-1 token functionality testing

Run tests with: `./tests/test_backend.sh` or see [TESTING.md](./TESTING.md) for full testing guide.

## 🧑‍💻 Team & Contributing

Built by [42 School Warsaw](https://42warsaw.pl) students. We welcome contributions:
- Open issues for bugs/suggestions
- Submit pull requests
- Apache 2.0 License

> 📖 *Your history deserves more than a drawer full of papers.*
