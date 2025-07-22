# 🏛️ Legatia

A decentralized family tree and digital legacy platform built on the Internet Computer. Create secure, eternal digital records for families and organizations.

> 📜 "Your living chronicle, preserved forever."

## ✨ Features

- 👤 **Web3 Profiles** with Internet Identity authentication
- 🏠 **Family Management** with member relationships and chronological events
- 🔐 **Admin Controls** for family management and privacy
- 📱 **Responsive Design** - works on desktop and mobile
- 🌐 **Fully On-Chain** - no external databases, data lives forever

## 🧱 Tech Stack

- **Frontend**: TypeScript + lit-html
- **Backend**: Rust canisters on Internet Computer
- **Auth**: Internet Identity (passwordless)
- **Storage**: IC Stable Memory

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

1. **Create Profile** - Set up your identity with Internet Identity
2. **Build Family Trees** - Add family members with relationships
3. **Chronicle Events** - Record life events in chronological order
4. **Manage Privacy** - Control who can view and edit your family data

## 🔐 Authentication

Uses [Internet Identity](https://identity.ic0.app) - passwordless authentication with device biometrics. No emails or passwords stored.

## 🧑‍💻 Team & Contributing

Built by [42 School Warsaw](https://42warsaw.pl) students. We welcome contributions:
- Open issues for bugs/suggestions
- Submit pull requests
- Apache 2.0 License

> 📖 *Your history deserves more than a drawer full of papers.*
