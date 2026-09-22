# Nexora Games — frontend foundation

This build follows the requested 4-section structure: Home, Invest, Referral and Assets. Home contains Lucky Jet, Mines and Coin Flip.

Important production rule: this frontend does not invent balances, winners, game outcomes, investment returns, deposits or withdrawals. Those values must come from the authenticated backend and central ledger.

## Telegram authentication
The browser sends Telegram Mini App `initData` in `X-Telegram-Init-Data`. The backend must validate the Telegram data server-side before creating/loading the user account.

## Expected API surface
- `GET /api/me`
- `GET /api/games/winners?limit=20`
- `GET /api/games/luckyjet/state`
- `POST /api/games/luckyjet/bets`
- `GET /api/games/mines/state`
- `POST /api/games/mines/rounds`
- `GET /api/games/coinflip/state`
- `POST /api/games/coinflip/bets`
- `POST /api/investments`

## User account fields
Telegram ID, Telegram username, NGN balance, USDT balance, deposits, withdrawals, game transactions, investment transactions, referral commissions.

## Central ledger requirement
The backend/database is authoritative. Every monetary event must create a ledger entry and update wallet/account aggregates transactionally. The client must never be able to set a balance or declare a win.

## Lucky Jet
There is intentionally no DEMO label. The Lucky Jet UI is a production game surface whose round state, multiplier, bets, cash-outs and settlement must be supplied and validated by the backend/game engine. Do not use client-side random numbers as the source of truth.
