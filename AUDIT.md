# Audit of tejanarayana05/Vseva

**Source:** https://github.com/tejanarayana05/Vseva  
**Commit reviewed:** `ca0eb43` (Merge remote repository)  
**What it is:** A vehicle-passport demo over *synthetic* Parivahan-like records. FastAPI backend, SvelteKit + Tailwind frontend, optional MongoDB (in-memory fallback), optional SpaceXAI for Q&A.

This is a strong product prototype with real privacy *intent*. Several of the issues below are expected in a hackathon demo. They become serious if the same patterns ship against live citizens or VAHAN.

---

## What is already done well

- Owner vs public projections live in `privacy.py`, not only in CSS. Authz tests (`backend/tests/test_authz.py`) check that owner names stay out of public JSON.
- Documents and driving history are gated (401/403) on the main passport APIs.
- Trust Pass is a snapshot with revoke/expire status codes.
- Complaints are labelled as allegations, not violations. Status is named, not a numeric “trust score.”
- AI is instructed to answer only from stored records, with a deterministic fallback when `XAI_API_KEY` is missing.
- Demo data is clearly labelled synthetic.

---

## Critical (do not ship as-is against real people)

### 1. Public APIs expose chassis and engine numbers

`privacy.py` puts `chassis_number` and `engine_number` in `PUBLIC_IDENTITY_KEYS`. Unauthenticated `GET /api/search`, `GET /api/vehicles/{id}`, catalog, and related routes return full identity marks.

In India those identifiers are routinely used as “proof you have the RC.” Publishing them on a public lookup undermines the “privacy by default” claim even if owner name is stripped.

**Fix:** Mask to last 4–5 characters on public views; reveal full values only to the authenticated owner or a Trust Pass section they opted into.

### 2. Demo credentials and OTP are public API responses

- `GET /api/auth/demo` returns `DEMO_PASSWORD` (`vseva123`) and every demo email.
- `GET /api/service/auth/demo` also returns `otp: "123456"` and mobile numbers.
- `request_otp` returns `demo_otp` in the JSON body.

Fine for a local hackathon. Fatal if this process is pointed at a shared or production host: anyone can log in as every seeded owner *and* the authority account (`rto@vseva.in`).

**Fix:** Serve demo hints only in README / UI copy behind a `DEMO=1` flag. Never return passwords or OTPs from the API in any non-local environment.

### 3. Hardcoded JWT secret and a global password salt

```text
JWT_SECRET = os.getenv("VSEVA_SECRET", "vseva-hackathon-demo-secret")
SALT = b"vseva-demo-salt"   # same salt for every user
```

Anyone who clones the repo can mint valid session tokens for `sub=usr_priya` (or `usr_authority`) without knowing the password. Tokens last 48 hours. There is no revocation list (`jti`).

PBKDF2 with a shared static salt means one rainbow table works for every account.

**Fix:** Require `VSEVA_SECRET` in non-dev. Per-user random salts. Standard JWT (iss/aud/jti) and logout/revocation.

### 4. Unauthenticated writes to vehicle records

These mutate the shared vehicle document with **no login**:

| Route | Effect |
| --- | --- |
| `POST /api/complaints` | Appends a complaint, a case, and a timeline event |
| `POST /api/vehicles/{vid}/report` | Same |

Any internet client can spam “stolen / incident” cases onto flagship plates and poison the passport that buyers see.

`POST /api/vehicles/{vid}/corrections` only requires *some* logged-in user, not the owner. Combined with `/api/auth/demo`, that is everyone.

**Fix:** Rate-limit + CAPTCHA even in demo. Require auth. Do not attach citizen reports to the canonical case list until an authority accepts them.

### 5. MongoDB published with no auth

`docker-compose.yml` publishes `27017:27017` with no username/password. Default `MONGO_URI` is `mongodb://127.0.0.1:27017`. On a cloud VM that is a world-readable database of users, shares, sales, and applications.

**Fix:** Bind to localhost, require auth, never publish 27017.

---

## High

### 6. CORS is `allow_origins=["*"]` with `allow_credentials=True`

That combination is invalid CORS and a foot-gun. Tokens live in `localStorage` (`vseva.token`). Any XSS on the origin, or a malicious page that obtains the token, can call the API from any origin because the browser will send a custom `Authorization` header on a CORS request that the server allows.

**Fix:** Explicit origin list. Prefer httpOnly cookies + CSRF for a browser app, or keep Bearer tokens but lock origins and set a tight CSP.

### 7. Passport / sale uploads have no size or type checks

Service-portal uploads call `check_upload` (8 MB, pdf/jpg/png). Passport routes do **not**:

- `POST /api/vehicles/{vid}/documents`
- `POST /api/vehicles/{vid}/actions/{action_id}`
- `POST /api/vehicles/{vid}/corrections`

They `await file.read()` into memory with no cap. One large POST is a denial-of-service. MIME is stored, not validated.

### 8. Claiming a vehicle is “registration + last 5 of chassis”

`link_vehicle` grants `vehicle_ids` (full owner rights: documents, share, sale, actions) if the last five chassis characters match **and** no other demo user already owns it.

Those five characters are on the public identity payload today, so the check is circular.

Even with masking, last-5 is a weak authenticator.

### 9. Sale links are unauthenticated and enumerable by id

`GET /api/sales/{sid}` and `GET /api/sale/{token}` do not require a session. Anyone with the sale id or token gets `vehicle_preview` (including whatever sections the seller selected) and document titles.

`POST /api/sales/{sid}/accept` lets **any** signed-in user become the buyer. There is no invite, email match, or one-time buyer token.

`can_complete` then lets the seller flip ownership on the passport (explicitly not VAHAN, but it is the product’s source of truth).

### 10. Authority role is a string on the user row

`role == "authority"` plus the public demo password yields `GET/POST /api/authority/cases...` including `decide`. There is no separate IdP, MFA, or IP allow-list.

### 11. LLM path is prompt-injection shaped

`POST /api/ask` concatenates user `question` + optional `context` + `record_card(vehicle)` into one user message. `grounded: True` is set even when the model answers. There is no output check against the record card.

Public callers can ask about any plate. If `XAI_API_KEY` is set in production, that is unmetered model spend plus possible leakage of whatever landed in `record_card` (conflicts, open cases, financier).

---

## Medium (correctness, integrity, scale)

### 12. Runtime bug: `describe_action` will 500

`GET /api/vehicles/{vid}/actions/{action_id}` calls `vehicle_status(v)` but `vehicle_status` is never imported in `main.py`. The frontend “next action” detail page can fail.

### 13. Frozen clock and silent store fallback

`TODAY` / `TODAY_ISO` is hard-coded to **2026-08-24**. PUC “expires in 7 days” is a story beat, not wall-clock. Expiry of Trust Passes uses that string, not `datetime.utcnow()`.

If Mongo is down, `db.connect()` silently switches to **process-local memory**. Two uvicorn workers, or a restart, disagree about truth. `GET /api/health` exposes `"store": "memory"` but clients do not fail closed.

Mongo `find` is capped at **500** documents. There are no indexes; almost every handler does `find({})` and filters in Python (`vehicle_by_reg`, case lookup, complaint id allocation).

### 14. Lost-update races

Vehicle, user, sale, and application updates are read → mutate dict → `replace_one` of the whole document. Concurrent PUC upload + complaint + authority decide will drop one writer’s fields.

OTP rows are inserted but never deleted; verification scans all OTPs for the user.

### 15. Custom “JWT”

`sign_token` is `base64(json).hex_hmac`. Payload is readable without verification (fine if you treat it as signed, but easy to misuse). No standard libraries, no `kid` rotation.

### 16. Inconsistent auth on “owner-ish” reads

| Endpoint | Auth |
| --- | --- |
| Documents | 401/403 |
| Driving | 403 unless self |
| `GET /api/vehicles` | **Public list of the whole fleet** (ledger rows) |
| Timeline / evidence / risk / diligence / mileage / fields | Public |
| `GET /api/complaints/{cid}` | Public, full description |
| `GET /api/cases/{cid}` | Public (owner-enriched if you happen to be logged in) |

Public evidence and field APIs may re-expose identity conflicts that include workshop document text. Worth a red-team pass with the privacy test corpus expanded beyond owner *names*.

### 17. No CI, no lock on Python, Windows-first DX

No `.github/workflows`. Tests are runnable as scripts but `pytest` is not in `requirements.txt`. README/`start.ps1` assume Windows (`py -3.12`). Frontend pins via `package-lock.json`; backend does pin versions, which is good.

Vite proxy is only for local `:8000`. There is no production API base URL / env for a split deploy.

### 18. Product honesty vs UI

Document “extraction” copies fields from the stored vehicle unless the filename contains `AUC` / `NOC` / `PUC` / … . Completing “Renew PUC” by uploading any file named like PUC will flip status. That is documented, but a buyer of a Trust Pass cannot tell user-uploaded evidence from a government source except by `kind`/`source` chips — easy to miss.

---

## Suggested order of work

1. Mask chassis/engine on public payloads; expand `test_authz.py` to fail if they appear in full.
2. Stop returning passwords/OTP from APIs; rotate the default JWT secret out of the repo.
3. Require auth (and rate limits) on complaint/report/correction.
4. Apply `check_upload` to every `UploadFile` path; cap body size at the ASGI layer.
5. Fix the `vehicle_status` import.
6. Lock CORS, Mongo, and `DEMO` mode behind environment.
7. Stop `find({})` scans; add unique indexes on `vehicles.identity.registration_number`, `users.email`, `shares.token`.
8. Treat sale accept as “token + signed-in user bound at create time,” not first-come.

Until those land, treat the repo as a **local demo only**. Do not put a public URL in front of it with real-looking plates, and do not enable `XAI_API_KEY` on an open network.
