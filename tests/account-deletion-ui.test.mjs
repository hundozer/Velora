import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the actual Settings component's event handlers/state with isolated
// dependencies. This is a component regression, not a live deletion journey.
function settings(fetch) {
  const state = [];
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: (initial) => {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [state[i], (next) => { state[i] = next; }];
    },
    useEffect: () => {},
    useRef: (current) => ({ current }),
  };
  const location = { href: "/settings" };
  const exports = {};
  const source = readFileSync(new URL("../src/app/settings/page.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, {
    exports, fetch, window: { location },
    require: (name) => {
      if (name === "react") return react;
      if (name === "@/lib/i18n") return { SUPPORTED_LANGUAGES: [] };
      if (name === "@/context/AuthContext") return { useAuth: () => ({ user: { username: "Fixture" }, profile: {} }) };
      return new Proxy({}, { get: (_, key) => key === "__esModule" ? true : String(key) });
    },
  });
  const render = () => { cursor = 0; return exports.default(); };
  const nodes = (tree) => !tree || typeof tree !== "object" ? [] : Array.isArray(tree)
    ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
  const text = (node) => typeof node === "string" ? node : !node ? "" : Array.isArray(node)
    ? node.map(text).join("") : text(node.props?.children);
  const find = (predicate) => nodes(render()).find(predicate);
  const button = (label) => find((node) => node.type === "Button" && text(node).trim() === label);
  const modal = () => find((node) => node.type === "Modal" && node.props.title === "Confirm Account Deletion");
  return { location, render, find, button, modal };
}

for (const failure of ["http", "network"]) {
  test(`Settings ${failure} deletion failure keeps the session and permits a confirmed retry`, async () => {
    let attempts = 0;
    let accept;
    const ui = settings(async (url, options) => {
      assert.equal(url, "/api/auth/delete-account");
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(options.body), { confirmation: "DELETE" });
      if (++attempts === 1) {
        if (failure === "network") throw new Error("Network unavailable");
        return { ok: false };
      }
      return new Promise((resolve) => { accept = () => resolve({ ok: true }); });
    });
    ui.button("Delete Account").props.onClick();
    await ui.button("Confirm Deletion Request").props.onClick();
    assert.equal(ui.location.href, "/settings");
    assert.equal(ui.modal().props.isOpen, true);
    assert.ok(ui.find((node) => node.props?.role === "alert"));
    const pending = ui.button("Confirm Deletion Request").props.onClick();
    assert.equal(ui.button("Submitting…").props.disabled, true);
    assert.equal(ui.button("Cancel").props.disabled, true);
    assert.equal(ui.modal().props.showCloseButton, false);
    ui.modal().props.onClose();
    assert.equal(ui.modal().props.isOpen, true);
    await ui.button("Submitting…").props.onClick();
    assert.equal(attempts, 2);
    assert.equal(ui.location.href, "/settings");
    accept();
    await pending;
    assert.equal(ui.location.href, "/auth/logout?returnTo=%2Fgoodbye");
  });
}
