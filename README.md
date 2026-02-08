# Daily Agenda Stars

Daily Agenda Stars is a kid-friendly routine app with separate **Kid Mode** and **Parent Mode**.

## What changed

- **Kid/Parent accounts**: kids must create an in-app kid account before using the app. Parents can sign up with email/password or a Google-account demo flow.

The app now has two separate systems:

1. **Daily Agenda (repeating kid routine tasks)**
2. **Parent Calendar (one-time events/reminders, like calendar apps)**

## How it supports responsibility + parental control

- **Kid Mode is simple and safe**: kids can only mark Daily Agenda tasks done.
- **Parent Mode is PIN protected**: only adults can add/edit daily tasks, calendar events, rewards, and PIN.
- **Daily Agenda reminders**: repeating daily reminders for routine tasks.
- **Calendar reminders (separate)**: one-time dated reminders for events like Soccer Practice, Meeting, Biking, Playdate, etc.
- **Color + emoji categories**: both Daily Agenda tasks and Calendar events use bright category badges (for example 🌞 Morning Routine, ⚽ Soccer Practice, 🍽️ Eating Outside) for faster visual scanning.
- **Calendar day timeline**: clicking a date shows a timeline from 12:00 AM (top) to 12:00 PM (bottom), shown as stretchable-duration bubbles (for example, 6:30 AM–8:00 AM). Overlapping events display side-by-side (e.g., Practice beside Eating Outside).
- **Stars & streaks**:
  - 1 star per completed Daily Agenda task.
  - Daily streak increases when all daily tasks are finished.
  - Weekly streak increases for consistent completion across the week.
- **Milestone rewards**:
  - Parents set rewards at 10, 20, 30 stars.
  - Rewards auto-unlock at milestones.
  - Stars are never spent.
- **Celebration feedback** appears for streak growth and reward unlocks.
- **Progress persists** in localStorage.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Default parent PIN

- `1234`
