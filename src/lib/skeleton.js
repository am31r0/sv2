// src/lib/skeleton.js
function $el(t) {
  return typeof t === "string" ? document.querySelector(t) : t;
}


export function showSkeletonOverlay(
  target,
  { cards = 8, minHeight = 320 } = {}
) {
  const host = $el(target);
  if (!host) return;

  // Zorg dat de host overlay kan positioneren
  host.style.position ||= "relative";
  host.style.minHeight = Math.max(minHeight, host.clientHeight || 0) + "px";

  // Skip als er al één is
  if (host.querySelector(":scope > .skeleton-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "skeleton-overlay";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="skeleton-grid">
      ${Array.from({ length: cards })
        .map(
          () => `
        <div class="skeleton-card">
          <div class="skel skel-thumb shimmer" aria-hidden="true"></div>
          <div class="skel-line shimmer" style="width:70%"></div>
          <div class="skel-line shimmer" style="width:45%"></div>
          <div class="skel-line shimmer" style="width:30%; height:14px"></div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
  host.appendChild(overlay);
  host.setAttribute("aria-busy", "true");
}

export function hideSkeletonOverlay(target) {
  const host = $el(target);
  if (!host) return;
  const overlay = host.querySelector(":scope > .skeleton-overlay");
  if (overlay) overlay.remove();
  host.removeAttribute("aria-busy");
}
