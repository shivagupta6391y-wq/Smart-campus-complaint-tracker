const STORAGE_KEY = "smartCampusComplaintsV1";

const priorityValue = {
  High: 3,
  Medium: 2,
  Low: 1
};

const demoComplaints = [
  {
    id: 1006,
    title: "Wi-Fi not working in Lab 3",
    category: "Internet / Wi-Fi",
    location: "C-Block, Lab 3",
    priority: "High",
    status: "Pending",
    description: "Internet connection is unavailable on most systems in the lab.",
    date: "2026-10-06T09:30:00"
  },
  {
    id: 1005,
    title: "Projector display is unclear",
    category: "Classroom",
    location: "A-Block, Room 204",
    priority: "Medium",
    status: "In Progress",
    description: "Projector brightness is low and text is difficult to read.",
    date: "2026-10-05T14:10:00"
  },
  {
    id: 1004,
    title: "Water cooler needs cleaning",
    category: "Water",
    location: "Main Building, 2nd Floor",
    priority: "Low",
    status: "Resolved",
    description: "Water cooler area needs regular cleaning.",
    date: "2026-10-04T11:00:00"
  },
  {
    id: 1003,
    title: "Computer not starting",
    category: "Computer Lab",
    location: "B-Block, Lab 1",
    priority: "High",
    status: "Resolved",
    description: "One desktop is not powering on.",
    date: "2026-10-03T16:30:00"
  },
  {
    id: 1002,
    title: "Fan making noise",
    category: "Electricity",
    location: "C-Block, Room 107",
    priority: "Low",
    status: "Pending",
    description: "Ceiling fan is making unusual noise.",
    date: "2026-10-02T10:20:00"
  }
];

let complaints = loadComplaints();

function loadComplaints() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Could not read saved data:", error);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoComplaints));
  return [...demoComplaints];
}

function saveComplaints() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusClass(status) {
  return "status-" + status.replaceAll(" ", "-");
}

function priorityClass(priority) {
  return "priority-" + priority;
}

/*
  ================================
  DSA: MAX HEAP / PRIORITY QUEUE
  ================================
  Higher priority value comes first:
  High = 3, Medium = 2, Low = 1.
*/
class MaxHeap {
  constructor() {
    this.heap = [];
  }

  parent(index) {
    return Math.floor((index - 1) / 2);
  }

  left(index) {
    return index * 2 + 1;
  }

  right(index) {
    return index * 2 + 2;
  }

  swap(a, b) {
    [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];
  }

  insert(item) {
    this.heap.push(item);
    let index = this.heap.length - 1;

    while (
      index > 0 &&
      priorityValue[this.heap[index].priority] >
        priorityValue[this.heap[this.parent(index)].priority]
    ) {
      const parentIndex = this.parent(index);
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();

    let index = 0;

    while (true) {
      const left = this.left(index);
      const right = this.right(index);
      let largest = index;

      if (
        left < this.heap.length &&
        priorityValue[this.heap[left].priority] >
          priorityValue[this.heap[largest].priority]
      ) {
        largest = left;
      }

      if (
        right < this.heap.length &&
        priorityValue[this.heap[right].priority] >
          priorityValue[this.heap[largest].priority]
      ) {
        largest = right;
      }

      if (largest === index) break;

      this.swap(index, largest);
      index = largest;
    }

    return max;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

function getPriorityQueueItems(count = 5) {
  const heap = new MaxHeap();

  complaints
    .filter(c => c.status !== "Resolved")
    .forEach(c => heap.insert(c));

  const result = [];
  while (!heap.isEmpty() && result.length < count) {
    result.push(heap.extractMax());
  }

  return result;
}

function updateDashboard() {
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === "Pending").length;
  const progress = complaints.filter(c => c.status === "In Progress").length;
  const resolved = complaints.filter(c => c.status === "Resolved").length;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("progressCount").textContent = progress;
  document.getElementById("resolvedCount").textContent = resolved;

  const recent = [...complaints]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const recentBox = document.getElementById("recentComplaints");

  if (!recent.length) {
    recentBox.innerHTML = emptyState("No complaints yet", "Submit your first campus complaint.");
  } else {
    recentBox.innerHTML = recent.map(c => `
      <div class="complaint-item">
        <div>
          <p class="complaint-title">${escapeHTML(c.title)}</p>
          <div class="complaint-meta">${escapeHTML(c.location)} • ${formatDate(c.date)}</div>
        </div>
        <div class="badges">
          <span class="badge ${priorityClass(c.priority)}">${c.priority}</span>
          <span class="badge ${statusClass(c.status)}">${c.status}</span>
        </div>
      </div>
    `).join("");
  }

  renderPriorityQueue();
}

function renderPriorityQueue() {
  const items = getPriorityQueueItems();
  const box = document.getElementById("priorityList");

  if (!items.length) {
    box.innerHTML = emptyState("All clear 🎉", "There are no unresolved complaints.");
    return;
  }

  box.innerHTML = items.map((c, index) => `
    <div class="priority-row">
      <div class="priority-number">${index + 1}</div>
      <div class="priority-content">
        <strong>${escapeHTML(c.title)}</strong>
        <span>${escapeHTML(c.location)}</span>
      </div>
      <span class="badge ${priorityClass(c.priority)}">${c.priority}</span>
    </div>
  `).join("");
}

function renderComplaints() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const priority = document.getElementById("priorityFilter").value;
  const sort = document.getElementById("sortSelect").value;

  let filtered = complaints.filter(c => {
    const searchable = `${c.title} ${c.category} ${c.location} ${c.description}`.toLowerCase();

    return (
      searchable.includes(search) &&
      (status === "all" || c.status === status) &&
      (priority === "all" || c.priority === priority)
    );
  });

  if (sort === "newest") {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sort === "oldest") {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === "priority") {
    filtered.sort((a, b) => priorityValue[b.priority] - priorityValue[a.priority]);
  } else if (sort === "title") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  const box = document.getElementById("complaintCards");

  if (!filtered.length) {
    box.innerHTML = `<div class="panel">${emptyState("No matching complaints", "Try another search or filter.")}</div>`;
    return;
  }

  box.innerHTML = filtered.map(c => `
    <div class="panel full-complaint">
      <div>
        <div class="badges" style="justify-content:flex-start; margin-bottom:8px;">
          <span class="badge ${priorityClass(c.priority)}">${c.priority} Priority</span>
          <span class="badge ${statusClass(c.status)}">${c.status}</span>
        </div>
        <h4>${escapeHTML(c.title)}</h4>
        <div class="date">#${c.id} • ${escapeHTML(c.category)} • ${escapeHTML(c.location)} • ${formatDate(c.date)}</div>
        <p>${escapeHTML(c.description)}</p>
      </div>
      <div>
        <button class="delete-btn" onclick="deleteComplaint(${c.id})">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderAnalytics() {
  const statuses = ["Pending", "In Progress", "Resolved"];
  const counts = statuses.map(s => complaints.filter(c => c.status === s).length);
  const max = Math.max(...counts, 1);

  document.getElementById("statusBars").innerHTML = statuses.map((s, i) => `
    <div class="bar-row">
      <label>${s}</label>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(counts[i] / max) * 100}%"></div>
      </div>
      <strong>${counts[i]}</strong>
    </div>
  `).join("");

  const categoryCounts = {};
  complaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1]);

  document.getElementById("categoryList").innerHTML =
    sortedCategories.length
      ? sortedCategories.map(([category, count]) => `
          <div class="category-row">
            <span>${escapeHTML(category)}</span>
            <strong>${count}</strong>
          </div>
        `).join("")
      : emptyState("No data", "Submit a complaint to see analytics.");
}

function emptyState(title, message) {
  return `
    <div class="empty-state">
      <strong>${title}</strong>
      <span>${message}</span>
    </div>
  `;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach(section => {
    section.classList.toggle("active", section.id === sectionId);
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.section === sectionId);
  });

  const titles = {
    dashboard: "Dashboard",
    complaints: "My Complaints",
    submit: "New Complaint",
    analytics: "Analytics"
  };

  document.getElementById("pageTitle").textContent = titles[sectionId] || "Dashboard";

  if (sectionId === "dashboard") updateDashboard();
  if (sectionId === "complaints") renderComplaints();
  if (sectionId === "analytics") renderAnalytics();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

document.getElementById("topNewComplaint").addEventListener("click", () => {
  showSection("submit");
  document.getElementById("title").focus();
});

document.getElementById("complaintForm").addEventListener("submit", event => {
  event.preventDefault();

  const form = new FormData(event.target);

  const complaint = {
    id: Date.now(),
    title: form.get("title").trim(),
    category: form.get("category"),
    location: form.get("location").trim(),
    priority: form.get("priority"),
    status: "Pending",
    description: form.get("description").trim(),
    date: new Date().toISOString()
  };

  complaints.push(complaint);
  saveComplaints();
  event.target.reset();

  showToast("Complaint submitted successfully ✓");
  showSection("dashboard");
});

["searchInput", "statusFilter", "priorityFilter", "sortSelect"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderComplaints);
  document.getElementById(id).addEventListener("change", renderComplaints);
});

window.deleteComplaint = function(id) {
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return;

  const ok = confirm(`Delete complaint "${complaint.title}"?`);
  if (!ok) return;

  complaints = complaints.filter(c => c.id !== id);
  saveComplaints();
  renderComplaints();
  updateDashboard();
  renderAnalytics();
  showToast("Complaint deleted");
};

document.getElementById("resetData").addEventListener("click", () => {
  const ok = confirm("Reset all complaints to the original demo data?");
  if (!ok) return;

  complaints = [...demoComplaints];
  saveComplaints();
  updateDashboard();
  renderComplaints();
  renderAnalytics();
  showToast("Demo data restored");
});

updateDashboard();
renderComplaints();
renderAnalytics();
