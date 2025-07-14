# 🏛️ Legatia

**Legatia** is a decentralized, customizable chronicle platform built on the Internet Computer. It allows individuals, families, and legacy organizations to build secure, long-lasting digital records that will stand the test of time.

> 📜 "Legatia is not just an app — it’s your living chronicle, preserved forever."

---

## ✨ Features

- 👤 Web3 Profile System with Internet Identity login
- 🏠 Create and manage family or organization structures
- 🔗 Define and link relationships (parents, children, siblings, in-laws, etc.)
- ✉️ Invite others with secure one-time codes
- 🕊️ Admins can create and manage ghost (unregistered) profiles
- ⚖️ Role-based adminship & transfer controls
- 🪙 Token-based access for premium or high-storage features (future stage)

---

## 🧱 Tech Stack

- **Frontend**: React 
- **Mobile**: React Native(later stage)
- **Backend**: Internet Computer Canisters via Rust
- **Authentication**: Internet Identity (WebAuthn / Passkey)
- **Persistence**: Fully on-chain storage (no external DB)
- **Tokenomics**: Planned canister-integrated utility token for advanced features

---

## 🚀 Getting Started

### Prerequisites

- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/sdk/)
- Python 3.10+
- Node.js & npm
- Git

### Local Setup

```bash
git clone https://github.com/legatia/legatia.git
cd legatia
dfx start --background
dfx deploy
npm run dev  # for frontend
````

> For detailed developer guide, see [`/docs`](./docs)

---

## 🔐 Authentication

We use [Internet Identity](https://identity.ic0.app) — a secure, passwordless system that leverages device biometrics or keys. Every user is uniquely identified by a **Principal** (no emails or passwords stored).

---

## 🪙 Tokenomics (Preview)

Legatia introduces optional token-based payments for:

* Premium storage (e.g. images, family trees)
* Admin subscriptions
* Immutability locks for certified history

This token system is **on-chain** and **fully transparent**.

---

## 🧑‍💻 Team

Built by students from [42 School Warsaw](https://42wolfsburg.de/) — we believe that digital heritage deserves a secure and timeless platform.

---

## 📜 License

This project is licensed under the **Apache 2.0 License**. See [`LICENSE`](./LICENSE) for details.

---

## 💬 Feedback & Contributions

We welcome community input! Please:

* Open issues for bugs or suggestions
* Submit pull requests for improvements
* Join discussions in the `#legatia` tag on ICP developer forums (coming soon)

---

> 📖 *Your history deserves more than a drawer full of papers.*

```
