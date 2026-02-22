# Conformitas

AI-assisted construction permitting planner that finds relevant regulations, ranks permits by review time, and organizes required submission information.

## How to Run

1. Add to `.env`: `EXA_API_KEY=your_key_here`
2. Build: `yarn build`
3. Start locally: `yarn dev`
4. Open: [http://localhost:3000](http://localhost:3000)

## Technology

Next.js + TypeScript + Mantine + tRPC + Exa TypeScript SDK.

## Flow Model

Frontend (pages/components) -> tRPC routes -> `ComplianceAgent` -> `ExaCompliance` service -> Exa SDK actions (`search`, `answer`, `findSimilar`).
