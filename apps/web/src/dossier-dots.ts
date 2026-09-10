const DOSSIER_SCORE_SELECTOR =
  ".global-npc-dossier__score-editor input[type='number']";
const DOTS_CLASS = "global-npc-dossier__dots";
const NATIVE_CLASS = "global-npc-dossier__score-native";
const MAX_SCORE = 5;

function currentScore(input: HTMLInputElement): number {
  const value = Number.parseInt(input.value, 10);
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_SCORE, value)) : 0;
}

function syncDots(input: HTMLInputElement): void {
  const dots = input.nextElementSibling;
  if (!(dots instanceof HTMLElement) || !dots.classList.contains(DOTS_CLASS)) return;

  const value = currentScore(input);
  dots.querySelectorAll<HTMLButtonElement>("button[data-score]").forEach((dot) => {
    const score = Number(dot.dataset.score);
    const filled = score <= value;
    dot.classList.toggle("is-filled", filled);
    dot.setAttribute("aria-checked", String(score === value));
  });
  dots.setAttribute("aria-label", `Puntuación actual: ${value} de ${MAX_SCORE}`);
}

function setNativeValue(input: HTMLInputElement, value: number): void {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;

  if (setter) setter.call(input, String(value));
  else input.value = String(value);

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  syncDots(input);
}

function decorateScore(input: HTMLInputElement): void {
  if (input.dataset.dossierDots === "true") {
    syncDots(input);
    return;
  }

  input.dataset.dossierDots = "true";
  input.classList.add(NATIVE_CLASS);

  const dots = document.createElement("div");
  dots.className = DOTS_CLASS;
  dots.setAttribute("role", "radiogroup");

  for (let score = 1; score <= MAX_SCORE; score += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "global-npc-dossier__dot";
    dot.dataset.score = String(score);
    dot.setAttribute("role", "radio");
    dot.setAttribute("aria-label", `${score} de ${MAX_SCORE}`);
    dot.title = `Valor ${score}. Pulsa de nuevo el valor actual para dejarlo en 0.`;
    dot.addEventListener("click", () => {
      const nextValue = currentScore(input) === score ? 0 : score;
      setNativeValue(input, nextValue);
    });
    dots.append(dot);
  }

  input.insertAdjacentElement("afterend", dots);
  syncDots(input);
}

function enhanceDossierScores(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>(DOSSIER_SCORE_SELECTOR).forEach(decorateScore);
}

const dossierObserver = new MutationObserver((mutations) => {
  if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
    enhanceDossierScores();
  }
});

enhanceDossierScores();
dossierObserver.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.matches(DOSSIER_SCORE_SELECTOR)) {
    syncDots(event.target);
  }
});

export {};
