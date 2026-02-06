# Daily Agenda Stars

Daily Agenda Stars is a kid-friendly routine app with separate **Kid Mode** and **Parent Mode**.

## How it supports responsibility + parental control

- **Kid Mode is simple and safe**: children can only mark tasks done.
- **Parent Mode is protected by a PIN** so only adults can manage tasks, times, rewards, and security settings.
- **Task reminders use real browser notifications** at scheduled times, and each reminder is shown once per task per day.
- **Stars and streaks encourage consistency**:
  - Every completed task gives 1 star.
  - Completing all tasks in a day raises the daily streak.
  - Completing at least 5 successful days in a week raises the weekly streak.
- **Milestone rewards are achievement based**:
  - Parents set rewards for 10, 20, 30 stars, etc.
  - Rewards unlock automatically when a milestone is reached.
  - Stars are never spent for rewards (they remain lifetime progress).
  - Kids cannot set or edit rewards.
- **Celebration banners** appear when streaks increase or rewards unlock.
- **Progress is stored in localStorage** so data persists across app restarts.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Default parent PIN

- `1234`
