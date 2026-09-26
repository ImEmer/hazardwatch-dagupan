# HazardWatch Architecture and Data-Flow Diagrams

## System architecture

```mermaid
flowchart LR
  Browser[Browser\nReact SPA] -->|HTTPS / JSON / multipart| Vercel[Vercel\nFrontend hosting]
  Vercel -->|API requests| Render[Render\nExpress API]
  Render --> Mongo[(MongoDB Atlas)]
  Render --> Cloudinary[Cloudinary\nReport images]
  Browser -->|Map tiles| OSM[OpenStreetMap tiles]
  Browser -->|Reverse geocoding| Nominatim[Nominatim API]
```

The browser loads the React/Vite SPA from Vercel. Axios sends authenticated JSON or multipart requests to the Express API on Render. The API persists data in MongoDB Atlas and stores report images in Cloudinary. MapLibre loads OpenStreetMap tiles and the browser calls Nominatim for reverse geocoding.

## DFD Level 0: Context

```mermaid
flowchart LR
  Citizen[Citizen] -->|registration, login, report, contact| HW((HazardWatch))
  Staff[Admin / Staff / Barangay] -->|review, assign, update, statistics| HW
  HW -->|status| Citizen
  HW -->|notifications, activity, operational views| Staff
  HW <-->|data persistence| DB[(MongoDB Atlas)]
  HW -->|image storage| Media[Cloudinary]
  Citizen <-->|map tiles/geocoding| Maps[OpenStreetMap/Nominatim]
```

## DFD Level 1: Main processes

```mermaid
flowchart TB
  User[Users] --> Auth[1. Authentication]
  User --> Reports[2. Report processing]
  Admin[Administrators] --> Users[3. User administration]
  Staff[Staff and barangay] --> Stats[4. Statistics]
  Staff --> Activity[5. Activity and notifications]
  Auth --> DB[(MongoDB)]
  Reports --> DB
  Users --> DB
  Stats --> DB
  Activity --> DB
  Reports --> Media[Cloudinary]
```

## DFD Level 2: Login flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as Express auth API
  participant U as User collection
  participant L as Lockout map
  B->>A: POST /auth/login
  A->>L: Check IP + normalized email
  A->>U: Find user and bcrypt compare
  alt Invalid credentials
    A->>L: Record failed attempt
    A-->>B: 401 or 429
  else Valid credentials
    A->>U: Update lastLogin
    A-->>B: JWT + public user
    B->>B: Persist session and schedule expiry warning
  end
```

## DFD Level 2: Report submission flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant M as Map/Nominatim
  participant A as Express report API
  participant C as Cloudinary
  participant R as Report collection
  B->>M: Select coordinates and reverse geocode
  B->>A: POST /reports multipart FormData
  A->>A: Authenticate and validate category, photo, location, barangay
  A->>C: Upload up to three images
  A->>R: Store report and reporter snapshot
  A-->>B: 201 report
  B->>B: Refresh public/staff report state
```

## Evidence and export notes

The Mermaid source above is the editable diagram source. PNG exports should be generated from the Mermaid blocks using Mermaid CLI, Draw.io, or another approved diagram editor and stored as:

- `docs/architecture-diagram.png`
- `docs/dfd-level-0.png`
- `docs/dfd-level-1.png`
- `docs/dfd-level-2.png`

The repository currently documents the diagrams in editable Markdown; PNG evidence must be generated in the authorized workstation/tooling environment.
