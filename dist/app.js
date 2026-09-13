const YEAR = 2026;
const MONTH_NAMES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const STORAGE_KEY = "calendar-2026-todos";

const now = new Date();
const initialMonth = now.getFullYear() === YEAR ? now.getMonth() : 0;

let visibleMonth = initialMonth;
let selectedDate = dateKey(YEAR, initialMonth, now.getFullYear() === YEAR ? now.getDate() : 1);
let todos = loadTodos();

const calendarGrid = document.querySelector("#calendarGrid");
const monthTitle = document.querySelector("#monthTitle");
const monthEn = document.querySelector("#monthEn");
const selectedYear = document.querySelector("#selectedYear");
const selectedDateLabel = document.querySelector("#selectedDate");
const selectedWeekday = document.querySelector("#selectedWeekday");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const todoCount = document.querySelector("#todoCount");
const emptyState = document.querySelector("#emptyState");

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function loadTodos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function renderCalendar() {
  monthTitle.textContent = `${YEAR}년 ${visibleMonth + 1}월`;
  monthEn.textContent = MONTH_NAMES[visibleMonth];
  calendarGrid.replaceChildren();

  const firstDay = new Date(YEAR, visibleMonth, 1).getDay();
  const daysInMonth = new Date(YEAR, visibleMonth + 1, 0).getDate();
  const prevMonthDays = new Date(YEAR, visibleMonth, 0).getDate();

  const todayKey = now.getFullYear() === YEAR
    ? dateKey(YEAR, now.getMonth(), now.getDate())
    : "";

  for (let i = 0; i < 42; i += 1) {
    let month = visibleMonth;
    let day = i - firstDay + 1;
    let outside = false;
    if (day < 1) { month -= 1; day = prevMonthDays + day; outside = true; }
    if (day > daysInMonth) { month += 1; day -= daysInMonth; outside = true; }

    let year = YEAR;
    if (month < 0) { month = 11; year -= 1; }
    if (month > 11) { month = 0; year += 1; }
    const key = dateKey(year, month, day);
    const dayTodos = todos[key] || [];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-cell${outside ? " outside" : ""}${key === selectedDate ? " selected" : ""}${key === todayKey ? " today" : ""}${dayTodos.length ? " has-todos" : ""}`;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `${year}년 ${month + 1}월 ${day}일${dayTodos.length ? `, 할 일 ${dayTodos.length}개` : ""}`);
    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = day;
    button.append(number);
    if (dayTodos.length) {
      const chip = document.createElement("span");
      chip.className = "todo-chip";
      chip.textContent = dayTodos[0].text;
      button.append(chip);
    }
    button.addEventListener("click", () => {
      if (year !== YEAR) return;
      selectedDate = key;
      visibleMonth = month;
      renderAll();
      todoInput.focus();
    });
    calendarGrid.append(button);
  }
}

function renderTodos() {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  selectedYear.textContent = year;
  selectedDateLabel.textContent = `${month}월 ${day}일`;
  selectedWeekday.textContent = WEEKDAYS[date.getDay()];

  const list = todos[selectedDate] || [];
  todoList.replaceChildren();
  const completedCount = list.filter((item) => item.done).length;
  todoCount.textContent = list.length ? `${completedCount}/${list.length} 완료` : "0개";
  emptyState.hidden = list.length > 0;

  list.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " done" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `${todo.text} 완료 표시`);
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      renderAll();
    });
    const text = document.createElement("span");
    text.textContent = todo.text;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "삭제";
    remove.setAttribute("aria-label", `${todo.text} 삭제`);
    remove.addEventListener("click", () => {
      todos[selectedDate] = list.filter((item) => item.id !== todo.id);
      if (!todos[selectedDate].length) delete todos[selectedDate];
      saveTodos();
      renderAll();
    });
    item.append(checkbox, text, remove);
    todoList.append(item);
  });
}

function renderAll() {
  renderCalendar();
  renderTodos();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  const item = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, done: false };
  todos[selectedDate] = [...(todos[selectedDate] || []), item];
  todoInput.value = "";
  saveTodos();
  renderAll();
  todoInput.focus();
});

document.querySelector("#prevMonth").addEventListener("click", () => {
  visibleMonth = (visibleMonth + 11) % 12;
  selectedDate = dateKey(YEAR, visibleMonth, 1);
  renderAll();
});

document.querySelector("#nextMonth").addEventListener("click", () => {
  visibleMonth = (visibleMonth + 1) % 12;
  selectedDate = dateKey(YEAR, visibleMonth, 1);
  renderAll();
});

document.querySelector("#todayButton").addEventListener("click", () => {
  const now = new Date();
  visibleMonth = now.getFullYear() === YEAR ? now.getMonth() : 0;
  selectedDate = dateKey(YEAR, visibleMonth, now.getFullYear() === YEAR ? now.getDate() : 1);
  renderAll();
});

function registerWebMCPTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const addTodo = {
    name: "add_calendar_todo",
    title: "달력에 할 일 추가",
    description: "2026년의 지정한 날짜에 할 일을 추가합니다.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", pattern: "^2026-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$" },
        text: { type: "string", minLength: 1, maxLength: 80 }
      },
      required: ["date", "text"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const date = String(input?.date || "");
      const text = String(input?.text || "").trim();
      const parsed = new Date(`${date}T00:00:00`);
      if (!/^2026-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== YEAR || dateKey(YEAR, parsed.getMonth(), parsed.getDate()) !== date || !text || text.length > 80) {
        throw new Error("유효한 2026년 날짜와 1~80자의 할 일을 입력해 주세요.");
      }
      const item = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, done: false };
      todos[date] = [...(todos[date] || []), item];
      selectedDate = date;
      visibleMonth = parsed.getMonth();
      saveTodos();
      renderAll();
      return { date, id: item.id, text: item.text, status: "added" };
    }
  };
  try { Promise.resolve(context.registerTool(addTodo)).catch(() => {}); } catch {}
}

renderAll();
registerWebMCPTools();
