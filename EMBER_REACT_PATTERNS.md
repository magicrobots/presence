# Ember → React Migration Patterns

Reference guide for consistently converting this Ember 3.11 codebase to React 18.
**All conversions must preserve existing logic exactly — no refactoring during migration.**

---

## 1. Class / Module Structure

### Ember: Service
```js
// services/my-service.js
import Service from '@ember/service';
import { set } from '@ember/object';
export default Service.extend({
    someValue: 'default',
    init() {
        this._super(...arguments);
        set(this, 'items', []);
    }
});
```

### React: Custom Hook (preferred) or Context
```js
// hooks/useMyService.js
import { useState, useEffect } from 'react';
export function useMyService() {
    const [someValue, setSomeValue] = useState('default');
    const [items, setItems] = useState([]);
    return { someValue, setSomeValue, items, setItems };
}
```

For services that hold **shared app-wide state** (input-processor, story-core):
```js
// context/MyContext.js
import { createContext, useContext, useReducer } from 'react';
const MyContext = createContext(null);
export function MyProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return <MyContext.Provider value={{ state, dispatch }}>{children}</MyContext.Provider>;
}
export function useMyContext() {
    return useContext(MyContext);
}
```

---

## 2. Service Injection

### Ember
```js
export default Component.extend({
    inputProcessor: service(),
    persistenceHandler: service(),
    // access: this.inputProcessor.someMethod()
});
```

### React: via Hook
```js
export default function MyComponent() {
    const { processKey } = useInputProcessor();
    const { getUsername } = usePersistence();
    // ...
}
```

### React: via Props (for simpler/leaf components)
```js
export default function MyComponent({ onInput, username }) {
    // ...
}
```

---

## 3. Computed Properties

### Ember
```js
fontSize: computed('isSmallViewport', {
    get() {
        return this.isSmallViewport ? FONT_SIZE_S : FONT_SIZE;
    }
}),

allDisplayLines: computed('currExecutionBlock', 'previousExecutionBlocks.[]', {
    get() {
        return this.previousExecutionBlocks.concat(this.currExecutionBlock);
    }
})
```

### React: useMemo (when value depends on other state)
```js
const fontSize = useMemo(() => {
    return isSmallViewport ? FONT_SIZE_S : FONT_SIZE;
}, [isSmallViewport]);

const allDisplayLines = useMemo(() => {
    return previousExecutionBlocks.concat(currExecutionBlock);
}, [currExecutionBlock, previousExecutionBlocks]);
```

### React: Derived directly (when deps are stable)
```js
// Simple derivation doesn't need useMemo
const allDisplayLines = previousExecutionBlocks.concat(currExecutionBlock);
```

---

## 4. Property Setting — `set()` / `get()`

### Ember
```js
set(this, 'currentCommand', newValue);
set(this, 'cursorPosition', 0);
set(this, `magicRobotsData.${KEY_USERNAME}`, newName);

get(this.overrideScope, 'commandComplete');
```

### React: Direct state setter
```js
setCurrentCommand(newValue);
setCursorPosition(0);
setMagicRobotsData(prev => ({ ...prev, [KEY_USERNAME]: newName }));

overrideScope.commandComplete;  // direct property access
```

---

## 5. Lifecycle Hooks

### Ember → React equivalents

| Ember Hook | React Equivalent |
|---|---|
| `init()` | `useState` initializer or `useEffect(fn, [])` |
| `didInsertElement()` | `useEffect(fn, [])` with DOM ref |
| `didRender()` | `useEffect(fn)` (runs after every render) |
| `destroy()` | `useEffect` cleanup function |

### Ember
```js
init() {
    this._super(...arguments);
    set(this, 'items', []);
    this._startLoop();
},
didInsertElement() {
    this._super(...arguments);
    set(this.inputProcessor, 'relevantMarkup', this.$()[0]);
    window.addEventListener('resize', this._onResize);
},
destroy() {
    clearInterval(this.loopContainer);
    this._super(...arguments);
}
```

### React
```js
const containerRef = useRef(null);

useEffect(() => {
    // didInsertElement equivalent
    inputProcessor.setRelevantMarkup(containerRef.current);
    window.addEventListener('resize', onResize);

    // destroy equivalent (cleanup)
    return () => {
        clearInterval(loopContainerRef.current);
        window.removeEventListener('resize', onResize);
    };
}, []); // empty deps = run once on mount
```

---

## 6. Mixin Extension

### Ember
```js
// Component extends a mixin
export default Component.extend(Deformers, { ... });

// Service chain: A extends B extends C
export default keyFunctions.extend({ ... });
// keyFunctions extends inputComputed.extend(...)
// inputComputed extends processorBase.extend(...)
```

### React: Compose hooks
```js
// Deformers mixin → plain utility functions
import { pixelizeImage, shiftColors } from '../utils/deformers';

// input-processor chain → one hook that calls sub-functions
// All three files (base, computed, key-functions) collapse into useInputProcessor()
import { useInputProcessor } from '../hooks/useInputProcessor';
```

For the `input-processor` split (base/computed/key-functions), collapse all three into one `useInputProcessor` hook. The chained `extend()` pattern becomes a single hook that contains all the logic, since React doesn't have an equivalent of prototype chain for hooks.

---

## 7. Actions (Event Handlers)

### Ember Template
```handlebars
<button {{action onEsc}}>...</button>
<button {{action onScreenInput}}>...</button>
```

### React JSX
```jsx
<button onClick={onEsc}>...</button>
<button onClick={onScreenInput}>...</button>
```

### Ember `{{action "name" arg}}` with string name
```handlebars
<div {{action "doSomething" someArg}}>
```
### React
```jsx
<div onClick={() => doSomething(someArg)}>
```

---

## 8. Templates → JSX

### Common HBS → JSX conversions

| Handlebars | JSX |
|---|---|
| `{{if condition}}...{{/if}}` | `{condition && <...>}` |
| `{{if cond}}A{{else}}B{{/if}}` | `{cond ? <A/> : <B/>}` |
| `{{unless condition}}` | `{!condition && <...>}` |
| `{{each items as \|item\|}}` | `{items.map(item => <...>)}` |
| `{{component-name prop=val}}` | `<ComponentName prop={val} />` |
| `{{outlet}}` | `<Outlet />` (React Router v6) |
| `style={{styleString}}` | `style={styleObject}` or `dangerouslySetInnerHTML` |
| `{{input value=val}}` | `<input value={val} onChange={...} />` |

### Ember: Dynamic safe styles
```js
// Ember uses htmlSafe()
routeContainerStyle: computed('viewportMeasurements', {
    get() {
        return htmlSafe(`height: ${h}px; width: ${w}px;`);
    }
})
```
```handlebars
<div style={{routeContainerStyle}}>
```

### React: Style object
```jsx
const routeContainerStyle = useMemo(() => ({
    height: viewportMeasurements.height,
    width: viewportMeasurements.width,
    left: viewportMeasurements.left,
    top: viewportMeasurements.top,
}), [viewportMeasurements]);

<div style={routeContainerStyle}>
```

---

## 9. Dynamic Route Generation

### Ember
```js
// router.js
Router.map(function() {
    const uniqueRouteNames = [...new Set(commandRegistry.registry.map(cmd => cmd.routeName))];
    uniqueRouteNames.forEach(name => {
        if (name) this.route(name, { path: name });
    });
});
```

### React Router v6 (route config array)
```jsx
// router.jsx
import { createBrowserRouter } from 'react-router-dom';
import { commandRegistry } from './constants/command-registry';

const cmdRoutes = [...new Set(commandRegistry.registry.map(cmd => cmd.routeName))]
    .filter(Boolean)
    .map(name => ({
        path: name,
        lazy: () => import(`./routes/${name}`)  // or static imports
    }));

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: cmdRoutes
    }
]);
```

---

## 10. Route `afterModel` → Component `useEffect`

### Ember Route
```js
export default Route.extend({
    inputProcessor: service(),
    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: ['Welcome...']
        });
        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});
```

### React: Route component with useEffect
```jsx
export default function CmdAbout() {
    const { setAppEnvironment } = useInputProcessor();
    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-about',
            response: ['Welcome...']
        });
        setAppEnvironment(appEnvironment);
    }, []);  // runs on mount
    return null;  // most cmd routes render nothing — output is via inputProcessor
}
```

---

## 11. Ember Utils → Native JS

| Ember Utility | Native JS Equivalent |
|---|---|
| `isPresent(x)` | `x != null && x !== ''` or `Boolean(x)` |
| `isNone(x)` | `x == null` |
| `isEmpty(x)` | `!x \|\| x.length === 0` |
| `htmlSafe(str)` | Use style object; or `dangerouslySetInnerHTML` only when necessary |
| `array.findBy('prop', val)` | `array.find(x => x.prop === val)` |
| `array.mapBy('prop')` | `array.map(x => x.prop)` |
| `array.filterBy('prop', val)` | `array.filter(x => x.prop === val)` |

---

## 12. Canvas & DOM Refs

### Ember: jQuery-style access
```js
// In component
set(this.inputProcessor, 'relevantMarkup', this.$()[0]);
const canvas = document.getElementById('source-canvas');
```

### React: useRef
```jsx
const containerRef = useRef(null);
const canvasRef = useRef(null);

useEffect(() => {
    inputProcessor.setRelevantMarkup(containerRef.current);
    // canvas is canvasRef.current
}, []);

<div ref={containerRef}>
    <canvas ref={canvasRef} />
</div>
```

---

## 13. `this.$()` / Direct DOM Access

### Ember
```js
this.$()[0]  // root element of the component
this.$('#some-id')  // element within component
```

### React
```jsx
const ref = useRef(null);
// ref.current  → the DOM element
```

---

## 14. Intervals & Timers in Services

### Ember
```js
_startPromptCursorLoop() {
    const scope = this;
    set(this, 'cursorLoopContainer', setInterval(function() {
        set(scope, 'isPromptCursorVisible', !scope.isPromptCursorVisible);
    }, CURSOR_BLINK_LENGTH));
},
destroy() {
    clearInterval(this.cursorLoopContainer);
    this._super(...arguments);
}
```

### React: useRef for interval handle + useEffect cleanup
```js
const loopRef = useRef(null);

useEffect(() => {
    loopRef.current = setInterval(() => {
        setIsPromptCursorVisible(v => !v);
    }, CURSOR_BLINK_LENGTH);
    return () => clearInterval(loopRef.current);
}, []);
```

---

## 15. `setInterval` Closures with Stale State

The Ember pattern uses `const scope = this` to capture `this`. In React, use a `ref` to hold the latest state value inside the interval closure:

```js
const isKeyboardActiveRef = useRef(isKeyboardActive);
useEffect(() => { isKeyboardActiveRef.current = isKeyboardActive; }, [isKeyboardActive]);

useEffect(() => {
    const interval = setInterval(() => {
        if (isKeyboardActiveRef.current) {
            setIsPromptCursorVisible(v => !v);
        }
    }, CURSOR_BLINK_LENGTH);
    return () => clearInterval(interval);
}, []);
```

---

## Codebase-Specific Notes

- **`story-core.js` (41KB):** Convert to `useReducer` + Context. All game state mutations become dispatch actions. The huge service becomes `storyReducer.js` (pure function) + `StoryContext.jsx` (provider).
- **`input-processor` (3-file chain):** Collapse base + computed + key-functions into a single `useInputProcessor.js` hook. The prototype chain becomes closure scope.
- **`deformers.js` mixin:** Pure canvas math — extract as plain utility functions in `utils/deformers.js`. No React needed.
- **`rngeezus.js`:** Convert to a plain module with pre-generated pools (no React state needed — pools don't need to trigger re-renders).
- **`persistence-handler.js`:** Becomes `usePersistence.js` hook wrapping `localStorage` directly.
- **`status-bar.js`:** Simple — becomes a plain Context value (just `statusMessage` string + setter).
- **Dynamic routes:** The `commandRegistry` drives routing in both Ember and React. Copy the registry as-is; change only how it's consumed by the router.
