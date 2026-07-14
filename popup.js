let activeTab = null;

function setStatus(text, ok) {
  const el = document.getElementById("status");
  el.textContent = text || "";
  el.className = ok ? "ok" : "bad";
}

function urlForCookie(cookie) {
  // chrome.cookies.set cần 1 URL hợp lệ khớp domain/path/secure của cookie.
  const domain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
  const scheme = cookie.secure ? "https" : "http";
  return `${scheme}://${domain}${cookie.path}`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function loadCookies() {
  const listEl = document.getElementById("list");
  const domainEl = document.getElementById("domain");
  listEl.innerHTML = '<div class="empty">Đang tải cookie...</div>';

  activeTab = await getActiveTab();
  if (!activeTab || !activeTab.url || !/^https?:/.test(activeTab.url)) {
    domainEl.textContent = "Tab hiện tại không phải trang http/https.";
    listEl.innerHTML = '<div class="empty">Không có cookie để hiển thị.</div>';
    return;
  }

  domainEl.textContent = activeTab.url;
  const cookies = await chrome.cookies.getAll({ url: activeTab.url });

  if (!cookies.length) {
    listEl.innerHTML = '<div class="empty">Trang này chưa có cookie nào.</div>';
    return;
  }

  listEl.innerHTML = "";
  cookies.sort((a, b) => a.name.localeCompare(b.name));
  for (const cookie of cookies) {
    listEl.appendChild(renderCookieItem(cookie));
  }
}

function renderCookieItem(cookie) {
  const wrap = document.createElement("div");
  wrap.className = "item";

  const nameEl = document.createElement("div");
  nameEl.className = "name";
  nameEl.textContent = cookie.name;
  wrap.appendChild(nameEl);

  const metaEl = document.createElement("div");
  metaEl.className = "meta";
  const expiry = cookie.session ? "hết hạn khi đóng trình duyệt" : new Date(cookie.expirationDate * 1000).toLocaleString();
  metaEl.textContent = `domain: ${cookie.domain} · path: ${cookie.path} · ${expiry}${cookie.httpOnly ? " · HttpOnly" : ""}${cookie.secure ? " · Secure" : ""}`;
  wrap.appendChild(metaEl);

  const valueEl = document.createElement("textarea");
  valueEl.value = cookie.value;
  wrap.appendChild(valueEl);

  const actions = document.createElement("div");
  actions.className = "actions";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Lưu";
  saveBtn.addEventListener("click", async () => {
    try {
      await chrome.cookies.set({
        url: urlForCookie(cookie),
        name: cookie.name,
        value: valueEl.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.session ? undefined : cookie.expirationDate,
        storeId: cookie.storeId
      });
      setStatus(`Đã lưu cookie "${cookie.name}".`, true);
      loadCookies();
    } catch (e) {
      setStatus(`Lỗi khi lưu "${cookie.name}": ${e.message}`, false);
    }
  });

  const delBtn = document.createElement("button");
  delBtn.textContent = "Xoá";
  delBtn.addEventListener("click", async () => {
    try {
      await chrome.cookies.remove({ url: urlForCookie(cookie), name: cookie.name, storeId: cookie.storeId });
      setStatus(`Đã xoá cookie "${cookie.name}".`, true);
      loadCookies();
    } catch (e) {
      setStatus(`Lỗi khi xoá "${cookie.name}": ${e.message}`, false);
    }
  });

  actions.appendChild(saveBtn);
  actions.appendChild(delBtn);
  wrap.appendChild(actions);

  return wrap;
}

async function addCookie() {
  const name = document.getElementById("newName").value.trim();
  const value = document.getElementById("newValue").value;
  const path = document.getElementById("newPath").value.trim() || "/";
  const domainInput = document.getElementById("newDomain").value.trim();

  if (!name) {
    setStatus("Cần nhập tên cookie.", false);
    return;
  }
  if (!activeTab || !activeTab.url) {
    setStatus("Không xác định được tab hiện tại.", false);
    return;
  }

  const tabUrl = new URL(activeTab.url);
  const domain = domainInput || tabUrl.hostname;
  const scheme = tabUrl.protocol === "https:" ? "https" : "http";

  try {
    await chrome.cookies.set({
      url: `${scheme}://${domain}${path}`,
      name,
      value,
      path,
      domain: domainInput || undefined, // để trống thì trình duyệt tự gán theo URL
      secure: scheme === "https"
    });
    setStatus(`Đã thêm cookie "${name}".`, true);
    document.getElementById("newName").value = "";
    document.getElementById("newValue").value = "";
    document.getElementById("newDomain").value = "";
    loadCookies();
  } catch (e) {
    setStatus(`Lỗi khi thêm cookie: ${e.message}`, false);
  }
}

async function exportCookies() {
  if (!activeTab || !activeTab.url) return;
  const cookies = await chrome.cookies.getAll({ url: activeTab.url });
  const json = JSON.stringify(cookies, null, 2);
  await navigator.clipboard.writeText(json);
  setStatus(`Đã copy ${cookies.length} cookie (JSON) vào clipboard.`, true);
}

document.addEventListener("DOMContentLoaded", () => {
  loadCookies();
  document.getElementById("btnRefresh").addEventListener("click", loadCookies);
  document.getElementById("btnExport").addEventListener("click", exportCookies);
  document.getElementById("btnAdd").addEventListener("click", addCookie);
});
