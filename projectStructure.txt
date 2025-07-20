legatia/
├── frontend/
│   ├── public/                       # Static assets (icons, images, fonts)
│   ├── src/
│   │   ├── assets/                  # Profile images, illustrations, etc.
│   │   ├── components/              # Reusable UI components (Card, Button, Form, etc.)
│   │   ├── pages/                   # Route-level components (e.g., Home, Profile, Family)
│   │   ├── features/
│   │   │   ├── auth/                # Internet Identity login / session
│   │   │   ├── profile/             # Profile creation & editing
│   │   │   ├── family/              # Family tree views, admin functions
│   │   │   ├── relationships/       # Relationship linking + invite logic
│   │   │   ├── invites/             # One-time invitation code system
│   │   ├── services/                # Canister API integration (Candid interfaces)
│   │   ├── types/                   # Global TypeScript types (Profile, Family, etc.)
│   │   ├── utils/                   # Formatters, validators, etc.
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── canisters/
│   │   ├── profiles/
│   │   │   └── main.py              # CRUD logic for user profiles
│   │   ├── families/
│   │   │   └── main.py              # Family creation, admin logic, member listing
│   │   ├── relationships/
│   │   │   └── main.py              # Relationship linking, validation, confirmation
│   │   ├── invites/
│   │   │   └── main.py              # One-time invite code generation & claim flow
│   │   └── __init__.py
│   ├── candid/
│   │   ├── profiles.did
│   │   ├── families.did
│   │   ├── relationships.did
│   │   └── invites.did
│   └── requirements.txt             # For Python CDK dependencies
│
├── docs/
│   ├── architecture.md              # High-level structure
│   ├── data-model.md                # Profiles, families, relationships schema
│   └── roadmap.md                   # Milestones and deliverables
│
├── tests/
│   ├── frontend/                    # Cypress / React Testing Library
│   └── backend/                     # Pytest or other CDK-compatible tests
│
├── dfx.json                         # ICP project config
├── README.md
└── LICENSE
