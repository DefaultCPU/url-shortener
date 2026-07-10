(function () {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  const STRING_COUNT = 60;
  const BASE_SPEED = 0.00025; // radians/ms — idle autonomous rotation
  const SCROLL_IMPULSE = 0.0009; // added angular speed per px of scroll delta
  const MAX_SCROLL_VELOCITY = 0.02;
  const DAMPING = 0.94; // per-frame decay of scroll-driven speed boost

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let strings = [];
  let scrollVelocity = 0;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();

  const CODE_ALPHABET =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  function randomChars(len, pool) {
    let out = "";
    for (let i = 0; i < len; i++) {
      out += pool[Math.floor(Math.random() * pool.length)];
    }
    return out;
  }

  function randomUrlString() {
    const code = randomChars(7, CODE_ALPHABET);
    return `swurl.dev.lilnas.io/${code}`;
  }

  function createStrings() {
    const maxRadius = Math.min(width, height) * 0.65;
    strings = [];
    for (let i = 0; i < STRING_COUNT; i++) {
      strings.push({
        text: randomUrlString(),
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * maxRadius,
        speedFactor: 0.5 + Math.random(),
        fontSize: 11 + Math.random() * 10,
        opacity: 0.08 + Math.random() * 0.22,
      });
    }
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
    createStrings();
  }

  function onScroll() {
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollVelocity += delta * SCROLL_IMPULSE;
    scrollVelocity = Math.max(
      -MAX_SCROLL_VELOCITY,
      Math.min(MAX_SCROLL_VELOCITY, scrollVelocity)
    );
  }

  function frame(now) {
    const dt = now - lastTime;
    lastTime = now;

    scrollVelocity *= DAMPING;
    const angularSpeed = BASE_SPEED + scrollVelocity;

    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = "middle";

    for (const s of strings) {
      s.angle += angularSpeed * s.speedFactor * dt;
      const x = centerX + Math.cos(s.angle) * s.radius;
      const y = centerY + Math.sin(s.angle) * s.radius * 0.6;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.angle + Math.PI / 2);
      ctx.font = `${s.fontSize}px "SFMono-Regular", Consolas, monospace`;
      ctx.fillStyle = `rgba(94, 234, 212, ${s.opacity})`;
      ctx.fillText(s.text, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  const lastStatValues = {};

  function setCount(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const previous = lastStatValues[id];
    el.textContent = value.toLocaleString();
    if (previous !== undefined && previous !== value) {
      el.classList.remove("pulse");
      // Force reflow so the animation restarts if it's already mid-pulse.
      void el.offsetWidth;
      el.classList.add("pulse");
    }
    lastStatValues[id] = value;
  }

  async function refreshStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      setCount("total-links", data.total_links);
      setCount("total-visits", data.total_visits);
    } catch (err) {
      // transient network error — keep showing last known values
    }
  }

  function showError(message) {
    const el = document.getElementById("shorten-error");
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
  }

  async function onShortenSubmit(event) {
    event.preventDefault();
    const input = document.getElementById("url-input");
    const result = document.getElementById("result-input");
    showError("");

    try {
      const res = await fetch("/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.value }),
      });
      if (!res.ok) {
        showError("That doesn't look like a valid URL.");
        return;
      }
      const data = await res.json();
      result.value = data.short_url;
      result.focus();
      result.select();
      result.classList.remove("flash");
      void result.offsetWidth;
      result.classList.add("flash");
      refreshStats();
    } catch (err) {
      showError("Something went wrong. Try again.");
    }
  }

  async function onCopyClick() {
    const result = document.getElementById("result-input");
    const button = document.getElementById("copy-button");
    if (!result || !result.value) return;

    try {
      await navigator.clipboard.writeText(result.value);
    } catch (err) {
      result.focus();
      result.select();
      document.execCommand("copy");
    }

    const originalText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", onScroll, { passive: true });

  const shortenForm = document.getElementById("shorten-form");
  if (shortenForm) shortenForm.addEventListener("submit", onShortenSubmit);

  const resultInput = document.getElementById("result-input");
  if (resultInput) resultInput.addEventListener("click", () => resultInput.select());

  const copyButton = document.getElementById("copy-button");
  if (copyButton) copyButton.addEventListener("click", onCopyClick);

  resize();
  requestAnimationFrame(frame);
  refreshStats();
  setInterval(refreshStats, 5000);
})();
