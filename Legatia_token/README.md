# Legatia Token (LGT)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![ICP](https://img.shields.io/badge/platform-Internet%20Computer-blue.svg)
![Rust](https://img.shields.io/badge/language-Rust-orange.svg)
![ICRC-1](https://img.shields.io/badge/standard-ICRC--1-green.svg)

**Legatia Token (LGT)** is a native utility token built on the Internet Computer Protocol (ICP) that powers the Legatia family tree platform. It's designed to incentivize family tree building, reward community participation, and enable token-gated features within the genealogy ecosystem.

## 🌟 Features

### ICRC-1 Standard Compliance
- ✅ **Fully ICRC-1 Compatible**: Works with any ICP wallet, DEX, or DeFi protocol
- ✅ **Standard Methods**: Complete implementation of all ICRC-1 required methods
- ✅ **Interoperability**: Seamless integration with the broader ICP ecosystem

### Advanced Token Economics
- 🏆 **Reward System**: Automated token rewards for family tree activities
- 📊 **Reward Tracking**: Comprehensive statistics for user reward history
- 🔥 **Deflationary Mechanics**: Token burning capabilities for premium features
- 💰 **Flexible Minting**: Controlled token creation for ecosystem growth

### Family Tree Integration
- 👨‍👩‍👧‍👦 **Activity Rewards**: Earn tokens for building family trees
- 🎯 **Achievement System**: Milestone-based token distribution
- 🤝 **Community Incentives**: Rewards for helping other users
- 🏅 **Verification Bonuses**: Extra tokens for verified family connections

## 📊 Token Specifications

| Property | Value |
|----------|-------|
| **Name** | Legatia Token |
| **Symbol** | LGT |
| **Decimals** | 8 |
| **Standard** | ICRC-1 |
| **Network** | Internet Computer Protocol (ICP) |
| **Initial Supply** | 10,000,000,000 LGT |

## 🚀 Getting Started

### Prerequisites
- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) installed
- Rust toolchain with `wasm32-unknown-unknown` target
- Internet Computer wallet (Plug, Internet Identity, etc.)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd Legatia_token
```

2. **Start local replica**
```bash
dfx start --background
```

3. **Deploy the token**
```bash
dfx deploy legatia_token --argument '(record {
  name = "Legatia Token";
  symbol = "LGT";
  decimals = 8;
  total_supply = 10000000000000000;
  fee = 1000;
  minting_account = record {
    owner = principal "<your-principal>";
    subaccount = null;
  };
  initial_balances = vec {};
})'
```

### Testing

Run the comprehensive test suite:
```bash
cargo test
```

Our test suite covers:
- ✅ Token initialization and metadata
- ✅ Balance queries and transfers
- ✅ Minting and burning operations
- ✅ Reward system functionality
- ✅ Error handling and edge cases
- ✅ Storage persistence

## 🔧 API Reference

### ICRC-1 Standard Methods

```rust
// Query Methods
icrc1_name() -> String
icrc1_symbol() -> String
icrc1_decimals() -> u8
icrc1_fee() -> u128
icrc1_total_supply() -> u128
icrc1_balance_of(BalanceArgs) -> u128
icrc1_metadata() -> Vec<MetadataEntry>
icrc1_minting_account() -> Option<Account>
icrc1_supported_standards() -> Vec<SupportedStandard>

// Update Methods
icrc1_transfer(TransferArgs) -> TransferResult
```

### Administrative Methods

```rust
// Minting and burning (restricted access)
mint(to: Account, amount: u128) -> TransferResult
burn(from: Account, amount: u128) -> TransferResult
set_fee(new_fee: u128) -> ()
```

### Legatia-Specific Methods

```rust
// Reward system
reward_user(user: Account, amount: u128, reason: String) -> TransferResult
get_reward_stats(user: Account) -> RewardStats
```

## 💡 Use Cases

### 🏆 Gamified Family Tree Building
- **Profile Completion**: 500 LGT for completing basic profile
- **First Connection**: 1,000 LGT for adding first family member
- **Generation Milestones**: 2,500 LGT for each complete generation
- **Verification Rewards**: 5,000 LGT for document-verified connections

### 🛡️ Token-Gated Features
- **Premium Profiles**: Enhanced features for token holders
- **Advanced Search**: Extended family search capabilities
- **Priority Support**: Faster customer service for token holders
- **Exclusive Events**: Token-required access to genealogy webinars

### 🤝 Community Participation
- **Family Invitations**: Rewards for successful family member invitations
- **Tree Validation**: Earn tokens for verifying other users' family trees
- **Community Support**: Tokens for helping users with genealogy questions
- **Content Creation**: Rewards for sharing family stories and photos

### 💼 Marketplace Integration
- **Research Services**: Pay genealogists with LGT
- **Document Access**: Token-based access to historical records
- **DNA Analysis**: LGT payments for genetic testing services
- **Heritage Travel**: Book ancestry tours with tokens

## 🔒 Security & Architecture

### Secure Design
- **Stable Memory**: All data persists across canister upgrades
- **Access Control**: Role-based permissions for administrative functions
- **Transaction Logging**: Complete audit trail of all token movements
- **Error Handling**: Comprehensive error types and validation

### Smart Contract Security
- **Overflow Protection**: Safe arithmetic operations throughout
- **Input Validation**: Rigorous parameter checking
- **State Consistency**: Atomic operations for balance updates
- **Upgrade Safety**: Seamless canister upgrades without data loss

## 📈 Tokenomics

### Distribution Strategy
- **Community Rewards**: 40% allocated for user activity rewards
- **Platform Development**: 25% for ongoing development and operations
- **Ecosystem Growth**: 20% for partnerships and integrations
- **Team & Advisors**: 10% with vesting schedule
- **Treasury Reserve**: 5% for emergency situations

### Reward Categories

| Activity | Reward Amount | Description |
|----------|---------------|-------------|
| Profile Setup | 500 LGT | Complete basic profile information |
| First Connection | 1,000 LGT | Add first family member |
| Invite Success | 750 LGT | Successful family member invitation |
| Document Verification | 2,500 LGT | Verify connection with documents |
| DNA Verification | 5,000 LGT | Verify connection with DNA results |
| Generation Complete | 3,000 LGT | Complete entire generation |
| Tree Validation | 1,500 LGT | Help validate other users' trees |

## 🛣️ Roadmap

### Phase 1: Foundation (Completed ✅)
- [x] ICRC-1 compliant token implementation
- [x] Reward system development
- [x] Comprehensive testing suite
- [x] Basic administrative functions

### Phase 2: Integration (In Progress 🔄)
- [ ] Frontend wallet integration
- [ ] Legatia platform integration
- [ ] Automated reward triggers
- [ ] User dashboard for token management

### Phase 3: Ecosystem (Planned 📅)
- [ ] DEX listing and liquidity provision
- [ ] Staking and governance features
- [ ] Cross-platform partnerships
- [ ] Advanced DeFi integrations

### Phase 4: Scale (Future 🚀)
- [ ] Multi-chain bridge development
- [ ] Enterprise genealogy solutions
- [ ] NFT integration for family artifacts
- [ ] Global genealogy marketplace

## 🤝 Contributing

We welcome contributions to the Legatia Token project! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Legatia Platform**: [legatia.family](https://legatia.family)
- **Documentation**: [docs.legatia.family](https://docs.legatia.family)
- **Community Discord**: [discord.gg/legatia](https://discord.gg/legatia)
- **Twitter**: [@LegatiaFamily](https://twitter.com/LegatiaFamily)

## 📞 Support

- **Technical Issues**: Create an issue in this repository
- **General Questions**: Join our Discord community
- **Security Concerns**: Email security@legatia.family
- **Business Inquiries**: Email partnerships@legatia.family

---

**Built with ❤️ for families worldwide on the Internet Computer Protocol**

*Connecting families, preserving heritage, building the future of genealogy.*