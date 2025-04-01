README.md

# Zombies: GG Data Center Outbreak

A web-based multiplayer zombies game inspired by *Call of Duty: World at War*'s *Nacht der Untoten*, set in a GG Data Center.

## Structure
- `/client`: Next.js app for the game client.
- `/server`: WebSocket server for multiplayer sync.

## Setup
1. **Install Dependencies**:
   - Client: `cd client && npm install`
   - Server: `cd server && npm install`

2. **Add Assets**:
   - Place `background.png` (800x600), `player.png` (64x64), and `zombie.png` (64x64) in `/client/public/assets/`.

3. **Run Locally**:
   - Server: `cd server && npm run dev`
   - Client: `cd client && npm run dev`
   - Open `http://localhost:3000` in multiple tabs.

4. **Deploy**:
   - **Client (Vercel)**:
     - Push to GitHub, import to Vercel.
     - Set `NEXT_PUBLIC_WS_URL` env var (e.g., `wss://zombies-gg-server.herokuapp.com`).
   - **Server (Heroku)**:
     - Add `Procfile`: `web: npm start`
     - Deploy: `heroku create zombies-gg-server && git push heroku main`

## Debugging
- Logs: Check `client-error.log` and `server-error.log`.
- In-game: See "Debug" text for connection status and player/zombie counts.


CUNT IS GOOD
FUCK A BITCH STAY FINANCIALLY FREE
