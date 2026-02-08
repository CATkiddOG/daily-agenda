const STORAGE_KEY = "dailyAgendaData";
const todayKey = () => new Date().toISOString().slice(0, 10);

const DAILY_CATEGORY_META = {
  morning: { label: "🌞 Morning Routine", className: "cat-morning" },
  school: { label: "🏫 School Prep", className: "cat-school" },
  health: { label: "🪥 Health & Hygiene", className: "cat-health" },
  chores: { label: "🧹 Chores", className: "cat-chores" },
  homework: { label: "📚 Homework", className: "cat-homework" },
  play: { label: "⚽ Play & Exercise", className: "cat-play" },
  bedtime: { label: "🌙 Bedtime", className: "cat-bedtime" }
};

const CALENDAR_CATEGORY_META = {
  soccer: { label: "⚽ Soccer Practice", className: "cal-soccer" },
  meeting: { label: "🗓️ Meeting", className: "cal-meeting" },
  biking: { label: "🚴 Biking", className: "cal-biking" },
  playdate: { label: "🧸 Playdate", className: "cal-playdate" },
  music: { label: "🎵 Music Lesson", className: "cal-music" },
  homework: { label: "📘 Homework Club", className: "cal-homework" },
  food: { label: "🍽️ Eating Outside", className: "cal-food" },
  other: { label: "✨ Other", className: "cal-other" }
};


function getWeekKey(date = new Date()) {
  const first = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - first) / 86400000);
  return `${date.getFullYear()}-W${Math.ceil((days + first.getDay() + 1) / 7)}`;
}

const defaultData = {
  mode: "kid",
  parentPin: "1234",
  stars: 0,
  dailyStreak: 0,
  weeklyStreak: 0,
  tasks: [],
  calendarEvents: [],
  rewards: {},
  unlockedRewards: [],
  completionByDay: {},
  weekCompletion: {},
  shownNotifications: {},
  streakAudit: { lastDayChecked: null, lastWeekChecked: null },
  users: [],
  currentUserId: null
};

let data = load();
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let notificationTimers = [];

const els = {
  modeBadge: document.getElementById("modeBadge"),
  openParentBtn: document.getElementById("openParentBtn"),
  exitParentBtn: document.getElementById("exitParentBtn"),
  userBadge: document.getElementById("userBadge"),
  logoutBtn: document.getElementById("logoutBtn"),
  appShell: document.querySelector(".app-shell"),
  authScreen: document.getElementById("authScreen"),
  kidSignupForm: document.getElementById("kidSignupForm"),
  parentEmailSignupForm: document.getElementById("parentEmailSignupForm"),
  googleSignupBtn: document.getElementById("googleSignupBtn"),
  loginForm: document.getElementById("loginForm"),
  googleLoginBtn: document.getElementById("googleLoginBtn"),
  authMessage: document.getElementById("authMessage"),
  kidName: document.getElementById("kidName"),
  kidUsername: document.getElementById("kidUsername"),
  kidPassword: document.getElementById("kidPassword"),
  parentName: document.getElementById("parentName"),
  parentEmail: document.getElementById("parentEmail"),
  parentPassword: document.getElementById("parentPassword"),
  parentPinSetup: document.getElementById("parentPinSetup"),
  loginId: document.getElementById("loginId"),
  loginPassword: document.getElementById("loginPassword"),
  parentPanel: document.getElementById("parentPanel"),
  calendarPanel: document.getElementById("calendarPanel"),
  pinSettings: document.getElementById("pinSettings"),
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  starCount: document.getElementById("starCount"),
  dailyStreak: document.getElementById("dailyStreak"),
  weeklyStreak: document.getElementById("weeklyStreak"),
  nextReward: document.getElementById("nextReward"),
  rewardList: document.getElementById("rewardList"),
  celebration: document.getElementById("celebration"),
  taskForm: document.getElementById("taskForm"),
  taskName: document.getElementById("taskName"),
  taskTime: document.getElementById("taskTime"),
  taskCategory: document.getElementById("taskCategory"),
  rewardText: document.getElementById("rewardText"),
  calendarEventForm: document.getElementById("calendarEventForm"),
  eventTitle: document.getElementById("eventTitle"),
  eventCategory: document.getElementById("eventCategory"),
  eventDate: document.getElementById("eventDate"),
  eventTime: document.getElementById("eventTime"),
  eventEndTime: document.getElementById("eventEndTime"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  calendarDayDetails: document.getElementById("calendarDayDetails"),
  pinDialog: document.getElementById("pinDialog"),
  pinForm: document.getElementById("pinForm"),
  pinInput: document.getElementById("pinInput"),
  pinError: document.getElementById("pinError"),
  pinChangeForm: document.getElementById("pinChangeForm"),
  newPin: document.getElementById("newPin")
};

boot();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...defaultData, ...saved } : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function normalizeTaskCategories() {
  data.tasks = data.tasks.map((task) => ({ ...task, category: task.category || "morning" }));
  save();
}

function normalizeCalendarEvents() {
  data.calendarEvents = data.calendarEvents.map((event) => {
    if (event.endTime) return event;
    const start = timeToMinutes(event.time);
    const end = Math.min(start + 60, 24 * 60);
    const endHours = String(Math.floor(end / 60)).padStart(2, "0");
    const endMinutes = String(end % 60).padStart(2, "0");
    return { ...event, endTime: `${endHours}:${endMinutes}` };
  });
  save();
}

function formatClock(time) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}


function currentUser() {
  return data.users.find((user) => user.id === data.currentUserId) || null;
}

function showAuthMessage(message, isError = false) {
  els.authMessage.textContent = message;
  els.authMessage.classList.toggle("error", isError);
}

function requireAuthRenderState() {
  const user = currentUser();
  const loggedIn = Boolean(user);
  els.authScreen.classList.toggle("hidden", loggedIn);
  els.logoutBtn.classList.toggle("hidden", !loggedIn);
  els.userBadge.textContent = loggedIn ? `Logged in: ${user.name} (${user.role})` : "";
  return user;
}

function createKidAccount() {
  const name = els.kidName.value.trim();
  const username = els.kidUsername.value.trim().toLowerCase();
  const password = els.kidPassword.value;
  if (!name || !username || !password) return showAuthMessage("Please fill in all kid fields.", true);
  if (data.users.some((u) => u.username === username)) return showAuthMessage("Username already exists.", true);
  const user = { id: crypto.randomUUID(), role: "kid", name, username, password };
  data.users.push(user);
  data.currentUserId = user.id;
  data.mode = "kid";
  save();
  els.kidSignupForm.reset();
  showAuthMessage("Kid account created and logged in.");
  render();
}

function createParentEmailAccount() {
  const name = els.parentName.value.trim();
  const email = els.parentEmail.value.trim().toLowerCase();
  const password = els.parentPassword.value;
  const pin = els.parentPinSetup.value.trim();
  if (!name || !email || !password || !/^\d{4,6}$/.test(pin)) return showAuthMessage("Parent sign-up needs valid email/password and 4-6 digit PIN.", true);
  if (data.users.some((u) => u.email === email)) return showAuthMessage("Email already exists.", true);
  const user = { id: crypto.randomUUID(), role: "parent", name, email, password, provider: "email", pin };
  data.users.push(user);
  data.currentUserId = user.id;
  data.parentPin = pin;
  data.mode = "parent";
  save();
  els.parentEmailSignupForm.reset();
  showAuthMessage("Parent email account created and logged in.");
  render();
}

function createParentGoogleAccount() {
  const email = prompt("Enter your Google email for demo sign-up:");
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  if (!/.+@.+\..+/.test(cleanEmail)) return showAuthMessage("Please enter a valid Google email.", true);
  if (data.users.some((u) => u.email === cleanEmail)) return showAuthMessage("That email already has an account.", true);
  const name = cleanEmail.split("@")[0];
  const pin = prompt("Set a 4-6 digit parent PIN:") || "";
  if (!/^\d{4,6}$/.test(pin.trim())) return showAuthMessage("PIN must be 4-6 digits.", true);
  const user = { id: crypto.randomUUID(), role: "parent", name, email: cleanEmail, password: "google-oauth", provider: "google", pin: pin.trim() };
  data.users.push(user);
  data.currentUserId = user.id;
  data.parentPin = pin.trim();
  data.mode = "parent";
  save();
  showAuthMessage("Parent Google account added and logged in.");
  render();
}

function loginAccount() {
  const id = els.loginId.value.trim().toLowerCase();
  const password = els.loginPassword.value;
  const user = data.users.find((u) => (u.username === id || u.email === id) && u.password === password);
  if (!user) return showAuthMessage("Login failed. Check username/email and password.", true);
  data.currentUserId = user.id;
  data.mode = user.role === "parent" ? "parent" : "kid";
  if (user.role === "parent" && user.pin) data.parentPin = user.pin;
  save();
  els.loginForm.reset();
  showAuthMessage("Logged in successfully.");
  render();
}


function loginGoogleAccount() {
  const email = prompt("Enter your Google email to log in:");
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  const user = data.users.find((u) => u.email === cleanEmail && u.provider === "google");
  if (!user) return showAuthMessage("No Google parent account found for that email.", true);
  data.currentUserId = user.id;
  data.parentPin = user.pin || data.parentPin;
  data.mode = "parent";
  save();
  showAuthMessage("Logged in with Google account.");
  render();
}

function boot() {
  normalizeTaskCategories();
  normalizeCalendarEvents();
  evaluateStreaks();
  bindEvents();
  render();
  requestNotificationPermission();
  scheduleNotifications();
}

function bindEvents() {
  els.openParentBtn.addEventListener("click", () => {
    els.pinInput.value = "";
    els.pinError.classList.add("hidden");
    els.pinDialog.showModal();
  });

  els.pinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = currentUser();
    if (!user || user.role !== "parent") return;
    if (els.pinInput.value === data.parentPin) {
      data.mode = "parent";
      save();
      els.pinDialog.close();
      render();
      return;
    }
    els.pinError.classList.remove("hidden");
  });

  els.exitParentBtn.addEventListener("click", () => {
    data.mode = "kid";
    save();
    render();
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.taskName.value.trim();
    const time = els.taskTime.value;
    const category = els.taskCategory.value;
    if (!name || !time) return;

    data.tasks.push({ id: crypto.randomUUID(), name, time, category, completedDays: [] });

    const nextMilestone = Math.ceil((data.stars + 1) / 10) * 10;
    const reward = els.rewardText.value.trim();
    if (reward && !data.rewards[nextMilestone]) data.rewards[nextMilestone] = reward;

    els.taskForm.reset();
    save();
    render();
    scheduleNotifications();
  });

  els.calendarEventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.eventTitle.value.trim();
    const category = els.eventCategory.value;
    const date = els.eventDate.value;
    const time = els.eventTime.value;
    const endTime = els.eventEndTime.value;
    if (!title || !date || !time || !endTime) return;
    if (timeToMinutes(endTime) <= timeToMinutes(time)) return;

    data.calendarEvents.push({ id: crypto.randomUUID(), title, category, date, time, endTime });
    els.calendarEventForm.reset();
    save();
    renderCalendar(date);
    scheduleNotifications();
    const categoryLabel = (CALENDAR_CATEGORY_META[category] || CALENDAR_CATEGORY_META.other).label;
    showCelebration(`📅 Added ${categoryLabel}: ${title}`);
  });

  els.prevMonthBtn.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  els.nextMonthBtn.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });


  els.kidSignupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createKidAccount();
  });

  els.parentEmailSignupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createParentEmailAccount();
  });

  els.googleSignupBtn.addEventListener("click", () => {
    createParentGoogleAccount();
  });

  els.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loginAccount();
  });

  els.googleLoginBtn.addEventListener("click", () => {
    loginGoogleAccount();
  });

  els.logoutBtn.addEventListener("click", () => {
    data.currentUserId = null;
    data.mode = "kid";
    save();
    render();
  });

  els.pinChangeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pin = els.newPin.value.trim();
    if (!/^\d{4,6}$/.test(pin)) return;
    data.parentPin = pin;
    const user = currentUser();
    if (user && user.role === "parent") user.pin = pin;
    els.newPin.value = "";
    save();
    showCelebration("🔒 Parent PIN updated.");
  });
}

function render() {
  const user = requireAuthRenderState();
  els.appShell.classList.toggle("auth-locked", !user);
  if (!user) {
    els.parentPanel.classList.add("hidden");
    els.calendarPanel.classList.add("hidden");
    els.pinSettings.classList.add("hidden");
    return;
  }

  const isParent = data.mode === "parent" && user.role === "parent";
  els.modeBadge.textContent = isParent ? "Parent Mode" : "Kid Mode";
  els.modeBadge.className = `badge ${isParent ? "parent" : "kid"}`;
  const canOpenParent = user.role === "parent";
  els.openParentBtn.classList.toggle("hidden", isParent || !canOpenParent);
  els.exitParentBtn.classList.toggle("hidden", !isParent || !canOpenParent);
  els.parentPanel.classList.toggle("hidden", !isParent);
  els.calendarPanel.classList.toggle("hidden", !isParent);
  els.pinSettings.classList.toggle("hidden", !isParent);

  els.starCount.textContent = String(data.stars);
  els.dailyStreak.textContent = String(data.dailyStreak);
  els.weeklyStreak.textContent = String(data.weeklyStreak);
  els.nextReward.textContent = `Next milestone: ${Math.ceil((data.stars + 1) / 10) * 10} stars`;

  renderTasks(isParent);
  renderRewards();
  if (isParent) renderCalendar();
}

function renderTasks(isParent) {
  const today = todayKey();
  els.taskList.innerHTML = "";

  if (!data.tasks.length) {
    els.emptyState.classList.remove("hidden");
    return;
  }
  els.emptyState.classList.add("hidden");

  for (const task of data.tasks.slice().sort((a, b) => a.time.localeCompare(b.time))) {
    const completed = task.completedDays.includes(today);
    const item = document.createElement("li");
    item.className = `task-item ${completed ? "completed" : ""}`;

    const left = document.createElement("div");
    left.className = "task-main";
    const taskMeta = DAILY_CATEGORY_META[task.category] || DAILY_CATEGORY_META.morning;
    left.innerHTML = `<span class="category-pill ${taskMeta.className}">${taskMeta.label}</span><strong>${task.name}</strong><span class="task-time">⏰ Daily at ${task.time}</span>`;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const user = currentUser();
    if (!isParent && user?.role === "kid") {
      const doneBtn = document.createElement("button");
      doneBtn.className = "secondary";
      doneBtn.textContent = completed ? "Done ✅" : "Mark done";
      doneBtn.disabled = completed;
      doneBtn.addEventListener("click", () => completeTask(task.id));
      actions.appendChild(doneBtn);
    } else {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        data.tasks = data.tasks.filter((t) => t.id !== task.id);
        save();
        render();
      });
      actions.appendChild(deleteBtn);
    }

    item.append(left, actions);
    els.taskList.appendChild(item);
  }
}

function renderRewards() {
  els.rewardList.innerHTML = "";
  const milestones = Object.keys(data.rewards).map(Number).sort((a, b) => a - b);
  if (!milestones.length) {
    const li = document.createElement("li");
    li.className = "reward-item";
    li.textContent = "Parent can set rewards for 10, 20, 30 stars...";
    els.rewardList.appendChild(li);
    return;
  }

  for (const m of milestones) {
    const unlocked = data.unlockedRewards.includes(m);
    const li = document.createElement("li");
    li.className = `reward-item ${unlocked ? "unlocked" : ""}`;
    li.innerHTML = `<span><strong>${m}⭐</strong> ${data.rewards[m]}</span><span>${unlocked ? "Unlocked 🎉" : "Locked"}</span>`;
    els.rewardList.appendChild(li);
  }
}

function renderCalendar(focusDate = todayKey()) {
  els.calendarMonthLabel.textContent = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  els.calendarGrid.innerHTML = "";

  for (const d of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
    const head = document.createElement("div");
    head.className = "calendar-weekday";
    head.textContent = d;
    els.calendarGrid.appendChild(head);
  }

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i += 1) {
    const blank = document.createElement("div");
    blank.className = "calendar-cell empty";
    els.calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = new Date(year, month, day).toISOString().slice(0, 10);
    const events = eventsForDate(dateKey);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    if (dateKey === todayKey()) cell.classList.add("today");
    if (events.length) cell.classList.add("has-event");
    if (events.length) {
      const meta = CALENDAR_CATEGORY_META[events[0].category] || CALENDAR_CATEGORY_META.other;
      cell.classList.add(meta.className);
    }

    cell.innerHTML = `<span class="day-number">${day}</span><span class="day-count">${events.length} events</span>`;
    cell.addEventListener("click", () => showCalendarDayDetails(dateKey));
    els.calendarGrid.appendChild(cell);
  }

  showCalendarDayDetails(focusDate);
}

function eventsForDate(dateKey) {
  return data.calendarEvents
    .filter((event) => event.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function formatTimelineTime(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${period}`;
}

function buildEventColumns(events) {
  const sorted = events
    .map((event) => ({ ...event, startMin: timeToMinutes(event.time), endMin: timeToMinutes(event.endTime) }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const activeUntil = [];
  let maxCols = 1;

  for (const event of sorted) {
    let column = activeUntil.findIndex((end) => end <= event.startMin);
    if (column === -1) {
      activeUntil.push(event.endMin);
      column = activeUntil.length - 1;
    } else {
      activeUntil[column] = event.endMin;
    }

    event.column = column;
    maxCols = Math.max(maxCols, activeUntil.length);
  }

  return { sorted, columnCount: maxCols };
}

function showCalendarDayDetails(dateKey) {
  const events = eventsForDate(dateKey);
  const prettyDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const startHour = 0;
  const endHour = 12;
  const totalMinutes = (endHour - startHour) * 60;
  const hourMarkers = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    const topPercent = ((hour - startHour) * 60 / totalMinutes) * 100;
    hourMarkers.push(`<div class="bubble-hour-line" style="top:${topPercent}%"><span>${formatTimelineTime(hour)}</span></div>`);
  }

  const dayWindowEvents = events.filter((event) => {
    const start = timeToMinutes(event.time);
    return start >= (startHour * 60) && start < (endHour * 60);
  });

  const { sorted, columnCount } = buildEventColumns(dayWindowEvents);
  const bubbles = sorted.map((event) => {
    const startMin = timeToMinutes(event.time) - (startHour * 60);
    const endMin = Math.min(timeToMinutes(event.endTime), endHour * 60) - (startHour * 60);
    const top = (startMin / totalMinutes) * 100;
    const height = Math.max(((endMin - startMin) / totalMinutes) * 100, 5);
    const left = (event.column / columnCount) * 100;
    const width = (100 / columnCount) - 1.5;

    return `
      <article class="timeline-bubble" style="top:${top}%;height:${height}%;left:${left}%;width:${width}%">
        <header><span class="category-pill ${(CALENDAR_CATEGORY_META[event.category] || CALENDAR_CATEGORY_META.other).className}">${(CALENDAR_CATEGORY_META[event.category] || CALENDAR_CATEGORY_META.other).label}</span></header>
        <strong>${event.title}</strong>
        <small>${formatClock(event.time)} - ${formatClock(event.endTime)}</small>
        <button class="secondary" data-event-id="${event.id}">Delete</button>
      </article>
    `;
  }).join("");

  els.calendarDayDetails.innerHTML = `
    <h3>${prettyDate}</h3>
    <p class="helper-text">Bubble timeline from 12:00 AM (top) to 12:00 PM (bottom). Overlapping events appear side-by-side.</p>
    <div class="bubble-timeline">
      ${hourMarkers.join("")}
      ${bubbles || '<p class="timeline-empty-state">No events in this time window.</p>'}
    </div>
  `;

  els.calendarDayDetails.querySelectorAll("button[data-event-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      data.calendarEvents = data.calendarEvents.filter((event) => event.id !== btn.dataset.eventId);
      save();
      renderCalendar(dateKey);
    });
  });
}

function completeTask(taskId) {
  const today = todayKey();
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task || task.completedDays.includes(today)) return;

  task.completedDays.push(today);
  data.stars += 1;

  const completedToday = data.tasks.every((t) => t.completedDays.includes(today));
  data.completionByDay[today] = completedToday;

  const week = getWeekKey(new Date(`${today}T00:00:00`));
  data.weekCompletion[week] ||= {};
  data.weekCompletion[week][today] = completedToday;

  if (completedToday && data.streakAudit.lastDayChecked !== today) {
    data.dailyStreak += 1;
    data.streakAudit.lastDayChecked = today;
    showCelebration("🔥 Daily streak increased!");
  }

  checkWeeklyStreak();
  unlockMilestones();
  save();
  render();
}

function evaluateStreaks() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (Object.keys(data.completionByDay).length && !data.completionByDay[yesterday]) {
    data.dailyStreak = 0;
  }
  checkWeeklyStreak();
  save();
}

function checkWeeklyStreak() {
  const week = getWeekKey();
  const doneMap = data.weekCompletion[week] || {};
  if (Object.values(doneMap).filter(Boolean).length >= 5 && data.streakAudit.lastWeekChecked !== week) {
    data.weeklyStreak += 1;
    data.streakAudit.lastWeekChecked = week;
    showCelebration("🏆 Weekly streak increased!");
  }
}

function unlockMilestones() {
  const milestone = Math.floor(data.stars / 10) * 10;
  if (milestone >= 10 && !data.unlockedRewards.includes(milestone) && data.rewards[milestone]) {
    data.unlockedRewards.push(milestone);
    showCelebration(`🎁 Reward unlocked: ${data.rewards[milestone]}`);
  }
}

function showCelebration(message) {
  els.celebration.textContent = message;
  els.celebration.classList.remove("hidden");
  setTimeout(() => els.celebration.classList.add("hidden"), 2500);
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
}

function scheduleNotifications() {
  for (const timer of notificationTimers) clearTimeout(timer);
  notificationTimers = [];
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  const today = todayKey();

  // Daily agenda task reminders (once per day per task)
  for (const task of data.tasks) {
    const [hh, mm] = task.time.split(":").map(Number);
    const trigger = new Date();
    trigger.setHours(hh, mm, 0, 0);
    if (trigger <= now) continue;

    const id = `task-${today}-${task.id}`;
    if (data.shownNotifications[id]) continue;

    notificationTimers.push(setTimeout(() => {
      new Notification("Daily Agenda Reminder", { body: `Time for: ${task.name}` });
      data.shownNotifications[id] = true;
      save();
    }, trigger.getTime() - now.getTime()));
  }

  // One-time calendar reminders
  for (const event of data.calendarEvents) {
    const trigger = new Date(`${event.date}T${event.time}:00`);
    if (trigger <= now) continue;

    const id = `event-${event.id}`;
    if (data.shownNotifications[id]) continue;

    notificationTimers.push(setTimeout(() => {
      const calMeta = CALENDAR_CATEGORY_META[event.category] || CALENDAR_CATEGORY_META.other;
      new Notification(`${calMeta.label} Reminder`, { body: `${event.title} from ${event.time} to ${event.endTime}` });
      data.shownNotifications[id] = true;
      save();
    }, trigger.getTime() - now.getTime()));
  }
}
