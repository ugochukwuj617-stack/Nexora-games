# Nexora Games frontend
Paste these three files into the GitHub repository:
- index.html
- style.css
- app.js

This frontend is prepared for the real Telegram Mini App architecture.
It does NOT invent balances, winners, payouts, deposits, withdrawals, investments, commissions, KYC or 2FA. Those must be returned by the secure backend.

Set API_BASE in app.js to the HTTPS backend when it is deployed.
Telegram initData is sent to the backend and must be validated server-side.

Planned backend routes:
GET /api/wallet
GET /api/referrals
GET /api/me
GET /api/home/winners
GET /api/transactions
and secure POST routes for investments, deposits, withdrawals and game actions.
