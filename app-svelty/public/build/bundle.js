
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.17.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          }
          return lo;
        },
        right: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;
            else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    function ascendingComparator(f) {
      return function(d, x) {
        return ascending(f(d), x);
      };
    }

    var ascendingBisect = bisector(ascending);
    var bisectRight = ascendingBisect.right;

    function extent(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          min,
          max;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            min = max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null) {
                if (min > value) min = value;
                if (max < value) max = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            min = max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null) {
                if (min > value) min = value;
                if (max < value) max = value;
              }
            }
          }
        }
      }

      return [min, max];
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) ticks[i] = (start + i) * step;
      } else {
        start = Math.floor(start * step);
        stop = Math.ceil(stop * step);
        ticks = new Array(n = Math.ceil(start - stop + 1));
        while (++i < n) ticks[i] = (start - i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    function max(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          max;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null && value > max) {
                max = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null && value > max) {
                max = value;
              }
            }
          }
        }
      }

      return max;
    }

    function min(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          min;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            min = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null && min > value) {
                min = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            min = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null && min > value) {
                min = value;
              }
            }
          }
        }
      }

      return min;
    }

    var noop$1 = {value: function() {}};

    function dispatch$1() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch$1.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy: function(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? new Rgb(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? new Rgb((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return "#" + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "hsl(" : "hsla(")
            + (this.h || 0) + ", "
            + (this.s || 0) * 100 + "%, "
            + (this.l || 0) * 100 + "%"
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    function constant(x) {
      return function() {
        return x;
      };
    }

    function linear(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear(a, d) : constant(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolateValue(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolateValue(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
          : b instanceof color ? interpolateRgb
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    var emptyOn = dispatch$1("start", "end", "cancel", "interrupt");

    var pi = Math.PI,
        tau = 2 * pi,
        epsilon = 1e-6,
        tauEpsilon = tau - epsilon;

    function Path() {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null; // end of current subpath
      this._ = "";
    }

    function path() {
      return new Path;
    }

    Path.prototype = path.prototype = {
      constructor: Path,
      moveTo: function(x, y) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
      },
      closePath: function() {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._ += "Z";
        }
      },
      lineTo: function(x, y) {
        this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      quadraticCurveTo: function(x1, y1, x, y) {
        this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      bezierCurveTo: function(x1, y1, x2, y2, x, y) {
        this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      arcTo: function(x1, y1, x2, y2, r) {
        x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
        var x0 = this._x1,
            y0 = this._y1,
            x21 = x2 - x1,
            y21 = y2 - y1,
            x01 = x0 - x1,
            y01 = y0 - y1,
            l01_2 = x01 * x01 + y01 * y01;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x1,y1).
        if (this._x1 === null) {
          this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (!(l01_2 > epsilon));

        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
          var x20 = x2 - x0,
              y20 = y2 - y0,
              l21_2 = x21 * x21 + y21 * y21,
              l20_2 = x20 * x20 + y20 * y20,
              l21 = Math.sqrt(l21_2),
              l01 = Math.sqrt(l01_2),
              l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
              t01 = l / l01,
              t21 = l / l21;

          // If the start tangent is not coincident with (x0,y0), line to.
          if (Math.abs(t01 - 1) > epsilon) {
            this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
          }

          this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
        }
      },
      arc: function(x, y, r, a0, a1, ccw) {
        x = +x, y = +y, r = +r, ccw = !!ccw;
        var dx = r * Math.cos(a0),
            dy = r * Math.sin(a0),
            x0 = x + dx,
            y0 = y + dy,
            cw = 1 ^ ccw,
            da = ccw ? a0 - a1 : a1 - a0;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x0,y0).
        if (this._x1 === null) {
          this._ += "M" + x0 + "," + y0;
        }

        // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
        else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
          this._ += "L" + x0 + "," + y0;
        }

        // Is this arc empty? We’re done.
        if (!r) return;

        // Does the angle go the wrong way? Flip the direction.
        if (da < 0) da = da % tau + tau;

        // Is this a complete circle? Draw two arcs to complete the circle.
        if (da > tauEpsilon) {
          this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
        }

        // Is this arc non-empty? Draw an arc!
        else if (da > epsilon) {
          this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
        }
      },
      rect: function(x, y, w, h) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
      },
      toString: function() {
        return this._;
      }
    };

    var prefix = "$";

    function Map$1() {}

    Map$1.prototype = map.prototype = {
      constructor: Map$1,
      has: function(key) {
        return (prefix + key) in this;
      },
      get: function(key) {
        return this[prefix + key];
      },
      set: function(key, value) {
        this[prefix + key] = value;
        return this;
      },
      remove: function(key) {
        var property = prefix + key;
        return property in this && delete this[property];
      },
      clear: function() {
        for (var property in this) if (property[0] === prefix) delete this[property];
      },
      keys: function() {
        var keys = [];
        for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
        return keys;
      },
      values: function() {
        var values = [];
        for (var property in this) if (property[0] === prefix) values.push(this[property]);
        return values;
      },
      entries: function() {
        var entries = [];
        for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
        return entries;
      },
      size: function() {
        var size = 0;
        for (var property in this) if (property[0] === prefix) ++size;
        return size;
      },
      empty: function() {
        for (var property in this) if (property[0] === prefix) return false;
        return true;
      },
      each: function(f) {
        for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
      }
    };

    function map(object, f) {
      var map = new Map$1;

      // Copy constructor.
      if (object instanceof Map$1) object.each(function(value, key) { map.set(key, value); });

      // Index array by numeric index or specified key function.
      else if (Array.isArray(object)) {
        var i = -1,
            n = object.length,
            o;

        if (f == null) while (++i < n) map.set(i, object[i]);
        else while (++i < n) map.set(f(o = object[i], i, object), o);
      }

      // Convert object to map.
      else if (object) for (var key in object) map.set(key, object[key]);

      return map;
    }

    function nest() {
      var keys = [],
          sortKeys = [],
          sortValues,
          rollup,
          nest;

      function apply(array, depth, createResult, setResult) {
        if (depth >= keys.length) {
          if (sortValues != null) array.sort(sortValues);
          return rollup != null ? rollup(array) : array;
        }

        var i = -1,
            n = array.length,
            key = keys[depth++],
            keyValue,
            value,
            valuesByKey = map(),
            values,
            result = createResult();

        while (++i < n) {
          if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
            values.push(value);
          } else {
            valuesByKey.set(keyValue, [value]);
          }
        }

        valuesByKey.each(function(values, key) {
          setResult(result, key, apply(values, depth, createResult, setResult));
        });

        return result;
      }

      function entries(map, depth) {
        if (++depth > keys.length) return map;
        var array, sortKey = sortKeys[depth - 1];
        if (rollup != null && depth >= keys.length) array = map.entries();
        else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
        return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
      }

      return nest = {
        object: function(array) { return apply(array, 0, createObject, setObject); },
        map: function(array) { return apply(array, 0, createMap, setMap); },
        entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
        key: function(d) { keys.push(d); return nest; },
        sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
        sortValues: function(order) { sortValues = order; return nest; },
        rollup: function(f) { rollup = f; return nest; }
      };
    }

    function createObject() {
      return {};
    }

    function setObject(object, key, value) {
      object[key] = value;
    }

    function createMap() {
      return map();
    }

    function setMap(map, key, value) {
      map.set(key, value);
    }

    function Set$1() {}

    var proto = map.prototype;

    Set$1.prototype = set$1.prototype = {
      constructor: Set$1,
      has: proto.has,
      add: function(value) {
        value += "";
        this[prefix + value] = value;
        return this;
      },
      remove: proto.remove,
      clear: proto.clear,
      values: proto.keys,
      size: proto.size,
      empty: proto.empty,
      each: proto.each
    };

    function set$1(object, f) {
      var set = new Set$1;

      // Copy constructor.
      if (object instanceof Set$1) object.each(function(value) { set.add(value); });

      // Otherwise, assume it’s an array.
      else if (object) {
        var i = -1, n = object.length;
        if (f == null) while (++i < n) set.add(object[i]);
        else while (++i < n) set.add(f(object[i], i, object));
      }

      return set;
    }

    var EOL = {},
        EOF = {},
        QUOTE = 34,
        NEWLINE = 10,
        RETURN = 13;

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "] || \"\"";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function pad(value, width) {
      var s = value + "", length = s.length;
      return length < width ? new Array(width - length + 1).join(0) + s : s;
    }

    function formatYear(year) {
      return year < 0 ? "-" + pad(-year, 6)
        : year > 9999 ? "+" + pad(year, 6)
        : pad(year, 4);
    }

    function formatDate(date) {
      var hours = date.getUTCHours(),
          minutes = date.getUTCMinutes(),
          seconds = date.getUTCSeconds(),
          milliseconds = date.getUTCMilliseconds();
      return isNaN(date) ? "Invalid Date"
          : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
          + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "");
    }

    function dsvFormat(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
          DELIMITER = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns || [];
        return rows;
      }

      function parseRows(text, f) {
        var rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // current line number
            t, // current token
            eof = N <= 0, // current token followed by EOF?
            eol = false; // current token followed by EOL?

        // Strip the trailing newline.
        if (text.charCodeAt(N - 1) === NEWLINE) --N;
        if (text.charCodeAt(N - 1) === RETURN) --N;

        function token() {
          if (eof) return EOF;
          if (eol) return eol = false, EOL;

          // Unescape quotes.
          var i, j = I, c;
          if (text.charCodeAt(j) === QUOTE) {
            while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
          }

          // Find next delimiter or newline.
          while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
          }

          // Return last token before EOF.
          return eof = true, text.slice(j, N);
        }

        while ((t = token()) !== EOF) {
          var row = [];
          while (t !== EOL && t !== EOF) row.push(t), t = token();
          if (f && (row = f(row, n++)) == null) continue;
          rows.push(row);
        }

        return rows;
      }

      function preformatBody(rows, columns) {
        return rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        });
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
      }

      function formatBody(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return preformatBody(rows, columns).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(value) {
        return value == null ? ""
            : value instanceof Date ? formatDate(value)
            : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
            : value;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatBody: formatBody,
        formatRows: formatRows,
        formatRow: formatRow,
        formatValue: formatValue
      };
    }

    var csv = dsvFormat(",");

    var csvParse = csv.parse;

    function responseText(response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.text();
    }

    function text$1(input, init) {
      return fetch(input, init).then(responseText);
    }

    function dsvParse(parse) {
      return function(input, init, row) {
        if (arguments.length === 2 && typeof init === "function") row = init, init = undefined;
        return text$1(input, init).then(function(response) {
          return parse(response, row);
        });
      };
    }

    var csv$1 = dsvParse(csvParse);

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimal(1.23) returns ["123", 0].
    function formatDecimal(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": function(x, p) { return (x * 100).toFixed(p); },
      "b": function(x) { return Math.round(x).toString(2); },
      "c": function(x) { return x + ""; },
      "d": function(x) { return Math.round(x).toString(10); },
      "e": function(x, p) { return x.toExponential(p); },
      "f": function(x, p) { return x.toFixed(p); },
      "g": function(x, p) { return x.toPrecision(p); },
      "o": function(x) { return Math.round(x).toString(8); },
      "p": function(x, p) { return formatRounded(x * 100, p); },
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
      "x": function(x) { return Math.round(x).toString(16); }
    };

    function identity$1(x) {
      return x;
    }

    var map$1 = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map$1.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map$1.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "-" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Perform the initial formatting.
            var valueNegative = value < 0;
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero during formatting, treat as positive.
            if (valueNegative && +value === 0) valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;

            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale;
    var format;
    var formatPrefix;

    defaultLocale({
      decimal: ".",
      thousands: ",",
      grouping: [3],
      currency: ["$", ""],
      minus: "-"
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      format = locale.format;
      formatPrefix = locale.formatPrefix;
      return locale;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    var array = Array.prototype;

    var map$2 = array.map;
    var slice = array.slice;

    var implicit = {name: "implicit"};

    function ordinal() {
      var index = map(),
          domain = [],
          range = [],
          unknown = implicit;

      function scale(d) {
        var key = d + "", i = index.get(key);
        if (!i) {
          if (unknown !== implicit) return unknown;
          index.set(key, i = domain.push(d));
        }
        return range[(i - 1) % range.length];
      }

      scale.domain = function(_) {
        if (!arguments.length) return domain.slice();
        domain = [], index = map();
        var i = -1, n = _.length, d, key;
        while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
        return scale;
      };

      scale.range = function(_) {
        return arguments.length ? (range = slice.call(_), scale) : range.slice();
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      scale.copy = function() {
        return ordinal(domain, range).unknown(unknown);
      };

      initRange.apply(scale, arguments);

      return scale;
    }

    function constant$1(x) {
      return function() {
        return x;
      };
    }

    function number(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity$2(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constant$1(isNaN(b) ? NaN : 0.5);
    }

    function clamper(domain) {
      var a = domain[0], b = domain[domain.length - 1], t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisectRight(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate = interpolateValue,
          transform,
          untransform,
          unknown,
          clamp = identity$2,
          piecewise,
          output,
          input;

      function rescale() {
        piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = map$2.call(_, number), clamp === identity$2 || (clamp = clamper(domain)), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = slice.call(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = slice.call(_), interpolate = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? clamper(domain) : identity$2, scale) : clamp !== identity$2;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate = _, rescale()) : interpolate;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous(transform, untransform) {
      return transformer()(transform, untransform);
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain(),
            i0 = 0,
            i1 = d.length - 1,
            start = d[i0],
            stop = d[i1],
            step;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }

        step = tickIncrement(start, stop, count);

        if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
          step = tickIncrement(start, stop, count);
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
          step = tickIncrement(start, stop, count);
        }

        if (step > 0) {
          d[i0] = Math.floor(start / step) * step;
          d[i1] = Math.ceil(stop / step) * step;
          domain(d);
        } else if (step < 0) {
          d[i0] = Math.ceil(start * step) / step;
          d[i1] = Math.floor(stop * step) / step;
          domain(d);
        }

        return scale;
      };

      return scale;
    }

    function linear$1() {
      var scale = continuous(identity$2, identity$2);

      scale.copy = function() {
        return copy(scale, linear$1());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    function constant$2(x) {
      return function constant() {
        return x;
      };
    }

    function Linear(context) {
      this._context = context;
    }

    Linear.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; // proceed
          default: this._context.lineTo(x, y); break;
        }
      }
    };

    function curveLinear(context) {
      return new Linear(context);
    }

    function x(p) {
      return p[0];
    }

    function y(p) {
      return p[1];
    }

    function line() {
      var x$1 = x,
          y$1 = y,
          defined = constant$2(true),
          context = null,
          curve = curveLinear,
          output = null;

      function line(data) {
        var i,
            n = data.length,
            d,
            defined0 = false,
            buffer;

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) output.lineStart();
            else output.lineEnd();
          }
          if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      line.x = function(_) {
        return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$2(+_), line) : x$1;
      };

      line.y = function(_) {
        return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$2(+_), line) : y$1;
      };

      line.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), line) : defined;
      };

      line.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
      };

      line.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
      };

      return line;
    }

    function sign(x) {
      return x < 0 ? -1 : 1;
    }

    // Calculate the slopes of the tangents (Hermite-type interpolation) based on
    // the following paper: Steffen, M. 1990. A Simple Method for Monotonic
    // Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
    // NOV(II), P. 443, 1990.
    function slope3(that, x2, y2) {
      var h0 = that._x1 - that._x0,
          h1 = x2 - that._x1,
          s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
          s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
          p = (s0 * h1 + s1 * h0) / (h0 + h1);
      return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
    }

    // Calculate a one-sided slope.
    function slope2(that, t) {
      var h = that._x1 - that._x0;
      return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
    }

    // According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
    // "you can express cubic Hermite interpolation in terms of cubic Bézier curves
    // with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
    function point(that, t0, t1) {
      var x0 = that._x0,
          y0 = that._y0,
          x1 = that._x1,
          y1 = that._y1,
          dx = (x1 - x0) / 3;
      that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
    }

    function MonotoneX(context) {
      this._context = context;
    }

    MonotoneX.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 =
        this._y0 = this._y1 =
        this._t0 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2: this._context.lineTo(this._x1, this._y1); break;
          case 3: point(this, this._t0, slope2(this, this._t0)); break;
        }
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        var t1 = NaN;

        x = +x, y = +y;
        if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; break;
          case 2: this._point = 3; point(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
          default: point(this, this._t0, t1 = slope3(this, x, y)); break;
        }

        this._x0 = this._x1, this._x1 = x;
        this._y0 = this._y1, this._y1 = y;
        this._t0 = t1;
      }
    };

    function MonotoneY(context) {
      this._context = new ReflectContext(context);
    }

    (MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
      MonotoneX.prototype.point.call(this, y, x);
    };

    function ReflectContext(context) {
      this._context = context;
    }

    ReflectContext.prototype = {
      moveTo: function(x, y) { this._context.moveTo(y, x); },
      closePath: function() { this._context.closePath(); },
      lineTo: function(x, y) { this._context.lineTo(y, x); },
      bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
    };

    function monotoneX(context) {
      return new MonotoneX(context);
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const width = writable(0);
    const height = writable(0);

    const numExpandedIndividuals = writable(0);

    /* src/CookieBanner.svelte generated by Svelte v3.17.3 */

    const file = "src/CookieBanner.svelte";

    function create_fragment(ctx) {
    	let div;
    	let t0;
    	let button0;
    	let t2;
    	let button1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Would be great to know where you all come from. So do you accept the use of cookies for Google Analytics?\n  ");
    			button0 = element("button");
    			button0.textContent = "Reject";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Accept";
    			attr_dev(button0, "id", "cookies-eu-reject");
    			attr_dev(button0, "class", "svelte-87ezl0");
    			add_location(button0, file, 2, 2, 139);
    			attr_dev(button1, "id", "cookies-eu-accept");
    			attr_dev(button1, "class", "svelte-87ezl0");
    			add_location(button1, file, 3, 2, 188);
    			attr_dev(div, "id", "cookies-eu-banner");
    			attr_dev(div, "class", "svelte-87ezl0");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(div, t2);
    			append_dev(div, button1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class CookieBanner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CookieBanner",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Defs.svelte generated by Svelte v3.17.3 */

    const file$1 = "src/components/Defs.svelte";

    function create_fragment$1(ctx) {
    	let defs;
    	let filter0;
    	let feGaussianBlur;
    	let filter1;
    	let feDiffuseLighting;
    	let fePointLight;
    	let feComposite;

    	const block = {
    		c: function create() {
    			defs = svg_element("defs");
    			filter0 = svg_element("filter");
    			feGaussianBlur = svg_element("feGaussianBlur");
    			filter1 = svg_element("filter");
    			feDiffuseLighting = svg_element("feDiffuseLighting");
    			fePointLight = svg_element("fePointLight");
    			feComposite = svg_element("feComposite");
    			attr_dev(feGaussianBlur, "in", "SourceGraphic");
    			attr_dev(feGaussianBlur, "stdDeviation", "4");
    			add_location(feGaussianBlur, file$1, 5, 4, 59);
    			attr_dev(filter0, "id", "filter-blur");
    			add_location(filter0, file$1, 4, 2, 29);
    			attr_dev(fePointLight, "x", "80");
    			attr_dev(fePointLight, "y", "80");
    			attr_dev(fePointLight, "z", "90");
    			attr_dev(fePointLight, "pointsAtX", "0");
    			attr_dev(fePointLight, "pointsAtY", "0");
    			attr_dev(fePointLight, "pointsAtZ", "0");
    			add_location(fePointLight, file$1, 10, 8, 283);
    			attr_dev(feDiffuseLighting, "result", "diffOut");
    			attr_dev(feDiffuseLighting, "in", "SourceGraphic");
    			attr_dev(feDiffuseLighting, "diffuseConstant", "1.2");
    			attr_dev(feDiffuseLighting, "lighting-color", "white");
    			add_location(feDiffuseLighting, file$1, 9, 4, 174);
    			attr_dev(feComposite, "in", "SourceGraphic");
    			attr_dev(feComposite, "in2", "diffOut");
    			attr_dev(feComposite, "operator", "arithmetic");
    			attr_dev(feComposite, "k1", "1");
    			attr_dev(feComposite, "k2", "0");
    			attr_dev(feComposite, "k3", "0");
    			attr_dev(feComposite, "k4", "0");
    			add_location(feComposite, file$1, 12, 4, 392);
    			attr_dev(filter1, "id", "point-light");
    			add_location(filter1, file$1, 8, 2, 144);
    			add_location(defs, file$1, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, defs, anchor);
    			append_dev(defs, filter0);
    			append_dev(filter0, feGaussianBlur);
    			append_dev(defs, filter1);
    			append_dev(filter1, feDiffuseLighting);
    			append_dev(feDiffuseLighting, fePointLight);
    			append_dev(filter1, feComposite);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(defs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Defs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Defs",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/components/Axes.svelte generated by Svelte v3.17.3 */
    const file$2 = "src/components/Axes.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (14:0) {#if show}
    function create_if_block(ctx) {
    	let g2;
    	let text0;
    	let t0;
    	let text0_transform_value;
    	let g0;
    	let g0_transform_value;
    	let g1;
    	let text1;
    	let t1;
    	let text1_transform_value;
    	let g2_transition;
    	let current;
    	let each_value_1 = /*ageTicks*/ ctx[4];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*tempTicks*/ ctx[5];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g2 = svg_element("g");
    			text0 = svg_element("text");
    			t0 = text("Age (years)");
    			g0 = svg_element("g");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			g1 = svg_element("g");
    			text1 = svg_element("text");
    			t1 = text("Temperature (°C)");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(text0, "class", "label svelte-1lxcqla");
    			attr_dev(text0, "transform", text0_transform_value = "translate(15 " + /*tempScale*/ ctx[1].range()[0] + ") rotate(-90)");
    			add_location(text0, file$2, 15, 4, 324);
    			attr_dev(g0, "class", "axis-age svelte-1lxcqla");
    			attr_dev(g0, "transform", g0_transform_value = "translate(0 " + /*tempScale*/ ctx[1].range()[0] + ")");
    			add_location(g0, file$2, 16, 4, 428);
    			attr_dev(text1, "class", "label svelte-1lxcqla");
    			attr_dev(text1, "transform", text1_transform_value = "translate(15 " + /*tempScale*/ ctx[1](37) + ") rotate(-90)");
    			add_location(text1, file$2, 25, 6, 746);
    			attr_dev(g1, "class", "axis-temp svelte-1lxcqla");
    			add_location(g1, file$2, 24, 4, 718);
    			attr_dev(g2, "class", "axes");
    			add_location(g2, file$2, 14, 2, 287);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g2, anchor);
    			append_dev(g2, text0);
    			append_dev(text0, t0);
    			append_dev(g2, g0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(g0, null);
    			}

    			append_dev(g2, g1);
    			append_dev(g1, text1);
    			append_dev(text1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*tempScale*/ 2 && text0_transform_value !== (text0_transform_value = "translate(15 " + /*tempScale*/ ctx[1].range()[0] + ") rotate(-90)")) {
    				attr_dev(text0, "transform", text0_transform_value);
    			}

    			if (dirty & /*ageScale, ageTicks*/ 17) {
    				each_value_1 = /*ageTicks*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(g0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty & /*tempScale*/ 2 && g0_transform_value !== (g0_transform_value = "translate(0 " + /*tempScale*/ ctx[1].range()[0] + ")")) {
    				attr_dev(g0, "transform", g0_transform_value);
    			}

    			if (!current || dirty & /*tempScale*/ 2 && text1_transform_value !== (text1_transform_value = "translate(15 " + /*tempScale*/ ctx[1](37) + ") rotate(-90)")) {
    				attr_dev(text1, "transform", text1_transform_value);
    			}

    			if (dirty & /*tempScale, tempTicks, $width*/ 42) {
    				each_value = /*tempTicks*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!g2_transition) g2_transition = create_bidirectional_transition(g2, fade, {}, true);
    				g2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!g2_transition) g2_transition = create_bidirectional_transition(g2, fade, {}, false);
    			g2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching && g2_transition) g2_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(14:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (18:6) {#each ageTicks as tick}
    function create_each_block_1(ctx) {
    	let g;
    	let text_1;
    	let t_value = /*tick*/ ctx[6].toPrecision(2) + "";
    	let t;
    	let line;
    	let g_transform_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			line = svg_element("line");
    			attr_dev(text_1, "x", "0");
    			attr_dev(text_1, "y", "0");
    			attr_dev(text_1, "class", "svelte-1lxcqla");
    			add_location(text_1, file$2, 19, 10, 592);
    			attr_dev(line, "x1", "0");
    			attr_dev(line, "y1", "-12");
    			attr_dev(line, "x2", "0");
    			attr_dev(line, "y2", "-21");
    			attr_dev(line, "class", "svelte-1lxcqla");
    			add_location(line, file$2, 20, 10, 645);
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*ageScale*/ ctx[0](/*tick*/ ctx[6]) + " 0)");
    			add_location(g, file$2, 18, 8, 536);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, text_1);
    			append_dev(text_1, t);
    			append_dev(g, line);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ageScale*/ 1 && g_transform_value !== (g_transform_value = "translate(" + /*ageScale*/ ctx[0](/*tick*/ ctx[6]) + " 0)")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(18:6) {#each ageTicks as tick}",
    		ctx
    	});

    	return block;
    }

    // (27:6) {#each tempTicks as tick}
    function create_each_block(ctx) {
    	let g;
    	let line;
    	let text_1;
    	let t_value = /*tick*/ ctx[6].toPrecision(3) + "";
    	let t;
    	let g_transform_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			line = svg_element("line");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(line, "x1", "55");
    			attr_dev(line, "y1", "0");
    			attr_dev(line, "x2", /*$width*/ ctx[3]);
    			attr_dev(line, "y2", "0");
    			attr_dev(line, "class", "svelte-1lxcqla");
    			toggle_class(line, "faint", /*tick*/ ctx[6] !== 37);
    			add_location(line, file$2, 28, 10, 941);
    			attr_dev(text_1, "x", "25");
    			attr_dev(text_1, "y", "4");
    			attr_dev(text_1, "class", "svelte-1lxcqla");
    			add_location(text_1, file$2, 29, 10, 1014);
    			attr_dev(g, "transform", g_transform_value = "translate(0 " + /*tempScale*/ ctx[1](/*tick*/ ctx[6]) + ")");
    			add_location(g, file$2, 27, 8, 884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, line);
    			append_dev(g, text_1);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$width*/ 8) {
    				attr_dev(line, "x2", /*$width*/ ctx[3]);
    			}

    			if (dirty & /*tempTicks*/ 32) {
    				toggle_class(line, "faint", /*tick*/ ctx[6] !== 37);
    			}

    			if (dirty & /*tempScale*/ 2 && g_transform_value !== (g_transform_value = "translate(0 " + /*tempScale*/ ctx[1](/*tick*/ ctx[6]) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:6) {#each tempTicks as tick}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*show*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $width;
    	validate_store(width, "width");
    	component_subscribe($$self, width, $$value => $$invalidate(3, $width = $$value));
    	let { ageScale } = $$props;
    	let { tempScale } = $$props;
    	let { show = false } = $$props;
    	const ageTicks = [20, 30, 40, 50, 60, 70];
    	const tempTicks = [36.5, 37, 37.5];
    	const writable_props = ["ageScale", "tempScale", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Axes> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("ageScale" in $$props) $$invalidate(0, ageScale = $$props.ageScale);
    		if ("tempScale" in $$props) $$invalidate(1, tempScale = $$props.tempScale);
    		if ("show" in $$props) $$invalidate(2, show = $$props.show);
    	};

    	$$self.$capture_state = () => {
    		return { ageScale, tempScale, show, $width };
    	};

    	$$self.$inject_state = $$props => {
    		if ("ageScale" in $$props) $$invalidate(0, ageScale = $$props.ageScale);
    		if ("tempScale" in $$props) $$invalidate(1, tempScale = $$props.tempScale);
    		if ("show" in $$props) $$invalidate(2, show = $$props.show);
    		if ("$width" in $$props) width.set($width = $$props.$width);
    	};

    	return [ageScale, tempScale, show, $width, ageTicks, tempTicks];
    }

    class Axes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$2, safe_not_equal, { ageScale: 0, tempScale: 1, show: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Axes",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ageScale*/ ctx[0] === undefined && !("ageScale" in props)) {
    			console.warn("<Axes> was created without expected prop 'ageScale'");
    		}

    		if (/*tempScale*/ ctx[1] === undefined && !("tempScale" in props)) {
    			console.warn("<Axes> was created without expected prop 'tempScale'");
    		}
    	}

    	get ageScale() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ageScale(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tempScale() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tempScale(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var human = 'M90.08924,3.127l3.42855,3.212c9.333,8.74363,10.21975,24.998,4.15638,34.97727A30.03274,30.03274,0,0,0,95.64054,45.257L90.909,56.50209a27.836,27.836,0,0,0-2.1787,10.79563v.99015A20.38507,20.38507,0,0,0,96.37007,84.464l68.53681,52.71876c5.01663,3.85881,6.167,11.54114,2.54341,16.98591v0c-3.30472,4.96571-9.59967,6.0703-14.12921,2.47927l-54.7433-43.40051c-3.57979-2.83806-8.46031.58867-7.66805,5.38392l9.68866,58.64177a34.55754,34.55754,0,0,0,7.756,16.88194l40.04137,46.62639a11.02223,11.02223,0,0,1,.04807,13.80078l0,0a9.654,9.654,0,0,1-15.21613-.00976l-48.05034-56.8952a10.43462,10.43462,0,0,0-16.971.99943L32.16642,251.65121c-4.28426,6.29738-12.60946,6.94285-17.6446,1.368v0a12.655,12.655,0,0,1-.83788-15.517l38.39561-54.10507a31.66828,31.66828,0,0,0,5.69259-16.66757L60.171,120.24924c.28479-5.51794-5.3525-8.9199-9.38665-5.66461L17.03828,141.81546c-4.89008,3.946-11.79063,2.3292-14.81781-3.47175l-.00446-.00854c-3.37677-6.47086-1.62737-14.73341,3.995-18.86858L58.05746,81.3341A16.80516,16.80516,0,0,0,64.6403,68.49986l.23409-5.3394a16.40469,16.40469,0,0,0-1.09428-6.65039L58.71433,43.44858a16.19259,16.19259,0,0,0-.80912-1.72389c-5.863-11.05911-5.09124-30.50234,4.34148-37.62784h0C63.41742,2.04808,79.38918-2.30622,90.08924,3.127Z';

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    function expandable(node, { expanded, direction = true, duration = 1000}) {
      const initialOpacity = +getComputedStyle(node).strokeOpacity;

      let isBlurred = false;
      let unsubOffset, unsubOpacity;
      let offset, opacity;

      const length = node.getTotalLength();
      node.style.strokeDasharray = `${length}, ${length}`;
      const currOffset = direction ? 0 : -length;
      offset = tweened(currOffset, {
        duration,
        easing: cubicInOut
      });

      const currOpacity = +getComputedStyle(node).strokeOpacity;
      opacity = tweened(currOpacity, {
        duration,
        delay: 0,
        easing: cubicInOut
      });

      unsubOffset = offset.subscribe(o => node.style.strokeDashoffset = `${o}px`);
      unsubOpacity = opacity.subscribe(o => node.style.strokeOpacity = `${o}`);

    	return {
        update (newConfig) {
          ({ expanded, direction} = newConfig);

          if ((expanded && direction) || (!expanded && !direction)) {
            offset.update(_ => -length);
          } else {
            offset.update(_ => 0);
          }
          
          if (expanded && !isBlurred) {
            opacity.update(_ => 0.3, {duration: duration * 3, delay: 5000});
            isBlurred = true;
          } else if (!expanded || expanded && isBlurred) {
            opacity.update(_ => initialOpacity, {duration, delay: 0});
            isBlurred = false;
          }
        },
        destroy() {
          unsubOffset();
          unsubOpacity();
        }
      };
    }

    function fillable(node, { duration }) {
      const opacity = tweened(0, {
        duration: duration || 1000,
        delay: Math.random() * 700,
        easing: cubicInOut
      });

      const unsubOpacity = opacity.subscribe(o => node.style.fillOpacity = `${o}`);

      opacity.update(_ => 0.4);

      return {
        destroy() {
          unsubOpacity();
        }
      };
    }

    function toggledisease(node, { radius, duration = 300, delay = 1000 }) {
      let unsub;
      let radiusTween;

      radiusTween = tweened(0, {
        duration,
        delay,
        easing: cubicInOut
      });

      unsub = radiusTween.subscribe(r => node.style.r = r);

      return {
        update({ expanded }) {
          console.log(expanded);
          radiusTween.update(_ => expanded ? radius : 0);
        },
        destroy() {
          unsub();
        }
      };
    }

    /* src/components/Individual.svelte generated by Svelte v3.17.3 */
    const file$3 = "src/components/Individual.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i].age;
    	child_ctx[23] = list[i].temp;
    	return child_ctx;
    }

    // (50:4) {#each data.filter((d) => diagnosesToShow.includes(d.diagnosis)) as { age, temp }}
    function create_each_block$1(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let toggledisease_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "diagnosis-circle svelte-9fzqmh");
    			attr_dev(circle, "cx", circle_cx_value = /*ageScale*/ ctx[3](/*age*/ ctx[22]));
    			attr_dev(circle, "cy", circle_cy_value = /*tempScale*/ ctx[4](/*temp*/ ctx[23]));
    			attr_dev(circle, "r", "0");
    			add_location(circle, file$3, 50, 6, 1491);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);

    			dispose = action_destroyer(toggledisease_action = toggledisease.call(null, circle, {
    				expanded: /*expanded*/ ctx[6],
    				radius: /*diseaseRadius*/ ctx[13],
    				duration: 1000
    			}));
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ageScale, data, diagnosesToShow*/ 44 && circle_cx_value !== (circle_cx_value = /*ageScale*/ ctx[3](/*age*/ ctx[22]))) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*tempScale, data, diagnosesToShow*/ 52 && circle_cy_value !== (circle_cy_value = /*tempScale*/ ctx[4](/*temp*/ ctx[23]))) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (toggledisease_action && is_function(toggledisease_action.update) && dirty & /*expanded, diseaseRadius*/ 8256) toggledisease_action.update.call(null, {
    				expanded: /*expanded*/ ctx[6],
    				radius: /*diseaseRadius*/ ctx[13],
    				duration: 1000
    			});
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(50:4) {#each data.filter((d) => diagnosesToShow.includes(d.diagnosis)) as { age, temp }}",
    		ctx
    	});

    	return block;
    }

    // (68:4) {#if expanded}
    function create_if_block$1(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;
    	let rect_width_value;
    	let rect_height_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = /*ageScale*/ ctx[3](/*minAge*/ ctx[10]));
    			attr_dev(rect, "y", rect_y_value = /*tempScale*/ ctx[4](/*maxTemp*/ ctx[11]));
    			attr_dev(rect, "width", rect_width_value = /*ageScale*/ ctx[3](/*maxAge*/ ctx[9]) - /*ageScale*/ ctx[3](/*minAge*/ ctx[10]));
    			attr_dev(rect, "height", rect_height_value = /*tempScale*/ ctx[4](/*minTemp*/ ctx[12]) - /*tempScale*/ ctx[4](/*maxTemp*/ ctx[11]));
    			attr_dev(rect, "class", "svelte-9fzqmh");
    			toggle_class(rect, "hide", /*expanded*/ ctx[6]);
    			add_location(rect, file$3, 68, 6, 2063);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    			/*rect_binding*/ ctx[20](rect);
    			dispose = listen_dev(rect, "click", /*click_handler_1*/ ctx[21], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ageScale, minAge*/ 1032 && rect_x_value !== (rect_x_value = /*ageScale*/ ctx[3](/*minAge*/ ctx[10]))) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (dirty & /*tempScale, maxTemp*/ 2064 && rect_y_value !== (rect_y_value = /*tempScale*/ ctx[4](/*maxTemp*/ ctx[11]))) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (dirty & /*ageScale, maxAge, minAge*/ 1544 && rect_width_value !== (rect_width_value = /*ageScale*/ ctx[3](/*maxAge*/ ctx[9]) - /*ageScale*/ ctx[3](/*minAge*/ ctx[10]))) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (dirty & /*tempScale, minTemp, maxTemp*/ 6160 && rect_height_value !== (rect_height_value = /*tempScale*/ ctx[4](/*minTemp*/ ctx[12]) - /*tempScale*/ ctx[4](/*maxTemp*/ ctx[11]))) {
    				attr_dev(rect, "height", rect_height_value);
    			}

    			if (dirty & /*expanded*/ 64) {
    				toggle_class(rect, "hide", /*expanded*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    			/*rect_binding*/ ctx[20](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(68:4) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let g4;
    	let g0;
    	let path0;
    	let fillable_action;
    	let expandable_action;
    	let g0_transform_value;
    	let g1;
    	let g2;
    	let path1;
    	let path1_d_value;
    	let expandable_action_1;
    	let path2;
    	let path2_d_value;
    	let expandable_action_2;
    	let g3;
    	let dispose;
    	let each_value = /*data*/ ctx[2].filter(/*func*/ ctx[19]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = /*expanded*/ ctx[6] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			g4 = svg_element("g");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			g1 = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			g2 = svg_element("g");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			g3 = svg_element("g");
    			if (if_block) if_block.c();
    			attr_dev(path0, "class", "human svelte-9fzqmh");
    			attr_dev(path0, "d", human);
    			attr_dev(path0, "fill", /*color*/ ctx[14]);
    			add_location(path0, file$3, 41, 4, 1130);
    			attr_dev(g0, "class", "human-icon");
    			attr_dev(g0, "transform", g0_transform_value = "translate(" + /*x*/ ctx[0] + " " + /*y*/ ctx[1] + ") scale(0.6)");
    			add_location(g0, file$3, 40, 2, 1061);
    			attr_dev(g1, "class", "diagnoses");
    			add_location(g1, file$3, 48, 2, 1376);
    			attr_dev(path1, "class", "line-blur to-blur svelte-9fzqmh");
    			attr_dev(path1, "d", path1_d_value = /*line*/ ctx[8](/*data*/ ctx[2]));
    			attr_dev(path1, "stroke", /*color*/ ctx[14]);
    			add_location(path1, file$3, 58, 4, 1751);
    			attr_dev(path2, "class", "line to-blur svelte-9fzqmh");
    			attr_dev(path2, "d", path2_d_value = /*line*/ ctx[8](/*data*/ ctx[2]));
    			add_location(path2, file$3, 62, 4, 1895);
    			attr_dev(g2, "class", "temperature-line");
    			add_location(g2, file$3, 57, 2, 1718);
    			attr_dev(g3, "class", "hover-rect");
    			add_location(g3, file$3, 66, 2, 2015);
    			attr_dev(g4, "class", "individual");
    			add_location(g4, file$3, 39, 0, 1036);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g4, anchor);
    			append_dev(g4, g0);
    			append_dev(g0, path0);
    			append_dev(g4, g1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g1, null);
    			}

    			append_dev(g4, g2);
    			append_dev(g2, path1);
    			append_dev(g2, path2);
    			append_dev(g4, g3);
    			if (if_block) if_block.m(g3, null);

    			dispose = [
    				action_destroyer(fillable_action = fillable.call(null, path0, { duration: 1000 })),
    				action_destroyer(expandable_action = expandable.call(null, path0, {
    					expanded: /*expanded*/ ctx[6],
    					direction: true,
    					duration: 1000
    				})),
    				listen_dev(path0, "click", /*click_handler*/ ctx[18], false, false, false),
    				action_destroyer(expandable_action_1 = expandable.call(null, path1, {
    					expanded: /*expanded*/ ctx[6],
    					direction: false
    				})),
    				action_destroyer(expandable_action_2 = expandable.call(null, path2, {
    					expanded: /*expanded*/ ctx[6],
    					direction: false
    				}))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (expandable_action && is_function(expandable_action.update) && dirty & /*expanded*/ 64) expandable_action.update.call(null, {
    				expanded: /*expanded*/ ctx[6],
    				direction: true,
    				duration: 1000
    			});

    			if (dirty & /*x, y*/ 3 && g0_transform_value !== (g0_transform_value = "translate(" + /*x*/ ctx[0] + " " + /*y*/ ctx[1] + ") scale(0.6)")) {
    				attr_dev(g0, "transform", g0_transform_value);
    			}

    			if (dirty & /*ageScale, data, diagnosesToShow, tempScale, expanded, diseaseRadius*/ 8316) {
    				each_value = /*data*/ ctx[2].filter(/*func*/ ctx[19]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*line, data*/ 260 && path1_d_value !== (path1_d_value = /*line*/ ctx[8](/*data*/ ctx[2]))) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (expandable_action_1 && is_function(expandable_action_1.update) && dirty & /*expanded*/ 64) expandable_action_1.update.call(null, {
    				expanded: /*expanded*/ ctx[6],
    				direction: false
    			});

    			if (dirty & /*line, data*/ 260 && path2_d_value !== (path2_d_value = /*line*/ ctx[8](/*data*/ ctx[2]))) {
    				attr_dev(path2, "d", path2_d_value);
    			}

    			if (expandable_action_2 && is_function(expandable_action_2.update) && dirty & /*expanded*/ 64) expandable_action_2.update.call(null, {
    				expanded: /*expanded*/ ctx[6],
    				direction: false
    			});

    			if (/*expanded*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(g3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g4);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $width;
    	let $height;
    	validate_store(width, "width");
    	component_subscribe($$self, width, $$value => $$invalidate(16, $width = $$value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, $$value => $$invalidate(17, $height = $$value));
    	let { x } = $$props;
    	let { y } = $$props;
    	let { data } = $$props;
    	let { sexScale } = $$props;
    	let { ageScale } = $$props;
    	let { tempScale } = $$props;
    	let { diagnosesToShow = [] } = $$props;
    	const color = sexScale(data[0].sex);
    	let expanded = false;
    	let rectElement;
    	const writable_props = ["x", "y", "data", "sexScale", "ageScale", "tempScale", "diagnosesToShow"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Individual> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(6, expanded = !expanded);
    	const func = d => diagnosesToShow.includes(d.diagnosis);

    	function rect_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, rectElement = $$value);
    		});
    	}

    	const click_handler_1 = () => $$invalidate(6, expanded = false);

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("sexScale" in $$props) $$invalidate(15, sexScale = $$props.sexScale);
    		if ("ageScale" in $$props) $$invalidate(3, ageScale = $$props.ageScale);
    		if ("tempScale" in $$props) $$invalidate(4, tempScale = $$props.tempScale);
    		if ("diagnosesToShow" in $$props) $$invalidate(5, diagnosesToShow = $$props.diagnosesToShow);
    	};

    	$$self.$capture_state = () => {
    		return {
    			x,
    			y,
    			data,
    			sexScale,
    			ageScale,
    			tempScale,
    			diagnosesToShow,
    			expanded,
    			rectElement,
    			line: line$1,
    			maxAge,
    			minAge,
    			maxTemp,
    			minTemp,
    			diseaseRadius,
    			$width,
    			$height
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("sexScale" in $$props) $$invalidate(15, sexScale = $$props.sexScale);
    		if ("ageScale" in $$props) $$invalidate(3, ageScale = $$props.ageScale);
    		if ("tempScale" in $$props) $$invalidate(4, tempScale = $$props.tempScale);
    		if ("diagnosesToShow" in $$props) $$invalidate(5, diagnosesToShow = $$props.diagnosesToShow);
    		if ("expanded" in $$props) $$invalidate(6, expanded = $$props.expanded);
    		if ("rectElement" in $$props) $$invalidate(7, rectElement = $$props.rectElement);
    		if ("line" in $$props) $$invalidate(8, line$1 = $$props.line);
    		if ("maxAge" in $$props) $$invalidate(9, maxAge = $$props.maxAge);
    		if ("minAge" in $$props) $$invalidate(10, minAge = $$props.minAge);
    		if ("maxTemp" in $$props) $$invalidate(11, maxTemp = $$props.maxTemp);
    		if ("minTemp" in $$props) $$invalidate(12, minTemp = $$props.minTemp);
    		if ("diseaseRadius" in $$props) $$invalidate(13, diseaseRadius = $$props.diseaseRadius);
    		if ("$width" in $$props) width.set($width = $$props.$width);
    		if ("$height" in $$props) height.set($height = $$props.$height);
    	};

    	let line$1;
    	let maxAge;
    	let minAge;
    	let maxTemp;
    	let minTemp;
    	let diseaseRadius;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*ageScale, tempScale*/ 24) {
    			 $$invalidate(8, line$1 = line().x(d => ageScale(d.age)).y(d => tempScale(d.temp)).curve(monotoneX));
    		}

    		if ($$self.$$.dirty & /*data*/ 4) {
    			 $$invalidate(9, maxAge = max(data.map(d => d.age)));
    		}

    		if ($$self.$$.dirty & /*data*/ 4) {
    			 $$invalidate(10, minAge = min(data.map(d => d.age)));
    		}

    		if ($$self.$$.dirty & /*data*/ 4) {
    			 $$invalidate(11, maxTemp = max(data.map(d => d.temp)));
    		}

    		if ($$self.$$.dirty & /*data*/ 4) {
    			 $$invalidate(12, minTemp = min(data.map(d => d.temp)));
    		}

    		if ($$self.$$.dirty & /*$width, $height*/ 196608) {
    			 $$invalidate(13, diseaseRadius = Math.min($width, $height) / 100);
    		}

    		if ($$self.$$.dirty & /*expanded, $height*/ 131136) {
    			 if (expanded) window.scrollTo(0, $height);
    		}

    		if ($$self.$$.dirty & /*expanded*/ 64) {
    			 numExpandedIndividuals.update(n => Math.max(0, n + (expanded ? 1 : -1)));
    		}
    	};

    	return [
    		x,
    		y,
    		data,
    		ageScale,
    		tempScale,
    		diagnosesToShow,
    		expanded,
    		rectElement,
    		line$1,
    		maxAge,
    		minAge,
    		maxTemp,
    		minTemp,
    		diseaseRadius,
    		color,
    		sexScale,
    		$width,
    		$height,
    		click_handler,
    		func,
    		rect_binding,
    		click_handler_1
    	];
    }

    class Individual extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$3, safe_not_equal, {
    			x: 0,
    			y: 1,
    			data: 2,
    			sexScale: 15,
    			ageScale: 3,
    			tempScale: 4,
    			diagnosesToShow: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Individual",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<Individual> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !("y" in props)) {
    			console.warn("<Individual> was created without expected prop 'y'");
    		}

    		if (/*data*/ ctx[2] === undefined && !("data" in props)) {
    			console.warn("<Individual> was created without expected prop 'data'");
    		}

    		if (/*sexScale*/ ctx[15] === undefined && !("sexScale" in props)) {
    			console.warn("<Individual> was created without expected prop 'sexScale'");
    		}

    		if (/*ageScale*/ ctx[3] === undefined && !("ageScale" in props)) {
    			console.warn("<Individual> was created without expected prop 'ageScale'");
    		}

    		if (/*tempScale*/ ctx[4] === undefined && !("tempScale" in props)) {
    			console.warn("<Individual> was created without expected prop 'tempScale'");
    		}
    	}

    	get x() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sexScale() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sexScale(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ageScale() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ageScale(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tempScale() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tempScale(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get diagnosesToShow() {
    		throw new Error("<Individual>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set diagnosesToShow(value) {
    		throw new Error("<Individual>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.17.3 */
    const file$4 = "src/App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (69:8) {#if ($width > 600 || i % 2 === 0)}
    function create_if_block$2(ctx) {
    	let current;

    	const individual = new Individual({
    			props: {
    				x: /*individualRowScale*/ ctx[1](/*i*/ ctx[13]),
    				y: Math.random() * /*$height*/ ctx[5] / 10,
    				data: /*individual*/ ctx[11].values,
    				sexScale: /*sexScale*/ ctx[7],
    				ageScale: /*ageScale*/ ctx[3],
    				tempScale: /*tempScale*/ ctx[4],
    				diagnosesToShow: /*diagnosesToShow*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(individual.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(individual, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const individual_changes = {};
    			if (dirty & /*individualRowScale*/ 2) individual_changes.x = /*individualRowScale*/ ctx[1](/*i*/ ctx[13]);
    			if (dirty & /*$height*/ 32) individual_changes.y = Math.random() * /*$height*/ ctx[5] / 10;
    			if (dirty & /*data*/ 1) individual_changes.data = /*individual*/ ctx[11].values;
    			if (dirty & /*ageScale*/ 8) individual_changes.ageScale = /*ageScale*/ ctx[3];
    			if (dirty & /*tempScale*/ 16) individual_changes.tempScale = /*tempScale*/ ctx[4];
    			individual.$set(individual_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(individual.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(individual.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(individual, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(69:8) {#if ($width > 600 || i % 2 === 0)}",
    		ctx
    	});

    	return block;
    }

    // (68:6) {#each data as individual, i}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*$width*/ ctx[2] > 600 || /*i*/ ctx[13] % 2 === 0) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$width*/ ctx[2] > 600 || /*i*/ ctx[13] % 2 === 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(68:6) {#each data as individual, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div4;
    	let t0;
    	let h1;
    	let t2;
    	let div1;
    	let t3;
    	let br0;
    	let t4;
    	let a0;
    	let t6;
    	let br1;
    	let br2;
    	let t7;
    	let span0;
    	let t8;
    	let t9;
    	let span1;
    	let t10;
    	let t11;
    	let div0;
    	let t12;
    	let t13;
    	let div2;
    	let svg;
    	let div2_resize_listener;
    	let t14;
    	let div3;
    	let t15;
    	let a1;
    	let t17;
    	let current;
    	const cookiebanner = new CookieBanner({ $$inline: true });
    	const defs = new Defs({ $$inline: true });

    	const axes = new Axes({
    			props: {
    				ageScale: /*ageScale*/ ctx[3],
    				tempScale: /*tempScale*/ ctx[4],
    				show: /*$numExpandedIndividuals*/ ctx[6] > 0
    			},
    			$$inline: true
    		});

    	let each_value = /*data*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			create_component(cookiebanner.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Human signatures";
    			t2 = space();
    			div1 = element("div");
    			t3 = text("We are different – and our body temperature is as well.");
    			br0 = element("br");
    			t4 = text("It was the German physician Carl Reinhold August Wunderlich, who measured the temperatures of 25,000 patients leading to the accepted standard 37 degrees. The average human body temperature. Until today we believe that this is true.\n    In early 2020 a comprehensive study with temperature data points spanning the last 150 years appeared in the scientific journal ");
    			a0 = element("a");
    			a0.textContent = "eLife";
    			t6 = text(". Surprisingly, average body temperatures are constantly decreasing over past decades. Apart from that each individual has her and his own temperature profile over time.");
    			br1 = element("br");
    			br2 = element("br");
    			t7 = text("Explore them yourself by clicking on ");
    			span0 = element("span");
    			t8 = text("female");
    			t9 = text(" or ");
    			span1 = element("span");
    			t10 = text("male");
    			t11 = text(" bodies from the eLife study. A blue stamp ");
    			div0 = element("div");
    			t12 = text(" denotes a cold.");
    			t13 = space();
    			div2 = element("div");
    			svg = svg_element("svg");
    			create_component(defs.$$.fragment);
    			create_component(axes.$$.fragment);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t14 = space();
    			div3 = element("div");
    			t15 = text("Higsch Data Visuals  |  ");
    			a1 = element("a");
    			a1.textContent = "Matthias Stahl";
    			t17 = text("  |  2020");
    			attr_dev(h1, "class", "svelte-18i847u");
    			add_location(h1, file$4, 54, 2, 1514);
    			add_location(br0, file$4, 56, 59, 1628);
    			attr_dev(a0, "href", "https://elifesciences.org/articles/49555");
    			add_location(a0, file$4, 57, 132, 1999);
    			add_location(br1, file$4, 57, 361, 2228);
    			add_location(br2, file$4, 57, 367, 2234);
    			set_style(span0, "color", /*sexScale*/ ctx[7]("Female"));
    			add_location(span0, file$4, 57, 410, 2277);
    			set_style(span1, "color", /*sexScale*/ ctx[7]("Male"));
    			add_location(span1, file$4, 57, 470, 2337);
    			attr_dev(div0, "class", "dot svelte-18i847u");
    			add_location(div0, file$4, 57, 565, 2432);
    			attr_dev(div1, "class", "explanations svelte-18i847u");
    			add_location(div1, file$4, 55, 2, 1542);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", /*$width*/ ctx[2]);
    			attr_dev(svg, "height", /*$height*/ ctx[5]);
    			attr_dev(svg, "class", "svelte-18i847u");
    			add_location(svg, file$4, 60, 4, 2567);
    			attr_dev(div2, "class", "svg-wrapper svelte-18i847u");
    			add_render_callback(() => /*div2_elementresize_handler*/ ctx[10].call(div2));
    			add_location(div2, file$4, 59, 2, 2483);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/matthias-stahl/");
    			add_location(a1, file$4, 80, 50, 3304);
    			attr_dev(div3, "class", "disclaimer svelte-18i847u");
    			add_location(div3, file$4, 80, 2, 3256);
    			attr_dev(div4, "class", "wrapper svelte-18i847u");
    			add_location(div4, file$4, 52, 0, 1471);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			mount_component(cookiebanner, div4, null);
    			append_dev(div4, t0);
    			append_dev(div4, h1);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, t3);
    			append_dev(div1, br0);
    			append_dev(div1, t4);
    			append_dev(div1, a0);
    			append_dev(div1, t6);
    			append_dev(div1, br1);
    			append_dev(div1, br2);
    			append_dev(div1, t7);
    			append_dev(div1, span0);
    			append_dev(span0, t8);
    			append_dev(div1, t9);
    			append_dev(div1, span1);
    			append_dev(span1, t10);
    			append_dev(div1, t11);
    			append_dev(div1, div0);
    			append_dev(div1, t12);
    			append_dev(div4, t13);
    			append_dev(div4, div2);
    			append_dev(div2, svg);
    			mount_component(defs, svg, null);
    			mount_component(axes, svg, null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[10].bind(div2));
    			append_dev(div4, t14);
    			append_dev(div4, div3);
    			append_dev(div3, t15);
    			append_dev(div3, a1);
    			append_dev(div3, t17);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const axes_changes = {};
    			if (dirty & /*ageScale*/ 8) axes_changes.ageScale = /*ageScale*/ ctx[3];
    			if (dirty & /*tempScale*/ 16) axes_changes.tempScale = /*tempScale*/ ctx[4];
    			if (dirty & /*$numExpandedIndividuals*/ 64) axes_changes.show = /*$numExpandedIndividuals*/ ctx[6] > 0;
    			axes.$set(axes_changes);

    			if (dirty & /*individualRowScale, Math, $height, data, sexScale, ageScale, tempScale, diagnosesToShow, $width*/ 447) {
    				each_value = /*data*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*$width*/ 4) {
    				attr_dev(svg, "width", /*$width*/ ctx[2]);
    			}

    			if (!current || dirty & /*$height*/ 32) {
    				attr_dev(svg, "height", /*$height*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cookiebanner.$$.fragment, local);
    			transition_in(defs.$$.fragment, local);
    			transition_in(axes.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cookiebanner.$$.fragment, local);
    			transition_out(defs.$$.fragment, local);
    			transition_out(axes.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(cookiebanner);
    			destroy_component(defs);
    			destroy_component(axes);
    			destroy_each(each_blocks, detaching);
    			div2_resize_listener.cancel();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $width;
    	let $height;
    	let $numExpandedIndividuals;
    	validate_store(width, "width");
    	component_subscribe($$self, width, $$value => $$invalidate(2, $width = $$value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, $$value => $$invalidate(5, $height = $$value));
    	validate_store(numExpandedIndividuals, "numExpandedIndividuals");
    	component_subscribe($$self, numExpandedIndividuals, $$value => $$invalidate(6, $numExpandedIndividuals = $$value));
    	let data = [];

    	// Load the data
    	const load = () => {
    		csv$1("data.csv", d => {
    			return {
    				individual: +d.ANON_ID,
    				age: +d.age_years,
    				temp: +d.temp_C,
    				diagnosis: d.primary_dx,
    				sex: d.GENDER
    			};
    		}).then(res => {
    			let tmp = nest().key(d => d.individual).entries(res);
    			$$invalidate(0, data = tmp.sort((a, b) => a.values[0].age > b.values[0].age ? 1 : -1));
    		});
    	};

    	load();
    	const sexScale = ordinal().domain(["Female", "Male"]).range(["#D84797", "#39A9DB"]);
    	const diagnosesToShow = ["J01", "J06", "R05"];

    	function div2_elementresize_handler() {
    		$width = this.clientWidth;
    		width.set($width);
    		$height = this.clientHeight;
    		height.set($height);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("individualRowScale" in $$props) $$invalidate(1, individualRowScale = $$props.individualRowScale);
    		if ("$width" in $$props) width.set($width = $$props.$width);
    		if ("ageScale" in $$props) $$invalidate(3, ageScale = $$props.ageScale);
    		if ("tempScale" in $$props) $$invalidate(4, tempScale = $$props.tempScale);
    		if ("$height" in $$props) height.set($height = $$props.$height);
    		if ("$numExpandedIndividuals" in $$props) numExpandedIndividuals.set($numExpandedIndividuals = $$props.$numExpandedIndividuals);
    	};

    	let individualRowScale;
    	let ageScale;
    	let tempScale;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, $width*/ 5) {
    			// Adjust scales to dimensions
    			 $$invalidate(1, individualRowScale = linear$1().domain([0, data.length]).range([$width / 100, $width]));
    		}

    		if ($$self.$$.dirty & /*data, $width*/ 5) {
    			 $$invalidate(3, ageScale = linear$1().domain(extent([].concat(...data.map(d => d.values.map(d => d.age))))).range([0.03 * $width, 0.97 * $width]));
    		}

    		if ($$self.$$.dirty & /*data, $height*/ 33) {
    			 $$invalidate(4, tempScale = linear$1().domain(extent([].concat(...data.map(d => d.values.map(d => d.temp))))).range([$height * 0.95, $height * 0.35]));
    		}
    	};

    	return [
    		data,
    		individualRowScale,
    		$width,
    		ageScale,
    		tempScale,
    		$height,
    		$numExpandedIndividuals,
    		sexScale,
    		diagnosesToShow,
    		load,
    		div2_elementresize_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const googleAnalytics = (gaID) => {
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', gaID);

      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaID}`;
      document.body.appendChild(script);
    };

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var cookiesEuBanner_min = createCommonjsModule(function (module, exports) {
    /** Cookies EU banner v2.0.1 by Alex-D - alex-d.github.io/Cookies-EU-banner/ - MIT License */
    !function(e,t){module.exports=t();}(window,function(){var i,u=window.document;return (i=function(e,t,o,n){if(!(this instanceof i))return new i(e);this.cookieTimeout=33696e6,this.bots=/bot|crawler|spider|crawling/i,this.cookieName="hasConsent",this.trackingCookiesNames=["__utma","__utmb","__utmc","__utmt","__utmv","__utmz","_ga","_gat","_gid"],this.launchFunction=e,this.waitAccept=t||!1,this.useLocalStorage=o||!1,this.init();}).prototype={init:function(){var e=this.bots.test(navigator.userAgent),t=navigator.doNotTrack||navigator.msDoNotTrack||window.doNotTrack;return e||!(null==t||t&&"yes"!==t&&1!==t&&"1"!==t)||!1===this.hasConsent()?(this.removeBanner(0),!1):!0===this.hasConsent()?(this.launchFunction(),!0):(this.showBanner(),void(this.waitAccept||this.setConsent(!0)))},showBanner:function(){var e=this,t=u.getElementById.bind(u),o=t("cookies-eu-banner"),n=t("cookies-eu-reject"),i=t("cookies-eu-accept"),s=t("cookies-eu-more"),a=void 0===o.dataset.waitRemove?0:parseInt(o.dataset.waitRemove),c=this.addClickListener,r=e.removeBanner.bind(e,a);o.style.display="block",s&&c(s,function(){e.deleteCookie(e.cookieName);}),i&&c(i,function(){r(),e.setConsent(!0),e.launchFunction();}),n&&c(n,function(){r(),e.setConsent(!1),e.trackingCookiesNames.map(e.deleteCookie);});},setConsent:function(e){if(this.useLocalStorage)return localStorage.setItem(this.cookieName,e);this.setCookie(this.cookieName,e);},hasConsent:function(){function e(e){return -1<u.cookie.indexOf(t+"="+e)||localStorage.getItem(t)===e}var t=this.cookieName;return !!e("true")||!e("false")&&null},setCookie:function(e,t){var o=new Date;o.setTime(o.getTime()+this.cookieTimeout),u.cookie=e+"="+t+";expires="+o.toGMTString()+";path=/";},deleteCookie:function(e){var t=u.location.hostname.replace(/^www\./,""),o="; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/";u.cookie=e+"=; domain=."+t+o,u.cookie=e+"="+o;},addClickListener:function(e,t){if(e.attachEvent)return e.attachEvent("onclick",t);e.addEventListener("click",t);},removeBanner:function(e){setTimeout(function(){var e=u.getElementById("cookies-eu-banner");e&&e.parentNode&&e.parentNode.removeChild(e);},e);}},i});
    });

    const app = new App({
      target: document.body
    });

    new cookiesEuBanner_min(function () {
      googleAnalytics('UA-156964030-1');
    }, true);

    return app;

}());
//# sourceMappingURL=bundle.js.map
