import { defineComponent, createElementBlock, shallowRef, getCurrentInstance, provide, cloneVNode, h, computed, toValue, onServerPrefetch, ref, toRef, nextTick, unref, reactive, watch, withAsyncContext, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrInterpolate } from "vue/server-renderer";
import { hash } from "D:/Development/pixelpoint/carinthia-client/node_modules/ohash/dist/index.mjs";
import { isPlainObject } from "@vue/shared";
import { a as useNuxtApp, d as asyncDataDefaults, e as createError, f as fetchDefaults, _ as _export_sfc } from "../server.mjs";
import { debounce } from "D:/Development/pixelpoint/carinthia-client/node_modules/perfect-debounce/dist/index.mjs";
import "D:/Development/pixelpoint/carinthia-client/node_modules/hookable/dist/index.mjs";
import "D:/Development/pixelpoint/carinthia-client/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "D:/Development/pixelpoint/carinthia-client/node_modules/unctx/dist/index.mjs";
import "D:/Development/pixelpoint/carinthia-client/node_modules/h3/dist/index.mjs";
import "vue-router";
import "D:/Development/pixelpoint/carinthia-client/node_modules/radix3/dist/index.mjs";
import "D:/Development/pixelpoint/carinthia-client/node_modules/defu/dist/defu.mjs";
import "D:/Development/pixelpoint/carinthia-client/node_modules/ufo/dist/index.mjs";
function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
function useRequestFetch() {
  return useRequestEvent()?.$fetch || globalThis.$fetch;
}
defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      if (mounted.value) {
        const vnodes = slots.default?.();
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  options.server ??= true;
  options.default ??= getDefault;
  options.getCachedData ??= getDefaultCachedData;
  options.lazy ??= false;
  options.immediate ??= true;
  options.deep ??= asyncDataDefaults.deep;
  options.dedupe ??= "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!nuxtApp._asyncData[key.value]?._init) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
    pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
    status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
    error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
    refresh: (...args2) => {
      if (!nuxtApp._asyncData[key.value]?._init) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry?._abortController) {
        try {
          entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      return getter()?.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    {
      nuxtApp._asyncData[key].pending.value = false;
    }
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  nuxtApp.payload._errors[key] ??= asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = !import.meta.prerender || !nuxtApp.ssrContext?._sharedPrerenderCache ? _handler : (nuxtApp2, options2) => {
    const value = nuxtApp2.ssrContext._sharedPrerenderCache.get(key);
    if (value) {
      return value;
    }
    const promise = Promise.resolve().then(() => nuxtApp2.runWithContext(() => _handler(nuxtApp2, options2)));
    nuxtApp2.ssrContext._sharedPrerenderCache.set(key, promise);
    return promise;
  };
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData != null;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: shallowRef(!hasCachedData),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer(opts.dedupe ?? options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
        if (cachedData != null) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = asyncDataDefaults.errorValue;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      {
        asyncData.pending.value = true;
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          try {
            const timeout = opts.timeout ?? options.timeout;
            const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = asyncDataDefaults.errorValue;
        asyncData.status.value = "success";
      }).catch((error) => {
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return;
        }
        if (asyncData._abortController?.signal.aborted) {
          return;
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return;
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        {
          asyncData.pending.value = false;
        }
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      unsubRefreshAsyncData();
      if (nuxtApp._asyncData[key]?._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          if (!nuxtApp._asyncData[key]?._init) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
            asyncData.data.value = asyncDataDefaults.value;
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => asyncDataDefaults.value;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = AbortSignal.timeout?.(timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    const abortedSignal = list.find((s) => s.aborted);
    const reason = abortedSignal?.reason ?? new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    sig.addEventListener?.("abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
function useFetch(request, arg1, arg2) {
  const [opts = {}, autoKey] = [{}, arg1];
  const _request = computed(() => toValue(request));
  const key = computed(() => toValue(opts.key) || "$f" + hash([autoKey, typeof _request.value === "string" ? _request.value : "", ...generateOptionSegments(opts)]));
  if (!opts.baseURL && typeof _request.value === "string" && (_request.value[0] === "/" && _request.value[1] === "/")) {
    throw new Error('[nuxt] [useFetch] the request URL must not start with "//".');
  }
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick: pick2,
    watch: watchSources,
    immediate,
    getCachedData,
    deep,
    dedupe,
    timeout,
    ...fetchOptions
  } = opts;
  const _fetchOptions = reactive({
    ...fetchDefaults,
    ...fetchOptions,
    cache: typeof opts.cache === "boolean" ? void 0 : opts.cache
  });
  const _asyncDataOptions = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick: pick2,
    immediate,
    getCachedData,
    deep,
    dedupe,
    timeout,
    watch: watchSources === false ? [] : [...watchSources || [], _fetchOptions]
  };
  if (!immediate) {
    let setImmediate = function() {
      _asyncDataOptions.immediate = true;
    };
    watch(key, setImmediate, { flush: "sync", once: true });
    watch([...watchSources || [], _fetchOptions], setImmediate, { flush: "sync", once: true });
  }
  const asyncData = useAsyncData(watchSources === false ? key.value : key, (_, { signal }) => {
    let _$fetch = opts.$fetch || globalThis.$fetch;
    if (!opts.$fetch) {
      const isLocalFetch = typeof _request.value === "string" && _request.value[0] === "/" && (!toValue(opts.baseURL) || toValue(opts.baseURL)[0] === "/");
      if (isLocalFetch) {
        _$fetch = useRequestFetch();
      }
    }
    return _$fetch(_request.value, { signal, ..._fetchOptions });
  }, _asyncDataOptions);
  return asyncData;
}
function generateOptionSegments(opts) {
  const segments = [
    toValue(opts.method)?.toUpperCase() || "GET",
    toValue(opts.baseURL)
  ];
  for (const _obj of [opts.query || opts.params]) {
    const obj = toValue(_obj);
    if (!obj) {
      continue;
    }
    const unwrapped = {};
    for (const [key, value] of Object.entries(obj)) {
      unwrapped[toValue(key)] = toValue(value);
    }
    segments.push(unwrapped);
  }
  if (opts.body) {
    const value = toValue(opts.body);
    if (!value) {
      segments.push(hash(value));
    } else if (value instanceof ArrayBuffer) {
      segments.push(hash(Object.fromEntries([...new Uint8Array(value).entries()].map(([k, v]) => [k, v.toString()]))));
    } else if (value instanceof FormData) {
      const obj = {};
      for (const entry of value.entries()) {
        const [key, val] = entry;
        obj[key] = val instanceof File ? val.name : val;
      }
      segments.push(hash(obj));
    } else if (isPlainObject(value)) {
      segments.push(hash(reactive(value)));
    } else {
      try {
        segments.push(hash(value));
      } catch {
        console.warn("[useFetch] Failed to hash body", value);
      }
    }
  }
  return segments;
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data, pending, error } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/carinthia", "$77hSeXQoip")), __temp = await __temp, __restore(), __temp);
    const pageSize = ref(10);
    const search = ref("");
    const graph = computed(() => {
      const root = data.value || {};
      return Array.isArray(root["@graph"]) ? root["@graph"] : [];
    });
    const placesById = computed(() => {
      const map = {};
      for (const node of graph.value) {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        if (types.includes("Place")) {
          map[node["@id"]] = node;
        }
      }
      return map;
    });
    const conceptsById = computed(() => {
      const map = {};
      for (const node of graph.value) {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        if (types.includes("skos:Concept")) {
          map[node["@id"]] = node;
        }
      }
      return map;
    });
    const events = computed(() => {
      return graph.value.filter((node) => {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        return types.includes("Event") || types.includes("dcls:Event");
      });
    });
    const filteredEvents = computed(() => {
      if (!search.value) return events.value;
      const term = search.value.toLowerCase();
      return events.value.filter((ev) => {
        const name = (ev.name || "").toLowerCase();
        const desc = stripHtml(ev.description || "").toLowerCase();
        return name.includes(term) || desc.includes(term);
      });
    });
    const visibleEvents = computed(
      () => filteredEvents.value.slice(0, pageSize.value)
    );
    function stripHtml(html) {
      return html.replace(/<[^>]+>/g, "");
    }
    function truncate(text, max) {
      if (text.length <= max) return text;
      return text.slice(0, max).trim() + " …";
    }
    function formatDate(value) {
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("de-AT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
    function formatTime(value) {
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString("de-AT", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    function formatDateRange(ev) {
      const start = formatDate(ev.startDate);
      const end = formatDate(ev.endDate);
      if (start && end && start !== end) {
        return `${start} - ${end}`;
      }
      if (start) return start;
      return "Datum: keine Angabe";
    }
    function formatTimeRange(ev) {
      const start = formatTime(ev.startDate);
      const end = formatTime(ev.endDate);
      if (start && end && start !== end) {
        return `${start} - ${end} Uhr`;
      }
      if (start) return `${start} Uhr`;
      return "Uhrzeit: keine Angabe";
    }
    function getVenue(ev) {
      const locRef = Array.isArray(ev.location) ? ev.location[0]?.["@id"] : null;
      if (!locRef) return "Veranstaltungsort: keine Angabe";
      const place = placesById.value[locRef];
      const name = place?.name;
      return name ? `Veranstaltungsort: ${name}` : "Veranstaltungsort: keine Angabe";
    }
    function getCategories(ev) {
      const cls = ev["dc:classification"];
      if (!Array.isArray(cls) || cls.length === 0) return "Kategorie: keine Angabe";
      const labels = [];
      for (const c of cls) {
        const id = c?.["@id"];
        if (!id) continue;
        const concept = conceptsById.value[id];
        const label = concept?.prefLabel || concept?.["skos:prefLabel"] || concept?.name || null;
        if (label) labels.push(label);
      }
      if (labels.length === 0) return "Kategorie: keine Angabe";
      return "Kategorie: " + labels.join(", ");
    }
    function getImageUrl(ev) {
      const images = ev.image;
      if (!Array.isArray(images) || images.length === 0) return null;
      const img = images[0];
      return img.thumbnailUrl || img["dc:dynamicDefaultUrl"] || img.contentUrl || img["dc:webUrl"] || null;
    }
    function getTitle(ev) {
      return ev.name || "Ohne Titel";
    }
    function getShortDescription(ev) {
      const text = stripHtml(ev.description || "");
      if (!text) return "";
      return truncate(text, 260);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page" }, _attrs))} data-v-bd265af5><header class="site-header" data-v-bd265af5><div class="header-inner" data-v-bd265af5><div class="branding" data-v-bd265af5><div class="branding-title" data-v-bd265af5> Veranstaltungsdatenbank Kärnten </div><div class="branding-sub" data-v-bd265af5> Die Plattform für Ihr Event </div></div><nav class="main-nav" aria-label="Hauptnavigation" data-v-bd265af5><ul data-v-bd265af5><li data-v-bd265af5><button type="button" data-v-bd265af5>Musik</button></li><li data-v-bd265af5><button type="button" data-v-bd265af5>Theater &amp; Tanz</button></li><li data-v-bd265af5><button type="button" data-v-bd265af5>Literatur</button></li><li data-v-bd265af5><button type="button" data-v-bd265af5>Festivals &amp; Feste</button></li><li data-v-bd265af5><button type="button" data-v-bd265af5>Ausstellungen</button></li><li data-v-bd265af5><button type="button" data-v-bd265af5>Kinder &amp; Jugend</button></li><li data-v-bd265af5><button type="button" class="primary" data-v-bd265af5> Event eintragen </button></li></ul></nav></div></header><main class="site-main" data-v-bd265af5><section class="hero" data-v-bd265af5><h1 data-v-bd265af5>Veranstaltungen in Kärnten</h1><p data-v-bd265af5>Das vielfältige Kulturangebot im Süden.</p></section><section class="filters" data-v-bd265af5><label class="search-label" data-v-bd265af5><span data-v-bd265af5>Suche</span><input${ssrRenderAttr("value", unref(search))} type="search" placeholder="Nach Titel oder Beschreibung suchen …" data-v-bd265af5></label></section><section class="events" data-v-bd265af5>`);
      if (unref(pending)) {
        _push(`<div class="status" data-v-bd265af5> Veranstaltungen werden geladen … </div>`);
      } else if (unref(error)) {
        _push(`<div class="status status-error" data-v-bd265af5> Fehler beim Laden der Veranstaltungen. </div>`);
      } else {
        _push(`<ul class="event-list" data-v-bd265af5><!--[-->`);
        ssrRenderList(unref(visibleEvents), (ev) => {
          _push(`<li class="event-card" data-v-bd265af5>`);
          if (getImageUrl(ev)) {
            _push(`<div class="event-image" data-v-bd265af5><img${ssrRenderAttr("src", getImageUrl(ev))}${ssrRenderAttr("alt", getTitle(ev))} loading="lazy" data-v-bd265af5></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="event-content" data-v-bd265af5><h2 class="event-title" data-v-bd265af5>${ssrInterpolate(getTitle(ev))}</h2><div class="event-meta" data-v-bd265af5><div data-v-bd265af5><strong data-v-bd265af5>Datum:</strong> ${ssrInterpolate(formatDateRange(ev))}</div><div data-v-bd265af5><strong data-v-bd265af5>Uhrzeit:</strong> ${ssrInterpolate(formatTimeRange(ev))}</div><div data-v-bd265af5>${ssrInterpolate(getVenue(ev))}</div><div data-v-bd265af5>${ssrInterpolate(getCategories(ev))}</div></div>`);
          if (getShortDescription(ev)) {
            _push(`<p class="event-description" data-v-bd265af5>${ssrInterpolate(getShortDescription(ev))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="event-actions" data-v-bd265af5>`);
          {
            _push(`<button type="button" class="details-link details-link--disabled" data-v-bd265af5> Details </button>`);
          }
          _push(`</div></div></li>`);
        });
        _push(`<!--]--></ul>`);
      }
      if (!unref(pending) && !unref(error) && unref(visibleEvents).length === 0) {
        _push(`<div class="status" data-v-bd265af5> Keine Veranstaltungen gefunden. </div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(visibleEvents).length < unref(filteredEvents).length) {
        _push(`<div class="load-more-wrapper" data-v-bd265af5><button type="button" class="load-more" data-v-bd265af5> Mehr </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section></main><footer class="site-footer" data-v-bd265af5><div class="footer-inner" data-v-bd265af5><div class="footer-block" data-v-bd265af5><div class="footer-title" data-v-bd265af5> Amt der Kärntner Landesregierung </div><div data-v-bd265af5>Abteilung 14 – Kunst und Kultur</div><div data-v-bd265af5>Burggasse 8 · 9021 Klagenfurt am Wörthersee</div><div data-v-bd265af5>+43 (0) 50 536 – 34006</div><div data-v-bd265af5>abt14.post@ktn.gv.at</div></div><div class="footer-links" data-v-bd265af5><a href="#" data-v-bd265af5>Impressum</a><a href="#" data-v-bd265af5>Datenschutzerklärung</a><a href="#" data-v-bd265af5>Barrierefreiheit</a></div></div></footer></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-bd265af5"]]);
export {
  index as default
};
//# sourceMappingURL=index-BPRrogtt.js.map
