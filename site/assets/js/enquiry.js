import { createFormStore, FORM_ERROR } from "../../js/wix/form-store.js";

const FORM_ID = "8aea07b4-6bf3-4430-946d-86ec07078b8e";
const root = document.getElementById("enquiry");
const store = createFormStore({ formId: FORM_ID });
const INPUT_TYPES = { text: "text", email: "email", phone: "tel", url: "url", password: "password", number: "number", date: "date", time: "time", datetime: "datetime-local" };
let built = [];

function control(f) {
  const t = f.control;
  let el;
  if (t === "textarea") el = document.createElement("textarea");
  else if (t === "select") {
    el = document.createElement("select");
    const blank = document.createElement("option");
    blank.value = ""; blank.textContent = f.placeholder || "Choose…";
    el.append(blank);
    f.choices.forEach((c) => { const o = document.createElement("option"); o.value = c.value; o.textContent = c.label; el.append(o); });
  } else if (INPUT_TYPES[t]) {
    el = document.createElement("input");
    el.type = INPUT_TYPES[t];
    const v = f.validation || {};
    if (t === "number") { if (v.minimum != null) el.min = v.minimum; if (v.maximum != null) el.max = v.maximum; if (v.multipleOf != null) el.step = v.multipleOf; el.inputMode = "numeric"; }
    if (t === "date") { if (v.minDate) el.min = String(v.minDate).slice(0, 10); if (v.maxDate) el.max = String(v.maxDate).slice(0, 10); }
  } else {
    const p = document.createElement("p");
    p.className = "formnote"; p.textContent = "This field type is not supported here.";
    return p;
  }
  el.id = "f-" + f.target;
  el.name = f.target;
  if (f.placeholder) el.placeholder = f.placeholder;
  el.setAttribute("aria-describedby", "err-" + f.target);
  el.addEventListener("input", () => store.setValue(f.target, el.value));
  el.addEventListener("change", () => store.setValue(f.target, el.value));
  el.addEventListener("blur", () => store.validate(f.target));
  return el;
}

function build(form) {
  root.replaceChildren();
  built = form.fields.map((f) => f.target);
  form.fields.forEach((f) => {
    const wrap = document.createElement("div");
    wrap.dataset.target = f.target;
    if (f.control === "textarea" || f.control === "unknown") wrap.className = "full";
    const label = document.createElement("label");
    label.htmlFor = "f-" + f.target;
    label.textContent = f.label + (f.required && form.requiredIndicator === "ASTERISK" ? " *" : "");
    const err = document.createElement("p");
    err.id = "err-" + f.target; err.className = "formnote"; err.style.color = "#a33"; err.hidden = true;
    wrap.append(label, control(f), err);
    root.append(wrap);
  });
  const foot = document.createElement("div");
  foot.className = "full center";
  const btn = document.createElement("button");
  btn.className = "btn gold"; btn.type = "submit"; btn.textContent = form.submitText || "Send enquiry";
  const formErr = document.createElement("p");
  formErr.id = "err-form"; formErr.className = "formnote"; formErr.style.color = "#a33"; formErr.hidden = true;
  const note = document.createElement("p");
  note.className = "formnote";
  note.innerHTML = 'You can also call us on <a href="tel:+442087498845">020 8749 8845</a>.';
  foot.append(btn, formErr, note);
  root.append(foot);
}

function render() {
  const s = store.getState();
  if (!s.form) return;
  if (s.outcome) {
    if (s.outcome.action === "REDIRECT" && s.outcome.url) { location.href = s.outcome.url; return; }
    root.replaceChildren();
    const p = document.createElement("p");
    p.className = "center"; p.setAttribute("role", "status");
    p.style.cssText = "grid-column:1/-1;font-size:20px";
    p.textContent = s.outcome.message || "Thank you. We have your enquiry and will be in touch shortly.";
    root.append(p);
    built = [];
    return;
  }
  if (s.closed) {
    root.replaceChildren();
    const p = document.createElement("p");
    p.className = "formnote"; p.textContent = s.form.disabledMessage || "This form is not accepting enquiries right now. Please call us on 020 8749 8845.";
    root.append(p);
    built = [];
    return;
  }
  const targets = s.form.fields.map((f) => f.target);
  if (targets.join() !== built.join()) build(s.form);
  s.form.fields.forEach((f) => {
    const input = root.querySelector('[name="' + f.target + '"]');
    const err = document.getElementById("err-" + f.target);
    if (!input || !err) return;
    const msg = s.errors[f.target];
    err.textContent = msg || ""; err.hidden = !msg;
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  });
  const fe = document.getElementById("err-form");
  if (fe) { fe.textContent = s.errors[FORM_ERROR] || ""; fe.hidden = !s.errors[FORM_ERROR]; }
  const btn = root.querySelector('button[type="submit"]');
  if (btn) btn.disabled = s.loading;
}

root.addEventListener("submit", (e) => { e.preventDefault(); store.submit(e); });
store.subscribe(render);
store.start();
