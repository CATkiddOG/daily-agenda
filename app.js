const STORAGE_KEY = "dailyAgendaData";
const todayKey = () => new Date().toISOString().slice(0, 10);
const weekKey = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - first) / 86400000);
  return `${now.getFullYear()}-W${Math.ceil((days + first.getDay() + 1) / 7)}`;
};

const defaultData = {
  mode: "kid",
  parentPin: "1234",
  stars: 0,
  dailyStreak: 0,
  weeklyStreak: 0,
  tasks: [],
  rewards: {},
  unlockedRewards: [],
  completionByDay: {},
  weekCompletion: {},
  shownNotifications: {},
  streakAudit: { lastDayChecked: null, lastWeekChecked: null }
};

let data = load();
let notificationTimers = [];

const els = {
  modeBadge: document.getElementById("modeBadge"),
  openParentBtn: document.getElementById("openParentBtn"),
  exitParentBtn: document.getElementById("exitParentBtn"),
  parentPanel: document.getElementById("parentPanel"),
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
  rewardText: document.getElementById("rewardText"),
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
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed ? { ...defaultData, ...parsed } : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function boot() {
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
    if (!name || !time) return;

    const id = crypto.randomUUID();
    data.tasks.push({ id, name, time, completedDays: [] });

    const nextMilestone = Math.ceil((data.stars + 1) / 10) * 10;
    const reward = els.rewardText.value.trim();
    if (reward && !data.rewards[nextMilestone]) {
      data.rewards[nextMilestone] = reward;
    }

    els.taskForm.reset();
    save();
    render();
    scheduleNotifications();
  });

  els.pinChangeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pin = els.newPin.value.trim();
    if (!/^\d{4,6}$/.test(pin)) return;
    data.parentPin = pin;
    els.newPin.value = "";
    save();
    showCelebration("🔒 Parent PIN updated.");
  });
}

function render() {
  const isParent = data.mode === "parent";
  els.modeBadge.textContent = isParent ? "Parent Mode" : "Kid Mode";
  els.modeBadge.className = `badge ${isParent ? "parent" : "kid"}`;
  els.openParentBtn.classList.toggle("hidden", isParent);
  els.exitParentBtn.classList.toggle("hidden", !isParent);
  els.parentPanel.classList.toggle("hidden", !isParent);
  els.pinSettings.classList.toggle("hidden", !isParent);

  els.starCount.textContent = String(data.stars);
  els.dailyStreak.textContent = String(data.dailyStreak);
  els.weeklyStreak.textContent = String(data.weeklyStreak);

  const nextMilestone = Math.ceil((data.stars + 1) / 10) * 10;
  els.nextReward.textContent = `Next milestone: ${nextMilestone} stars`;

  renderTasks(isParent);
  renderRewards();
}

function renderTasks(isParent) {
  const today = todayKey();
  els.taskList.innerHTML = "";

  if (!data.tasks.length) {
    els.emptyState.classList.remove("hidden");
    return;
  }
  els.emptyState.classList.add("hidden");

  for (const task of data.tasks.sort((a, b) => a.time.localeCompare(b.time))) {
    const completed = task.completedDays.includes(today);
    const li = document.createElement("li");
    li.className = `task-item ${completed ? "completed" : ""}`;

    const main = document.createElement("div");
    main.className = "task-main";
    main.innerHTML = `<strong>${task.name}</strong><span class="task-time">⏰ ${task.time}</span>`;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const doneBtn = document.createElement("button");
    doneBtn.className = "secondary";
    doneBtn.textContent = completed ? "Done ✅" : "Mark done";
    doneBtn.disabled = completed;
    doneBtn.addEventListener("click", () => completeTask(task.id));
    actions.appendChild(doneBtn);

    if (isParent) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        data.tasks = data.tasks.filter((t) => t.id !== task.id);
        save();
        render();
      });
      actions.appendChild(deleteBtn);
    }

    li.append(main, actions);
    els.taskList.appendChild(li);
  }
}

function renderRewards() {
  els.rewardList.innerHTML = "";
  const milestones = Object.keys(data.rewards)
    .map(Number)
    .sort((a, b) => a - b);

  if (!milestones.length) {
    const li = document.createElement("li");
    li.className = "reward-item";
    li.textContent = "Parent can set rewards for 10, 20, 30 stars...";
    els.rewardList.appendChild(li);
    return;
  }

  for (const milestone of milestones) {
    const unlocked = data.unlockedRewards.includes(milestone);
    const li = document.createElement("li");
    li.className = `reward-item ${unlocked ? "unlocked" : ""}`;
    li.innerHTML = `<span><strong>${milestone}⭐</strong> ${data.rewards[milestone]}</span><span>${unlocked ? "Unlocked 🎉" : "Locked"}</span>`;
    els.rewardList.appendChild(li);
  }
}

function completeTask(taskId) {
  const today = todayKey();
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task || task.completedDays.includes(today)) return;

  task.completedDays.push(today);
  data.stars += 1;

  const completedToday = data.tasks.every((t) => t.completedDays.includes(today));
  data.completionByDay[today] = completedToday;
  markWeekDayCompletion(today, completedToday);

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

function markWeekDayCompletion(day, done) {
  const week = weekKey();
  data.weekCompletion[week] ||= {};
  data.weekCompletion[week][day] = done;
}

function evaluateStreaks() {
  const day = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (Object.keys(data.completionByDay).length && !data.completionByDay[yesterday]) {
    data.dailyStreak = 0;
  }

  if (data.streakAudit.lastDayChecked === day && !allTodayDone()) {
    data.dailyStreak = Math.max(0, data.dailyStreak - 1);
    data.streakAudit.lastDayChecked = null;
  }

  checkWeeklyStreak();
  save();
}

function checkWeeklyStreak() {
  const week = weekKey();
  const doneMap = data.weekCompletion[week] || {};
  const completedDays = Object.values(doneMap).filter(Boolean).length;

  if (completedDays >= 5 && data.streakAudit.lastWeekChecked !== week) {
    data.weeklyStreak += 1;
    data.streakAudit.lastWeekChecked = week;
    showCelebration("🏆 Weekly streak increased!");
  }
}

function unlockMilestones() {
  const milestone = Math.floor(data.stars / 10) * 10;
  if (milestone < 10) return;
  if (data.unlockedRewards.includes(milestone)) return;
  if (!data.rewards[milestone]) return;
  data.unlockedRewards.push(milestone);
  showCelebration(`🎁 Reward unlocked: ${data.rewards[milestone]}`);
}

function allTodayDone() {
  const today = todayKey();
  return data.tasks.length > 0 && data.tasks.every((task) => task.completedDays.includes(today));
}

function showCelebration(message) {
  els.celebration.textContent = message;
  els.celebration.classList.remove("hidden");
  setTimeout(() => els.celebration.classList.add("hidden"), 2600);
}

function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function scheduleNotifications() {
  for (const timer of notificationTimers) clearTimeout(timer);
  notificationTimers = [];

  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  const today = todayKey();

  for (const task of data.tasks) {
    const [hours, minutes] = task.time.split(":").map(Number);
    const trigger = new Date();
    trigger.setHours(hours, minutes, 0, 0);

    if (trigger <= now) continue;

    const notificationId = `${today}-${task.id}`;
    if (data.shownNotifications[notificationId]) continue;

    const delay = trigger.getTime() - now.getTime();
    const timer = setTimeout(() => {
      new Notification("Daily Agenda Reminder", {
        body: `Time for: ${task.name}`,
        icon: "data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27><text y=%2718%27 font-size=%2718%27>⭐</text></svg>"
      });

      data.shownNotifications[notificationId] = true;
      save();
    }, delay);

    notificationTimers.push(timer);
  }
}
