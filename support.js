// courtsy.my/support — the guided support form for people outside the app (or
// signed out of it). It calls the same submit_support_request() the app uses;
// the request is saved and emailed to support@courtsy.my with Reply-To set to
// the person. The key below is Supabase's publishable key, safe to be public.
// Topics mirror src/api/support.ts in the app — keep the two in step.
(function () {
  var SUPABASE_URL = "https://dbsrkhxmycaxnpvhmwfy.supabase.co";
  var SUPABASE_KEY = "sb_publishable_Yf6P1LjMdWrtroSAFJ3SRQ_ZY47BpLO";

  var TOPICS = [
    { value: "booking", label: "A booking", blurb: "Didn’t go to plan, can’t get in, need to change it",
      prompts: ["Which court, and the date and time", "What happened", "What you’d like us to do"],
      placeholder: "e.g. Arcoris, Sat 4 Oct 7pm — the guardhouse wouldn’t let us in and the host wasn’t answering." },
    { value: "hosting", label: "Hosting my court", blurb: "Listing, sessions, approvals, players",
      prompts: ["Which court or session", "What you were trying to do", "What happened instead"],
      placeholder: "e.g. My listing is still waiting for approval after three days." },
    { value: "safety", label: "Safety or someone’s behaviour", blurb: "Harassment, no-shows, anything that felt wrong",
      prompts: ["Who was involved", "What happened and when", "Whether it’s still going on"],
      placeholder: "Tell us what happened. Only the Courtsy team will see this." },
    { value: "account", label: "My account", blurb: "Signing in, profile, suspension, deleting",
      prompts: ["What you were trying to do", "Any message you saw"],
      placeholder: "e.g. My sign-in code never arrives." },
    { value: "bug", label: "Something’s not working", blurb: "An error, a crash, a screen that looks wrong",
      prompts: ["Your phone (iPhone / Android)", "Which screen you were on", "What you expected vs what happened"],
      placeholder: "e.g. On a session, tapping Invite shows a blank screen." },
    { value: "feedback", label: "Idea or feedback", blurb: "What would make Courtsy better for you",
      prompts: ["What you’d like", "Why it would help"],
      placeholder: "e.g. It would help to see which courts have lights." },
    { value: "other", label: "Something else", blurb: "Anything that doesn’t fit above",
      prompts: [], placeholder: "How can we help?" }
  ];

  var ERRORS = {
    invalid_email: "Please check your email address.",
    message_too_short: "Add a few more words so we know what’s going on.",
    too_many_requests: "You’ve sent a few already — we’ll get to them. Try again in an hour if it’s urgent."
  };

  var form = document.getElementById("support");
  var topicsBox = form.querySelector(".topics");
  var details = document.getElementById("details");
  var message = document.getElementById("message");
  var prompts = document.getElementById("prompts");
  var safety = document.getElementById("safety");
  var error = document.getElementById("error");
  var send = document.getElementById("send");
  var topic = null;

  TOPICS.forEach(function (t) {
    var label = document.createElement("label");
    label.className = "topic";
    label.innerHTML =
      '<input type="radio" name="topic" value="' + t.value + '">' +
      "<span><strong></strong><small></small></span>";
    label.querySelector("strong").textContent = t.label;
    label.querySelector("small").textContent = t.blurb;
    label.querySelector("input").addEventListener("change", function () { choose(t.value, true); });
    topicsBox.appendChild(label);
  });

  function choose(value, focus) {
    var t = TOPICS.filter(function (x) { return x.value === value; })[0];
    if (!t) return;
    topic = t.value;
    form.querySelector('input[value="' + t.value + '"]').checked = true;
    details.hidden = false;
    safety.hidden = t.value !== "safety";
    message.placeholder = t.placeholder;
    prompts.innerHTML = "";
    if (t.prompts.length) {
      var intro = document.createElement("p");
      intro.textContent = "It helps to include:";
      var list = document.createElement("ul");
      t.prompts.forEach(function (p) {
        var li = document.createElement("li");
        li.textContent = p;
        list.appendChild(li);
      });
      prompts.appendChild(intro);
      prompts.appendChild(list);
    }
    if (focus) message.focus({ preventScroll: false });
  }

  // Links can preselect a topic and start the message, e.g. from the
  // delete-account page: support.html?topic=account&message=Please%20delete…
  var params = new URLSearchParams(location.search);
  if (params.get("topic")) choose(params.get("topic"), false);
  if (params.get("message")) message.value = params.get("message");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    error.hidden = true;
    var email = document.getElementById("email").value.trim();
    if (!topic) return showError("Choose what it’s about first.");
    if (message.value.trim().length < 10) return showError(ERRORS.message_too_short);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError(ERRORS.invalid_email);

    send.disabled = true;
    send.textContent = "Sending…";
    fetch(SUPABASE_URL + "/rest/v1/rpc/submit_support_request", {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic,
        message: message.value.trim(),
        email: email,
        name: document.getElementById("name").value.trim() || null,
        context: { platform: "web", userAgent: navigator.userAgent.slice(0, 200) },
        website: document.getElementById("website").value
      })
    })
      .then(function (res) {
        if (res.ok) {
          form.hidden = true;
          document.getElementById("sent-email").textContent = email;
          document.getElementById("sent").hidden = false;
          window.scrollTo(0, 0);
          return;
        }
        return res.json().then(function (body) {
          var text = (body && body.message) || "";
          var key = Object.keys(ERRORS).filter(function (k) { return text.indexOf(k) !== -1; })[0];
          showError(key ? ERRORS[key] : "Couldn’t send that — please try again, or email support@courtsy.my.");
        });
      })
      .catch(function () {
        showError("Couldn’t send that — check your connection, or email support@courtsy.my.");
      })
      .then(function () {
        send.disabled = false;
        send.textContent = "Send";
      });
  });

  function showError(text) {
    error.textContent = text;
    error.hidden = false;
  }
})();
