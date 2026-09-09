<!-- ⚠️ ABSOLUTE GIT SAFETY LAW ⚠️ — THE AGENT MUST NEVER RUN git reset, git stash, git checkout --, git clean -f, git restore, git revert, git rebase, git cherry-pick, git commit --amend, git push --force, OR ANY OTHER DESTRUCTIVE GIT OPERATION WITHOUT EXPLICIT CONSENT FROM THE OWNER. WORKING TREE CHANGES ARE PRECIOUS AND IRREPLACEABLE. THEY MUST NEVER BE STASHED, DISCARDED, REVERTED, RESET, OR OVERWRITTEN. ALWAYS ASK THE OWNER FIRST. NO EXCEPTIONS, EVER. -->

<!--
  Tooltip.svelte — Anytype-faithful tooltip system ported to Svelte 5.

  Anytype source refs:
    • src/ts/lib/preview.ts          → tooltipShow / tooltipHide logic
    • src/scss/component/tooltip.scss → exact class names + animation values

  Usage (action-based, zero markup overhead):
    <div use:tooltip={{ text: "My label" }}>…</div>

  Or with direction overrides:
    <div use:tooltip={{ text: "My label", typeY: "bottom", delay: 300 }}>…</div>

  The tooltip container is mounted once at body level via onMount.
-->
<script lang="ts" module>
  // ── Constants (mirrors Anytype's preview.ts) ─────────────────────
  const DELAY_TOOLTIP = 650;   // Anytype default
  const BORDER        = 12;    // min px from window edge

  // Timeout state (module-scoped so it survives component re-renders)
  let _timeout: ReturnType<typeof setTimeout> | null = null;
  let _delayTooltip = DELAY_TOOLTIP;
  let _container: HTMLElement | null = null;

  function getContainer(): HTMLElement {
    if (_container && document.body.contains(_container)) return _container;
    _container = document.getElementById('tooltipContainer') as HTMLElement;
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'tooltipContainer';
      document.body.appendChild(_container);
    }
    return _container;
  }

  // Accessibility: unique id for aria-describedby
  let _idCounter = 0;
  function nextId() { _idCounter += 1; return `genesis-tooltip-${_idCounter}`; }

  function tooltipShow(
    el: HTMLElement,
    text: string,
    typeX: string,
    typeY: string,
    offsetX = 0,
    offsetY = 0,
    extra: { title?: string; description?: string; html?: string; island?: boolean } = {}
  ) {
    if (!el || (!text && !extra.html && !extra.title)) return;

    if (_timeout) clearTimeout(_timeout);

    _timeout = setTimeout(() => {
      const container = getContainer();
      const rect = el.getBoundingClientRect();
      const ew = el.offsetWidth;
      const eh = el.offsetHeight;
      const ww = window.innerWidth;
      const wh = window.innerHeight;

      // Build node — mirrors Anytype's DOM creation + a11y + island rich
      container.innerHTML = '';
      const node = document.createElement('div');
      const tooltipId = nextId();
      node.id = tooltipId;
      node.setAttribute('role', 'tooltip');
      const isIsland = extra.island || !!extra.html || (!!extra.title && !!extra.description);
      node.className = `genesis-tooltip anim ${isIsland ? 'island' : ''}`;
      if (extra.html) {
        node.innerHTML = `<div class="txt island-body">${extra.html}</div>`;
      } else if (extra.title || extra.description) {
        const t = extra.title ? `<div class="island-title">${extra.title}</div>` : '';
        const d = extra.description ? `<div class="island-desc">${extra.description}</div>` : `<div class="txt">${text}</div>`;
        const txt = text && !extra.description ? `<div class="txt">${text}</div>` : '';
        node.innerHTML = `${t}${d}${txt}`;
      } else {
        node.innerHTML = `<div class="txt">${text}</div>`;
      }
      container.appendChild(node);
      // Link trigger for screen readers
      el.setAttribute('aria-describedby', tooltipId);

      const ow = node.offsetWidth;
      const oh = node.offsetHeight;

      // X positioning — logical-aware: use inline-start/end for RTL, support right-of-trigger for sidebar
      let x = rect.left + offsetX;
      const isRTL = document.documentElement.dir === 'rtl';
      if (typeX === 'center') x += ew / 2 - ow / 2;
      else if (typeX === 'right') {
        // Genesis: x -= ow meant left-aligned; for sidebar we need right-of-trigger
        // Detect sidebar context: if trigger is near viewport start, place to inline-end
        x = isRTL ? rect.left - ow - 6 : rect.right + 6;
      } else if (typeX === 'left') x = isRTL ? rect.right + 6 : rect.left - ow - 6;

      // Y positioning — support center for sidebar vertical centering
      let y = rect.top + offsetY;
      if (typeY === 'top') {
        y -= oh + 6;
      } else if (typeY === 'bottom') {
        y += eh + 6;
      } else if (typeY === 'center') {
        y += eh / 2 - oh / 2;
      } else {
        // auto: prefer above; fall back to below if not enough room
        if (rect.top - oh - 6 >= BORDER) {
          y = rect.top - oh - 6;
        } else {
          y = rect.bottom + 6;
        }
      }

      // Clamp to viewport (reflow at 320px / 200% zoom)
      x = Math.max(BORDER, Math.min(ww - ow - BORDER, x));
      y = Math.max(BORDER, Math.min(wh - oh - BORDER, y));

      node.style.left = `${x}px`;
      node.style.top  = `${y}px`;

      // Trigger animation on next frame (matches Anytype's show class timing)
      // Respect prefers-reduced-motion: CSS handles it, just add show
      requestAnimationFrame(() => node.classList.add('show'));

      // After first show, make subsequent hovers on the same element faster
      _delayTooltip = 100;
      if (_timeout) clearTimeout(_timeout);
      _timeout = setTimeout(() => { _delayTooltip = DELAY_TOOLTIP; }, 500);
    }, _delayTooltip);
  }

  function tooltipHide(force = false, el?: HTMLElement) {
    if (_timeout) clearTimeout(_timeout);
    _timeout = null;
    _delayTooltip = DELAY_TOOLTIP;

    if (el) el.removeAttribute('aria-describedby');

    const container = getContainer();
    const nodes = container.querySelectorAll<HTMLElement>('.genesis-tooltip');
    nodes.forEach(n => {
      if (force) n.classList.remove('anim');
      n.classList.remove('show');
    });

    // Clean up after transition (260ms matches CSS, reduced-motion disables)
    setTimeout(() => { container.innerHTML = ''; }, force ? 0 : 260);
  }

  // ── Svelte action ────────────────────────────────────────────────
  export type TooltipOptions = {
    text: string;
    title?: string;
    description?: string;
    html?: string;
    island?: boolean;
    typeX?: 'left' | 'center' | 'right';
    typeY?: 'top' | 'center' | 'bottom' | 'auto';
    delay?: number;
    offsetX?: number;
    offsetY?: number;
  };

  export function tooltip(node: HTMLElement, opts: TooltipOptions) {
    let { text, title, description, html, island, typeX = 'center', typeY = 'auto', offsetX = 0, offsetY = 0, delay } = opts;
    if (delay != null) _delayTooltip = delay;

    const enter = () => tooltipShow(node, text, typeX, typeY, offsetX, offsetY, { title, description, html, island });
    const leave = () => tooltipHide(false, node);
    const click = () => tooltipHide(true, node);
    const onFocus = () => {
      // Keyboard focus shows immediately (no 650ms wait) — WCAG 1.4.13 hover/focus
      const prev = _delayTooltip;
      _delayTooltip = 0;
      tooltipShow(node, text, typeX, typeY, offsetX, offsetY, { title, description, html, island });
      _delayTooltip = prev;
    };
    const onBlur = () => tooltipHide(false, node);
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        tooltipHide(true, node);
        (node as HTMLElement).blur();
      }
    };

    node.addEventListener('mouseenter', enter);
    node.addEventListener('mouseleave', leave);
    node.addEventListener('focus', onFocus);
    node.addEventListener('blur', onBlur);
    node.addEventListener('click', click);
    node.addEventListener('keydown', onKeydown);

    return {
      update(newOpts: TooltipOptions) {
        text = newOpts.text;
        title = newOpts.title;
        description = newOpts.description;
        html = newOpts.html;
        island = newOpts.island;
        typeX = newOpts.typeX ?? 'center';
        typeY = newOpts.typeY ?? 'auto';
        offsetX = newOpts.offsetX ?? 0;
        offsetY = newOpts.offsetY ?? 0;
        if (newOpts.delay != null) _delayTooltip = newOpts.delay;
      },
      destroy() {
        node.removeEventListener('mouseenter', enter);
        node.removeEventListener('mouseleave', leave);
        node.removeEventListener('focus', onFocus);
        node.removeEventListener('blur', onBlur);
        node.removeEventListener('click', click);
        node.removeEventListener('keydown', onKeydown);
        node.removeAttribute('aria-describedby');
        tooltipHide(true, node);
      }
    };
  }
</script>