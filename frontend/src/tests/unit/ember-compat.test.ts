/*
 * T048a — Ember QUnit Test Assertion Record
 *
 * This comment preserves the assertion logic from the Ember QUnit test suite
 * that was deleted in T048. T053a will implement the equivalent Vitest test
 * using only this record (the original source file will be gone).
 *
 * ─── SOURCE FILE ──────────────────────────────────────────────────────────────
 * File:    tests/unit/input-processor/service-test.js
 * Framework: Ember QUnit (ember-qunit, qunit)
 *
 * ─── FULL SOURCE (verbatim) ───────────────────────────────────────────────────
 *
 *   import { module, test } from 'qunit';
 *   import { setupTest } from 'ember-qunit';
 *
 *   module('Unit | Service | key-handler', function(hooks) {
 *     setupTest(hooks);
 *
 *     // Replace this with your real tests.
 *     test('it exists', function(assert) {
 *       let service = this.owner.lookup('service:input-processor');
 *       assert.ok(service);
 *     });
 *   });
 *
 * ─── ASSERTION LOGIC ──────────────────────────────────────────────────────────
 * Module:    "Unit | Service | key-handler"
 * Test name: "it exists"
 *
 * What it tests:
 *   The Ember service registered under the name 'service:input-processor' must
 *   be resolvable from the application's dependency-injection container and must
 *   be truthy (i.e., a non-null, non-undefined object instance).
 *
 * Inputs:
 *   - No runtime inputs; relies entirely on Ember's DI container via `this.owner`.
 *
 * Expected outcome:
 *   - `this.owner.lookup('service:input-processor')` returns a truthy value.
 *   - `assert.ok(service)` passes — the service is instantiated successfully.
 *
 * Equivalent React/Vitest concept (for T053a):
 *   The React equivalent of "the Ember input-processor service exists" is that
 *   the `useInputProcessor` hook module can be imported without error and that
 *   its default export (the hook function) is a callable function.
 *   T053a should verify:
 *     1. `import useInputProcessor from '../../hooks/useInputProcessor'` succeeds.
 *     2. `typeof useInputProcessor === 'function'` is true.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'vitest';
import useInputProcessor from '../../hooks/useInputProcessor';

/**
 * Ported from the Ember QUnit test: "Unit | Service | key-handler" → "it exists"
 *
 * The original Ember test verified that the input-processor service could be
 * resolved from the DI container and was truthy. The React/Vitest equivalent
 * verifies that the useInputProcessor hook module exports a callable function —
 * the same "the module exists and is usable" assertion in React terms.
 */
describe('Unit | Hook | useInputProcessor', () => {
  it('exists and is a function (ported from Ember "it exists" assertion)', () => {
    expect(typeof useInputProcessor).toBe('function');
  });
});
