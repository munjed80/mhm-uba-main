# FancyFoods Manager

Desktop Electron application for managing Fancy Foods wholesale operations. Runs locally on Windows and macOS with SQLite storage.

## Getting started
1. Install dependencies:
```bash
cd fancyfoods-app
npm install
```
2. Start the app in development:
```bash
npm start
```
3. Build installers (Windows EXE, macOS DMG, Linux AppImage):
```bash
npm run build
```

## Features
- Products, Clients, Broker Deals, Orders, Email Writer and Workflow modules.
- SQLite database stored at `database/fancyfoods.db`.
- Attachments saved under `attachments/{deal_id}`; emails stored in `emails/`.
- Backup system exporting database, attachments and emails to `backup/fancyfoods-backup-{date}.zip`.
- Import backup to restore data.

## Notes
- SMTP sending uses Hotmail/Outlook credentials via `nodemailer` and only requires internet when sending.
- UI uses Bootstrap locally (no CDN).
