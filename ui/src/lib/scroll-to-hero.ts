export const SCROLL_HERO_KEY = "vf-scroll-hero";

export function scrollToLandingHero(behavior: ScrollBehavior = "smooth") {
  document.getElementById("product")?.scrollIntoView({ behavior });
}

export function requestScrollToLandingHero() {
  sessionStorage.setItem(SCROLL_HERO_KEY, "1");
}

export function consumeScrollToLandingHeroRequest() {
  if (sessionStorage.getItem(SCROLL_HERO_KEY)) {
    sessionStorage.removeItem(SCROLL_HERO_KEY);
    return true;
  }
  return false;
}
