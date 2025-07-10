legatia/
├── README.md
├── .gitignore
├── frontend/                    # React d-webapp
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Logo, icons, static images
│   │   ├── components/          # Reusable UI components (e.g., PersonCard, TreeViewer)
│   │   ├── pages/               # Page-level views (Home, Dashboard, TreeView)
│   │   ├── services/            # Canister agent, auth, utils
│   │   ├── types/               # Shared TypeScript types (mirrors backend)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts           # or webpack.config.js
│   └── package.json
│
├── backend/                     # Python CDK canister
│   ├── src/
│   │   ├── legatia_backend/
│   │   │   ├── __init__.py
│   │   │   ├── main.py          # Canister logic (add_person, get_tree, etc.)
│   │   │   └── models.py        # Person, FamilyTree, etc.
│   │   └── legatia_backend.did  # Candid interface
│   └── requirements.txt
│
├── candid/                      # Shared generated TypeScript bindings
│   └── legatia_backend.did.js
│
├── dfx.json                     # Canister + deployment config
├── tsconfig.json
├── package.json
└── scripts/
    ├── deploy.sh                # Local dev deploy script
    └── build.sh                 # Optional build script
