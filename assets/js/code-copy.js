/**
 * Copy button for code blocks (Rouge).
 *
 * Visible only on hover / focus-within via CSS.
 * Minimal, no dependencies, respects current markup.
 */
(function () {
  'use strict';

  function getCodeText(container) {
    // Rouge with line numbers: <table class="rouge-table"><td class="rouge-code"><pre>...</pre>
    const rougeCodePre = container.querySelector('.rouge-code pre');
    if (rougeCodePre) return rougeCodePre.innerText.replace(/\n$/, '');

    // Standard: <pre><code>...</code></pre>
    const preCode = container.querySelector('pre code');
    if (preCode) return preCode.innerText.replace(/\n$/, '');

    // Fallback: any <pre>
    const pre = container.querySelector('pre');
    if (pre) return pre.innerText.replace(/\n$/, '');

    return '';
  }

  async function copyText(text) {
    if (!text) return false;

    // Prefer modern clipboard API when available
    // writeText rejects when the document lacks focus or the permission is
    // refused; fall through to execCommand rather than leave the button mute.
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {}
    }

    // Fallback: execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    } finally {
      document.body.removeChild(textarea);
    }
    return ok;
  }

  // One polite live region for every block's button: what the button shows is
  // also said, since its label ("Copy code to clipboard") does not change.
  let live = null;
  function say(text) {
    if (!live) {
      live = document.createElement('span');
      live.className = 'visually-hidden';
      live.setAttribute('role', 'status');
      document.body.appendChild(live);
    }
    live.textContent = '';
    window.setTimeout(() => { live.textContent = text; }, 50);
  }

  function enhance(container) {
    if (!container || container.querySelector('.code-copy-btn')) return;

    // Make the block focusable (so keyboard users can reveal the button)
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.textContent = 'Copy';

    let resetTimer = null;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const text = getCodeText(container);
      const ok = await copyText(text);

      if (resetTimer) window.clearTimeout(resetTimer);

      if (ok) {
        btn.classList.add('is-copied');
        btn.textContent = 'Copied';
      } else {
        btn.classList.add('is-error');
        btn.textContent = 'Failed';
      }
      say(btn.textContent);

      resetTimer = window.setTimeout(() => {
        btn.classList.remove('is-copied', 'is-error');
        btn.textContent = 'Copy';
      }, 1200);
    });

    container.appendChild(btn);
  }

  function init() {
    const blocks = document.querySelectorAll('div.highlighter-rouge, figure.highlight');
    blocks.forEach(enhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

