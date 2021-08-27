import test from "ava";
import { readFileSync } from "fs";
import check from "./helpers/check.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("github", t => {
  check(t, readFileSync(__dirname + "/pages/github.com.html", "utf8"));
});

test("stripe", t => {
  check(t, readFileSync(__dirname + "/pages/stripe.com.html", "utf8"));
});

test("deployer", t => {
  check(t, readFileSync(__dirname + "/pages/deployer.org.html", "utf8"));
});

test("config:seed", t => {
  const html = `
  <div>
    <span>
      <p></p>
    </span>
  </div>
  `;
  check(t, html);
  check(t, html, { seedMinLength: 3 });
  check(t, html, { seedMinLength: 3, optimizedMinLength: 3 });
  check(t, html, { threshold: 2 });
});

test("config:threshold", t => {
  const html = `
  <div>
    <p></p>
    <p></p>
    <p></p>
  </div>
  `;
  check(t, html, { threshold: 1 });
});

test("config:fun", t => {
  const html = `
  <div>
    <div></div>
  </div>
  `;
  check(t, html, { tagName: tag => tag !== "div" });
});
test("config:id", t => {
  const html = `
  <div id="test">
    <div></div>
  </div>
  `;
  check(t, html, { idName: id => id !== "test" });
});

test("config:attr", t => {
  const html = `
  <div data-test="1">
    <div data-qa="2"></div>
    <div data-qa="3"></div>
  </div>
  `;
  check(t, html, {
    attr: (name, value) => {
      return name !== "data-test" && name === "data-qa" && value % 2 === 0;
    }
  });
});
