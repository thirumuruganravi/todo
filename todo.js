const STORAGE_KEY = "daybook-tasks-v1";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const visibleCount = document.querySelector("#visible-count");
const allCount = document.querySelector("#all-count");
const progressLabel = document.querySelector("#progress-label");
const clearCompletedButton = document.querySelector("#clear-completed");
const listTitle = document.querySelector("#list-title");
const todayLabel = document.querySelector("#today-label");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
	try {
		const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
		if (!Array.isArray(savedTasks)) return [];
		return savedTasks.filter((task) => (
			task && typeof task.id === "string" && typeof task.text === "string" && typeof task.completed === "boolean"
		));
	} catch {
		return [];
	}
}

function saveTasks() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
	} catch {
		progressLabel.textContent = "Storage unavailable";
	}
}

function formatTime(timestamp) {
	return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(timestamp);
}

function updateDate() {
	todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	}).format(new Date()).toUpperCase();
}

function renderTask(task) {
	const item = document.createElement("li");
	item.className = `task-item${task.completed ? " is-complete" : ""}`;

	const toggle = document.createElement("button");
	toggle.className = "task-toggle";
	toggle.type = "button";
	toggle.setAttribute("aria-label", task.completed ? `Mark ${task.text} as in progress` : `Complete ${task.text}`);
	toggle.setAttribute("aria-pressed", String(task.completed));
	const checkmark = document.createElement("span");
	checkmark.setAttribute("aria-hidden", "true");
	checkmark.textContent = "✓";
	toggle.append(checkmark);
	toggle.addEventListener("click", () => {
		task.completed = !task.completed;
		saveTasks();
		render();
	});

	const text = document.createElement("span");
	text.className = "task-text";
	text.textContent = task.text;

	const time = document.createElement("time");
	time.className = "task-time";
	time.dateTime = new Date(task.createdAt).toISOString();
	time.textContent = formatTime(task.createdAt);

	const remove = document.createElement("button");
	remove.className = "delete-button";
	remove.type = "button";
	remove.setAttribute("aria-label", `Delete ${task.text}`);
	remove.textContent = "×";
	remove.addEventListener("click", () => {
		tasks = tasks.filter((entry) => entry.id !== task.id);
		saveTasks();
		render();
	});

	item.append(toggle, text, time, remove);
	return item;
}

function render() {
	const visibleTasks = tasks.filter((task) => {
		if (currentFilter === "active") return !task.completed;
		if (currentFilter === "completed") return task.completed;
		return true;
	});
	const completedCount = tasks.filter((task) => task.completed).length;

	taskList.replaceChildren(...visibleTasks.map(renderTask));
	visibleCount.textContent = String(visibleTasks.length);
	allCount.textContent = String(tasks.length);
	progressLabel.textContent = `${completedCount} of ${tasks.length} complete`;
	clearCompletedButton.hidden = completedCount === 0;
	emptyState.hidden = visibleTasks.length > 0;

	const labels = { all: "All tasks", active: "In progress", completed: "Completed" };
	listTitle.textContent = labels[currentFilter];
	if (currentFilter === "completed") {
		emptyTitle.textContent = "Nothing checked off yet.";
		emptyCopy.textContent = "Complete a task and it will show up here.";
	} else if (currentFilter === "active" && tasks.length > 0) {
		emptyTitle.textContent = "All caught up.";
		emptyCopy.textContent = "Everything on your list is complete.";
	} else {
		emptyTitle.textContent = "A fresh page.";
		emptyCopy.textContent = "Add a task above and make today yours.";
	}
}

taskForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const text = taskInput.value.trim();
	if (!text) {
		taskInput.focus();
		return;
	}
	tasks.unshift({
		id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
		text,
		completed: false,
		createdAt: Date.now(),
	});
	currentFilter = "all";
	filterButtons.forEach((button) => {
		const isActive = button.dataset.filter === currentFilter;
		button.classList.toggle("is-active", isActive);
		button.setAttribute("aria-pressed", String(isActive));
	});
	saveTasks();
	render();
	taskForm.reset();
	taskInput.focus();
});

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		currentFilter = button.dataset.filter;
		filterButtons.forEach((filterButton) => {
			const isActive = filterButton === button;
			filterButton.classList.toggle("is-active", isActive);
			filterButton.setAttribute("aria-pressed", String(isActive));
		});
		render();
	});
});

clearCompletedButton.addEventListener("click", () => {
	tasks = tasks.filter((task) => !task.completed);
	saveTasks();
	render();
});

updateDate();
render();
