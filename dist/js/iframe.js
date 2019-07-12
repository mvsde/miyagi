if ("undefined" != typeof io) {
  io.connect(window.location.origin).on("fileChanged", function(e) {
    setTimeout(() => {
      e ? parent.window.location.reload() : window.location.reload();
    }, 500);
  });
}
function e(e) {
  var t = document.createElement("div");
  return t.appendChild(document.createTextNode(e)), t.innerHTML;
}
function t(e) {
  const t = Array.from(e.querySelectorAll(".HeadmanResults-summary"));
  t.forEach(e => {
    e.addEventListener("click", e => {
      t.forEach(t => {
        const a = t.closest("details");
        e.target.closest("details") !== a && a.open && t.click();
      });
    });
  });
}
addEventListener("DOMContentLoaded", () => {
  const a = parent.document.querySelector(".Headman-tests");
  if (a)
    if (document.getElementById("HeadmanComponent")) {
      const i = parent.document.querySelector(".HeadmanTest--a11y"),
        s = parent.document.querySelector(".HeadmanTest--html");
      i &&
        (window.validations.accessibility
          ? (function(a) {
              const i = ["passes", "inapplicable", "violations", "incomplete"];
              t(a),
                axe.run(document.getElementById("HeadmanComponent"), function(
                  t,
                  s
                ) {
                  if (t) throw t;
                  i.forEach(t => {
                    const i = a.querySelector(
                      `.HeadmanResults--${t} .HeadmanResults-value`
                    );
                    let l = "";
                    (i.innerText = s[t].length),
                      ("violations" !== t && "incomplete" !== t) ||
                        i.classList.toggle("has-positiveValue", s[t].length),
                      s[t].length
                        ? ((l += "<ul>"),
                          s[t].forEach(t => {
                            if (
                              ((l += '<li class="HeadmanResult">'),
                              (l += '<dl class="HeadmanResult-data">'),
                              t.description &&
                                (l += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">Description</dt> <dd class="HeadmanResult-value">${e(
                                  t.description
                                )}</div></dd>`),
                              t.help &&
                                (l += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">Help</dt> <dd class="HeadmanResult-value">${e(
                                  t.help
                                )}</div></dd>`),
                              t.helpUrl &&
                                (l += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">Link</dt> <dd class="HeadmanResult-value"><a href="${
                                  t.helpUrl
                                }" target="_blank">${
                                  t.helpUrl
                                }</div></dd></a>`),
                              t.impact)
                            ) {
                              let e = "";
                              switch (t.impact) {
                                case "serious":
                                  e = "HeadmanResults-value--negative";
                                  break;
                                case "moderate":
                                  e = "HeadmanResults-value--warning";
                              }
                              l += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">Impact</dt> <dd class="${e}">${
                                t.impact
                              }</div></dd>`;
                            }
                            (l += "</dl>"), (l += "</li>");
                          }),
                          (l += "</ul>"))
                        : (l +=
                            '<p><i class="HeadmanResults-empty">Nothing to report.</i></p>'),
                      (a.querySelector(
                        `.HeadmanResults--${t} .HeadmanResults-details`
                      ).innerHTML = l);
                  }),
                    a.removeAttribute("hidden");
                });
            })(i)
          : i.remove()),
        s &&
          (window.validations.html
            ? (function(a) {
                const i = ["error", "warning"];
                t(a),
                  fetch(location.href).then(t => {
                    t.ok &&
                      t.text().then(t => {
                        const s = new FormData();
                        s.append("out", "json"),
                          s.append("content", t),
                          fetch("https://validator.w3.org/nu/", {
                            method: "post",
                            headers: { Accept: "application/json" },
                            body: s
                          }).then(function(t) {
                            t.ok
                              ? t.json().then(t => {
                                  i.forEach(i => {
                                    const s = t.messages.filter(
                                        e => e.type === i
                                      ),
                                      l = a.querySelector(
                                        `.HeadmanResults--${i} .HeadmanResults-value`
                                      );
                                    let r = "";
                                    (l.innerText = s.length),
                                      s.length
                                        ? (l.classList.add("has-positiveValue"),
                                          (r += "<ul>"),
                                          s.forEach(t => {
                                            if (
                                              ((r +=
                                                '<li class="HeadmanResult">'),
                                              (r +=
                                                '<dl class="HeadmanResult-data">'),
                                              t.message &&
                                                (r += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">Message</dt> <dd class="HeadmanResult-value">${
                                                  t.message
                                                }</div></dd>`),
                                              t.extract)
                                            ) {
                                              const a = `${e(
                                                t.extract.slice(
                                                  0,
                                                  t.hiliteStart
                                                )
                                              )}<mark>${e(
                                                t.extract.slice(
                                                  t.hiliteStart,
                                                  t.hiliteStart + t.hiliteLength
                                                )
                                              )}</mark>${e(
                                                t.extract.slice(
                                                  t.hiliteStart + t.hiliteLength
                                                )
                                              )}`;
                                              r += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">Extract</dt> <dd class="HeadmanResult-value"><code class="HeadmanResult-extract">${a.replace(
                                                /\n/g,
                                                "↩"
                                              )}</code></div></dd>`;
                                            }
                                            (r += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">From</dt><dd class="HeadmanResult-value">Line: ${
                                              t[
                                                t.firstLine
                                                  ? "firstLine"
                                                  : "lastLine"
                                              ]
                                            }, Column: ${
                                              t.firstColumn
                                            }</div></dd>`),
                                              (r += `<div class="HeadmanResult-wrapper"><dt class="HeadmanResult-attr">To</dt><dd class="HeadmanResult-value">Line: ${
                                                t.lastLine
                                              }, Column: ${
                                                t.lastColumn
                                              }</div></dd>`),
                                              (r += "</dl>"),
                                              (r += "</li>");
                                          }),
                                          (r += "</ul>"))
                                        : (l.classList.remove(
                                            "has-positiveValue"
                                          ),
                                          (r +=
                                            '<p><i class="HeadmanResults-empty">Nothing to report.</i></p>')),
                                      (a.querySelector(
                                        `.HeadmanResults--${i} .HeadmanResults-details`
                                      ).innerHTML = r);
                                  }),
                                    a.removeAttribute("hidden");
                                })
                              : console.warn(
                                  "HTML validation failed. Most likely something went wrong with https://validator.w3.org/nu/. Maybe you also ran into rate limiting."
                                );
                          });
                      });
                  });
              })(s)
            : s.remove()),
        a.removeAttribute("hidden");
    } else a.setAttribute("hidden", !0);
}),
  document.addEventListener("DOMContentLoaded", () => {
    Array.from(document.querySelectorAll(".HeadmanComponent-file")).forEach(
      e => {
        e.addEventListener("click", e => {
          parent.window &&
            parent.window.onPageChanged &&
            (history.replaceState(null, null, e.target.href),
            parent.window.onPageChanged(
              encodeURI(e.target.getAttribute("href"))
            ));
        });
      }
    );
  }),
  location.href.indexOf("/component?") >= 0 &&
    location.href.indexOf("&embedded=true") >= 0 &&
    window.self === window.top &&
    (window.location = location.href.replace("&embedded=true", ""));
