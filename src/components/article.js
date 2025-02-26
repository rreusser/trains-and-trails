import { html } from "htm/preact";
import { useRef, useEffect, useContext } from "preact/hooks";
import pageControllerContext from "../data/page-controller-context.js";
import Ratings from "./ratings.js";
import quadInOut from "eases/quad-in-out.js";
import lerp from "../util/lerp.js";

const EXTERNAL_URL_REGEX = /^http/;
let initialLoad = true;

const SIMPLIFY_LAYERS = ["", "introduction/"];

function Article({ page, setPath }) {
  const contentContainer = useRef(null);
  const pageController = useContext(pageControllerContext);

  const isHome = page.metadata.path === "";
  const isFront = page.metadata.isFront;

  useEffect(async () => {
    await pageController.ready();

    pageController.setSimplifiedMode(
      SIMPLIFY_LAYERS.indexOf(page.metadata.path) !== -1
    );

    const routePath = page.metadata.routeurl;
    if (routePath) {
      fetch(routePath)
        .then((response) => {
          if (!response.ok) throw new Error("failed to load route");
          return response.json();
        })
        .then((geojson) => {
          pageController.setRoute(geojson, page.metadata.bounds, initialLoad);
          window.dispatchEvent(new CustomEvent("scroll"));
          initialLoad = false;
        });
    } else {
      pageController.clearRoute(initialLoad ? null : page.metadata.bounds);
      initialLoad = false;
    }
  }, []);

  function navigate(event) {
    const a =
      event.target.tagName === "A" ? event.target : event.target.closest("a");
    if (!a) return;
    let href = a.getAttribute("href");
    if (EXTERNAL_URL_REGEX.test(href)) return;

    if (!href.endsWith("/")) href += "/";
    if (href === "/") href = "";

    event.stopPropagation();
    event.preventDefault();

    setPath(href);
  }

  useEffect(() => {
    if (!contentContainer.current) return;
    contentContainer.current.addEventListener("click", navigate);
    const { current: el } = contentContainer;
    const controlEls = el.querySelectorAll("[data-route-mode]");

    function computePosition(event) {
      const offset = window.innerHeight * 0.15;
      const stops = [];
      for (const c of controlEls)
        stops.push(c.getBoundingClientRect().y - offset);
      let i;
      for (i = 0; i < stops.length && stops[i] < 0; i++);
      i = Math.max(i - 1, 0);
      const from = controlEls[Math.max(0, i)];
      const to = controlEls[Math.min(i + 1, controlEls.length - 1)];
      let position = Math.max(
        0,
        Math.min(1, -stops[i] / (stops[i + 1] - stops[i]))
      );
      //position = Math.floor(position) + quadInOut(position);

      const fromProgress = from
        ? parseFloat(from.getAttribute("data-route-progress"))
        : 0;
      let toProgress = to
        ? parseFloat(to.getAttribute("data-route-progress"))
        : fromProgress;
      if (isNaN(toProgress)) toProgress = fromProgress;
      const progress = lerp(fromProgress, toProgress, position);

      const mode = from ? from.getAttribute("data-route-mode") : "bound";

      pageController.setProgress(mode, progress);
    }

    const onResize = (event) => computePosition(event, true);

    window.addEventListener("scroll", computePosition);
    window.addEventListener("resize", onResize);
    onResize(null, true);

    return () => {
      contentContainer.current.removeEventListener("click", navigate);
      window.removeEventListener("scroll", computePosition);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!contentContainer.current) return;
    let commentDst = contentContainer.current.querySelector(".giscus-comments");
    if (!commentDst) {
      commentDst = contentContainer.current.querySelector(
        ".articleContent--conclusion"
      );
    }

    if (commentDst) {
      const giscusTag = document.createElement("script");
      giscusTag.setAttribute("src", "https://giscus.app/client.js");
      giscusTag.setAttribute("data-repo", "rreusser/trains-and-trails");
      giscusTag.setAttribute("data-repo", "rreusser/trains-and-trails");
      giscusTag.setAttribute(
        "data-repo-id",
        "MDEwOlJlcG9zaXRvcnk0MDUyODUwMjY="
      );
      giscusTag.setAttribute("data-category", "Announcements");
      giscusTag.setAttribute("data-category-id", "DIC_kwDOGCgoos4CnXtQ");
      giscusTag.setAttribute("data-mapping", "pathname");
      giscusTag.setAttribute("data-strict", "0");
      giscusTag.setAttribute("data-reactions-enabled", "1");
      giscusTag.setAttribute("data-emit-metadata", "0");
      giscusTag.setAttribute("data-input-position", "bottom");
      giscusTag.setAttribute("data-theme", "light");
      giscusTag.setAttribute("data-lang", "en");
      giscusTag.setAttribute("crossorigin", "anonymous");
      giscusTag.setAttribute("async", "async");

      requestAnimationFrame(() => commentDst.appendChild(giscusTag));
    }
  }, []);

  return html` <div
    class="articleContainer ${isFront ? "is-front" : ""} ${isHome
      ? "is-home"
      : ""}"
  >
    <div class="articleHeader">
      ${isHome
        ? ""
        : html`<a href="" onClick=${(event) => navigate(event, "")}>← Back</a>`}
      <h1>${page.metadata.title}</h1>
      <div class="article_date">${page.metadata.date}</div>
    </div>
    <div class="articleBody">
      ${"" /*page.metadata.ratings ? html`<${Ratings}/>` : null*/}
      <div
        ref=${contentContainer}
        dangerouslySetInnerHTML=${{ __html: page.articleHTML }}
      />
    </div>
  </div>`;
}

export default Article;
