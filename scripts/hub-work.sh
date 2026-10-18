#!/usr/bin/env bash
# The work run's hands (.claude/commands/hub-work.md, decisions/0010).
#
# Each morning after the upkeep, one unattended session takes the next task (the owner's requests
# first, then the roadmap), claims it, does it in a folder of its own, passes the full gate and the
# reviewer, and opens one pull request for the owner to merge. Everything about that which needs no
# judgement is here: the session runs these commands and edits files inside the folder, and nothing
# else. The owner allowed exactly that (.claude/settings.local.json, 2026-10-03): `bash
# scripts/hub-work.sh *`, and edits under .claude/worktrees/hub-work/.
#
# What runs is only ever GitHub's master's code. A work run changes the site, never its tooling: a
# folder that touches scripts, tests, packages, plugins, workers, CI or Claude's own settings is
# refused by `run`, `gate` and `commit` (such a task is held for a session the owner opens). So
# an edit in the folder can never become a command the run then executes.
#
#   bash scripts/hub-work.sh begin               # fetch; merge what the rule lets merge; stop at three open or one three days old; a fresh folder; what to take next
#   bash scripts/hub-work.sh claim <key>         # take it: a branch work/<key> on GitHub, so nobody else does
#   bash scripts/hub-work.sh run <script> [--only <ids> [--viewport desktop|mobile]]   # one of: test, build:js, check:<name>, visual:build, visual:diff, visual:audit, visual:capture --only <ids>
#   bash scripts/hub-work.sh gate                # start the full gate in the background (about fifteen minutes)
#   bash scripts/hub-work.sh wait                # wait up to nine minutes for the gate or a long run; again until it says done
#   bash scripts/hub-work.sh diff                # the change against GitHub's master, new files included, to a file the reviewer reads
#   bash scripts/hub-work.sh commit "<message>"  # commit what changed in the folder
#   bash scripts/hub-work.sh pr "<title>" [--reviewer PASS|NOTES|BLOCK]   # push and open the pull request; its body is the folder's PR-BODY.md
#   bash scripts/hub-work.sh hold <key>          # it needs the owner: a branch hold/<key> asks the question in the folder's NOTE.md; the claim is let go
#   bash scripts/hub-work.sh scout               # Sunday: claim the week's scout, build the site and shoot every page into a folder to read
#   bash scripts/hub-work.sh finding <where>     # file what NOTE.md says as a finding, in the folder's plan
#   bash scripts/hub-work.sh idea                # raise what NOTE.md says as an idea of the lead's (two at most wait on the owner)
#   bash scripts/hub-work.sh abort               # nothing is kept; an empty claim is let go
#
# Words for the owner (a question, a finding, an idea) go in the folder's NOTE.md, written with the
# Write tool, never on the command line: a `$` or a backtick there waits for an approval nobody gives.
#
# It never touches master or the owner's checkout and never writes to R2. It merges only by the rule
# of decisions/0011: a work pull request labelled `unseen` when it was opened (no pixel moved, no
# content, no changelog line, no tooling, the full gate and the reviewer's plain PASS), a day old,
# untouched since, with no word from the owner on it, mergeable and green.
# Exit codes: 0 done · 1 refused · 2 usage · 3 nothing to do today (pull requests wait) · 4 still running

set -uo pipefail

GIT=git; [ -x /usr/bin/git ] && GIT=/usr/bin/git
REPO="$(cd "$("$GIT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/.." 2>/dev/null && pwd)"
[ -n "${REPO:-}" ] && [ -d "$REPO/_plan" ] || { echo "Run this from the repository." >&2; exit 2; }
WT="$REPO/.claude/worktrees/hub-work"
STATE="$REPO/.claude/worktrees/hub-work"   # prefix of the run's own files beside the folder
RUNS="$REPO/.claude/worktrees/hub-runs.log"
SLUG="QSDQSB/qsdqsb.github.io"
BASE=origin/master
export GIT_TERMINAL_PROMPT=0
NET=(-c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20)
limit() {   # limit <seconds> <command…>: the command's own exit, or 124 when cut off
  local tenths=$(( $1 * 10 )) waited=0; shift
  "$@" & local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$tenths" ]; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 124; fi
    sleep 0.2; waited=$(( waited + 2 ))
  done
  wait "$pid"
}
# The copy that runs is GitHub's master's once it has this hand-over, else the local master's, so the
# run does not change with the owner's work in progress (as hub-daily.sh does).
if [ -z "${HUB_WORK_HANDED:-}" ]; then
  mkdir -p "$REPO/.claude/worktrees"; run="$REPO/.claude/worktrees/hub-work.run.$$.sh"
  [ "${1:-}" = begin ] && limit 60 "$GIT" -C "$REPO" "${NET[@]}" fetch -q --prune origin 2>/dev/null
  for src in "$BASE" master; do
    if "$GIT" -C "$REPO" show "$src:scripts/hub-work.sh" > "$run" 2>/dev/null && grep -q HUB_WORK_HANDED "$run" \
       && mv -f "$run" "$REPO/.claude/worktrees/hub-work.run.sh"; then
      HUB_WORK_HANDED=1 exec bash "$REPO/.claude/worktrees/hub-work.run.sh" "$@"
    fi
  done
  rm -f "$run"
fi
unset HUB_WORK_HANDED

logrun() { mkdir -p "$(dirname "$RUNS")"; printf '%s\t%s\t%s\t%s\n' "$(cat "$STATE.started" 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "WORK: $1" "$2" >> "$RUNS"; }
in_wt() { [ -d "$WT/_plan" ] || { echo "No folder: run 'bash scripts/hub-work.sh begin' first." >&2; exit 2; }; }
branch() { "$GIT" -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null; }
claimed() { case "$(branch)" in work/*) return 0 ;; *) echo "REFUSED: nothing is claimed in this folder." >&2; exit 1 ;; esac; }
stopjob() { [ -f "$STATE.pid" ] && kill -- -"$(cat "$STATE.pid")" 2>/dev/null; rm -f "$STATE.pid" "$STATE.since" "$STATE.job"; return 0; }
tidy() {
  local b; b="$(branch 2>/dev/null || true)"
  stopjob
  "$GIT" -C "$REPO" worktree remove --force "$WT" 2>/dev/null; "$GIT" -C "$REPO" worktree prune 2>/dev/null
  [[ "$b" == work/* ]] && "$GIT" -C "$REPO" branch -q -D "$b" 2>/dev/null
  rm -f "$STATE.started" "$STATE.gatefp" "$STATE.passfp" "$STATE.gatesite" "$STATE.passsite"; return 0
}
# What the run writes for the owner: NOTE.md in the folder (the Write tool's), as one line of text.
note() {
  local n="$WT/NOTE.md"; [ -s "$n" ] || { echo "Write the words to $n first, with the Write tool (never on the command line)." >&2; exit 2; }
  tr '\n\r\t' '   ' < "$n" | sed 's/  */ /g; s/^ //; s/ $//'
}
key_ok() { [[ "${1:-}" =~ ^[a-z0-9][a-z0-9-]{0,47}$ ]] || { echo "A key is lowercase letters, digits and hyphens, as 'plan.mjs next' prints it." >&2; exit 2; }; }

# What a build leaves behind that no task means to change: put back before anything is judged.
byproducts() {
  "$GIT" -C "$WT" checkout -q -- Gemfile.lock scripts/.geocode-cache.json 2>/dev/null
  # A check's bytecode, made again from master's code. Removed by name: `git clean -X` would take every
  # ignored folder with it (the build, the copied manifests), whatever path it is given.
  find "$WT" -name __pycache__ -type d -prune -exec rm -r {} + 2>/dev/null
  return 0
}
# Every path the folder changes against GitHub's master, new files included.
changed() { byproducts; { "$GIT" -C "$WT" diff --no-renames --name-only "$BASE"; "$GIT" -C "$WT" ls-files --others --exclude-standard; } | grep -vE '^(PR-BODY|NOTE)\.md$' | sort -u; }
# The site's tooling: what runs when the folder is built, tested or gated. A work run never changes it.
TOOLING='^(scripts/|tests/|package(-lock)?\.json$|Gemfile|_plugins/|Rakefile$|\.github/|\.claude/|\.bundle/|workers/|functions/|wrangler|CLAUDE\.md$|\.[^/]+$)'
# What git ignores that a build or the folder's setup leaves, and nothing else: an ignored file is
# invisible to the diff, so one anywhere else (a node_modules under scripts/, say) could change what runs.
IGNORED_OK='^(_site/|\.sass-cache/|\.jekyll-cache/|\.jekyll-metadata$|node_modules$|images/cover/sized/|_data/cover_sizes\.json$|images/og/|_data/photo_manifests/|tests/visual/(current|diff)/|(.*/)?\.DS_Store$)'
no_tooling() {
  local t; t="$(changed | grep -E "$TOOLING" | grep -vE '^tests/visual/baseline/[a-z0-9-]+--(desktop|mobile)(-reduced)?\.png$' || true)"
  [ -z "$t" ] || { echo "REFUSED: this changes the site's tooling, which a work run never does: $(echo $t). Hold the task for a session ('hold')." >&2; exit 1; }
  local i; i="$("$GIT" -C "$WT" ls-files --others --ignored --exclude-standard --directory | grep -vE "$IGNORED_OK" || true)"
  [ -z "$i" ] || { echo "REFUSED: the folder holds files git ignores that no build leaves: $(echo $i). Remove them, or hold the task." >&2; exit 1; }
}
# What the folder holds against GitHub's master, as one hash: the gate's pass is good only for that.
# `fingerprint site` leaves out the plan: a line filed or ticked after a full gate needs only the fast one.
fingerprint() { changed | { if [ "${1:-}" = site ]; then grep -v '^_plan/'; else cat; fi; } | while IFS= read -r f; do if [ -f "$WT/$f" ]; then printf '%s %s\n' "$f" "$(shasum "$WT/$f" | cut -d' ' -f1)"; else printf '%s gone\n' "$f"; fi; done | shasum | cut -d' ' -f1; }
# Files that open work pull requests change (begin writes the list): a second one beside them would meet
# them in the same lines. The plan is left out: its lines merge, and the changelog merges by union.
no_overlap() {
  [ -s "$STATE.taken" ] || return 0
  local o; o="$(changed | grep -v '^_plan/' | grep -xF -f <(cut -f2 "$STATE.taken") || true)"
  [ -z "$o" ] || { echo "REFUSED: an open work pull request already changes $(echo $o) ($(grep -F -f <(printf '%s\n' $o) "$STATE.taken" | cut -f1 | sort -u | tr '\n' ' ')). Take another task ('abort', then 'begin'), or hold this one." >&2; exit 1; }
}
# Run a command in its own process group, so a cut-off stops everything it started; its exit is kept.
start_job() {
  local log="$1" name="$2"; shift 2; echo "$name" > "$STATE.job"; rm -f "$STATE.rc" "$STATE.slept"
  set -m; ( trap '' HUP; cd "$WT" && nohup "$@" > "$log" 2>&1; echo $? > "$STATE.rc" ) >/dev/null 2>&1 & local pid=$!; set +m
  echo "$pid" > "$STATE.pid"; date +%s > "$STATE.since"; date +%s > "$STATE.seen"
}
# The limits count time awake. A closed lid freezes the job with the clock running on: the system's
# own last sleep and wake (kern.sleeptime, kern.waketime), when the wake came since the last look,
# move the start on by the time asleep, which is kept to be said. Where there is no such clock (CI),
# nothing is moved. HUB_WORK_WAKE="<sleep> <wake>" stands in for it in the tests.
wakeclock() {
  if [ -n "${HUB_WORK_WAKE:-}" ]; then echo "$HUB_WORK_WAKE"; return; fi
  local sl wk
  sl="$(sysctl -n kern.sleeptime 2>/dev/null | sed -nE 's/^\{ sec = ([0-9]+).*/\1/p')"; wk="$(sysctl -n kern.waketime 2>/dev/null | sed -nE 's/^\{ sec = ([0-9]+).*/\1/p')"
  echo "${sl:-0} ${wk:-0}"
}
awake() {
  local now seen sl wk gap; now="$(date +%s)"; seen="$(cat "$STATE.seen" 2>/dev/null || echo "$now")"
  read -r sl wk <<< "$(wakeclock)"
  if [ "${wk:-0}" -gt "$seen" ] && [ "${sl:-0}" -gt 0 ] && [ "$wk" -gt "$sl" ]; then
    gap=$(( wk - (sl > seen ? sl : seen) ))
    if [ "$gap" -gt 0 ]; then
      echo $(( $(cat "$STATE.since") + gap )) > "$STATE.since"
      echo $(( $(cat "$STATE.slept" 2>/dev/null || echo 0) + gap )) > "$STATE.slept"
    fi
  fi
  echo "$now" > "$STATE.seen"
}
job_wait() {   # job_wait <max seconds now> <max seconds in all>: 0 done, 4 still running, 124 cut off
  local now="$1" all="$2" pid; pid="$(cat "$STATE.pid" 2>/dev/null)" || return 0
  local t=0
  awake
  while kill -0 "$pid" 2>/dev/null; do
    awake
    if [ $(( $(date +%s) - $(cat "$STATE.since") )) -ge "$all" ]; then kill -- -"$pid" 2>/dev/null; rm -f "$STATE.pid" "$STATE.since"; return 124; fi
    [ "$t" -ge "$now" ] && return 4
    sleep 2; t=$(( t + 2 ))
  done
  rm -f "$STATE.pid" "$STATE.since"; return 0
}
scout_done() {
  byproducts; rm -f "$STATE.job"; local shots="$STATE.scout"
  rm -rf "$shots"; mkdir -p "$shots"
  cp "$WT"/tests/visual/current/*.png "$shots/" 2>/dev/null
  local n; n="$(ls "$shots" | wc -l | tr -d ' ')"
  [ "$n" -gt 0 ] || { tail -30 "$STATE.scout.log"; slept_note; echo "The site was not shot. Run 'scout' again once ('abort' first), or report it." >&2; return 1; }
  echo "Shot: $n pictures of the built site, at desktop and phone width, in $shots/. Read them with the Read tool."
  grep -E "^\s*(✗|changed|differs)" "$STATE.scout.log" | head -10
  slept_note; return 0
}
finish_run() { byproducts; rm -f "$STATE.job"; tail -40 "$STATE.run.log"; slept_note; exit "$(cat "$STATE.rc" 2>/dev/null || echo 1)"; }
slept_note() { local s; s="$(cat "$STATE.slept" 2>/dev/null || echo 0)"; [ "$s" -gt 0 ] && echo "Note: the Mac slept about $(( (s + 59) / 60 )) min while it ran. A failure may be the sleep's: run it once more before looking for a fault."; return 0; }

case "${1:-}" in
  begin)
    mkdir -p "$REPO/.claude/worktrees"
    # A folder that holds today's claim is not swept away by a second 'begin' (10-15: run twice by mistake).
    if [ -d "$WT/_plan" ] && [[ "$(branch)" == work/* ]] && [ -s "$STATE.started" ] \
       && [ $(( $(date +%s) - $(node -e 'console.log(Math.floor(Date.parse(process.argv[1])/1000)||0)' "$(cat "$STATE.started")") )) -lt 21600 ]; then
      echo "REFUSED: the folder holds $(branch), claimed at $(cat "$STATE.started"). Carry on with it, or 'abort' first." >&2; exit 1
    fi
    fetched=1; limit 60 "$GIT" -C "$REPO" "${NET[@]}" fetch -q --prune origin 2>/dev/null || { fetched=""; echo "Note: GitHub did not answer within a minute; working from what was fetched before, and nothing merges by the rule today."; }
    "$GIT" -C "$REPO" rev-parse --verify --quiet "$BASE" >/dev/null || { echo "STOP: there is no $BASE here." >&2; exit 2; }
    prs="$(limit 60 gh pr list --repo "$SLUG" --state all --limit 200 --json number,state,headRefName,headRefOid,title,createdAt 2>/dev/null)" \
      || { echo "STOP: GitHub's pull requests could not be read, so nothing is started (what waits for the owner cannot be counted)." >&2; exit 2; }
    open="$(limit 60 gh pr list --repo "$SLUG" --state open --limit 50 --json number,state,headRefName,headRefOid,title,createdAt,labels,body,comments,reviews,mergeable,statusCheckRollup 2>/dev/null)" \
      || { echo "STOP: GitHub's open pull requests could not be read, so nothing is started." >&2; exit 2; }
    # Merged by the rule (decisions/0011): labelled unseen when opened, a day old, its head the commit that
    # was gated, no word from the owner, the label still on, mergeable, and every check green.
    owner="${SLUG%%/*}"; merged=""
    # The owner's one switch: "work_may_merge" in GitHub's master's _plan/hub.json (a change to that file is never unseen).
    may="$("$GIT" -C "$REPO" show "$BASE:_plan/hub.json" 2>/dev/null | node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync(0,"utf8")).work_may_merge===true))}catch{process.stdout.write("false")}')"
    [ "$may" = true ] && [ -n "$fetched" ] || { open="$(printf '%s' "$open" | node -e 'const a=JSON.parse(require("fs").readFileSync(0,"utf8"));for(const p of a)p.labels=[];console.log(JSON.stringify(a))')"; [ -n "$fetched" ] && echo "Note: nothing merges by the rule (work_may_merge is off in _plan/hub.json)."; }
    while IFS=$'\t' read -r n sha title; do
      [ -n "$n" ] || continue
      if limit 120 gh pr merge "$n" --repo "$SLUG" --merge --match-head-commit "$sha" </dev/null >/dev/null 2>&1; then
        echo "Merged by the rule (unseen, a day old, no word from you): #$n $title"; logrun "merged #$n by the rule (decisions/0011): $title" ""; merged="$merged $n"
      else echo "Note: #$n met the rule but GitHub did not merge it; it waits for you."; fi
    done < <(printf '%s' "$open" | node -e '
      const [owner] = process.argv.slice(1);
      const green = (c) => ["SUCCESS", "NEUTRAL", "SKIPPED"].includes(c.conclusion || c.state);
      for (const p of JSON.parse(require("fs").readFileSync(0, "utf8"))) {
        if (p.state !== "OPEN" || !p.headRefName.startsWith("work/")) continue;
        if (!(p.labels || []).some((l) => l.name === "unseen")) continue;
        if (Date.now() - new Date(p.createdAt) < 864e5) continue;
        const gated = ((p.body || "").match(/<!-- gated: ([0-9a-f]{40}) -->/) || [])[1];
        if (!gated || gated !== p.headRefOid) continue;
        if ([...(p.comments || []), ...(p.reviews || [])].some((c) => (c.author || {}).login === owner)) continue;
        if (p.mergeable !== "MERGEABLE") continue;
        const checks = p.statusCheckRollup || [];
        if (!checks.length || !checks.every(green)) continue;
        console.log([p.number, p.headRefOid, p.title.replace(/\s+/g, " ")].join("\t"));
      }' "$owner")
    # What waits for the owner: three open at most, and none three days old.
    waiting="$(printf '%s' "$open" | node -e '
      const merged = process.argv[1].split(" ").filter(Boolean).map(Number);
      for (const p of JSON.parse(require("fs").readFileSync(0, "utf8")).filter((p) => p.state === "OPEN" && p.headRefName.startsWith("work/") && !merged.includes(p.number))) {
        const d = Math.floor((Date.now() - new Date(p.createdAt)) / 864e5), u = (p.labels || []).some((l) => l.name === "unseen");
        console.log(`Waiting for the owner: #${p.number} ${p.title} (${d} day${d === 1 ? "" : "s"}${u ? "; unseen, merges itself unless you say" : ""})${d >= 3 ? " — paused: three days unmerged" : ""}\t${p.headRefName}`);
      }' "$merged")"
    if [ -n "$waiting" ]; then
      printf '%s\n' "$waiting" | cut -f1
      if printf '%s' "$waiting" | grep -q 'paused: three days'; then echo "Nothing is started today."; exit 3; fi
      if [ "$(printf '%s\n' "$waiting" | wc -l | tr -d ' ')" -ge 3 ]; then echo "Three wait for the owner. Nothing is started today."; exit 3; fi
    fi
    # Claims with no open pull request: one the owner closed unmerged becomes a question (0010: the
    # work is redone, so ask what should change); an empty claim over a day old is let go.
    for ref in $("$GIT" -C "$REPO" for-each-ref --format='%(refname:short)' refs/remotes/origin/work); do
      b="${ref#origin/}"; key="${b#work/}"
      # The pull request opened from this very tip, closed unmerged (a later claim of the same key is not it).
      closed="$(printf '%s' "$prs" | node -e 'const [b,tip]=process.argv.slice(1);const a=JSON.parse(require("fs").readFileSync(0,"utf8")).filter(p=>p.headRefName===b&&p.state==="CLOSED"&&(!p.headRefOid||p.headRefOid===tip));if(a.length)console.log(a[0].number)' "$b" "$("$GIT" -C "$REPO" rev-parse "$ref")")"
      if [ -n "$closed" ]; then
        tip="$("$GIT" -C "$REPO" rev-parse "$BASE")"
        msg="Held: $key"; why="You closed #$closed without merging it. What should change before it is done again?"
        c="$("$GIT" -C "$REPO" -c user.name=Claude -c user.email=noreply@anthropic.com commit-tree "$tip^{tree}" -p "$tip" -m "$msg" -m "$why" 2>/dev/null)" \
          && limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin "$c:refs/heads/hold/$key" ":refs/heads/$b" 2>/dev/null \
          && { echo "Closed unmerged, now a question for the owner: hold/$key"; logrun "held $key: $why" ""; }
      elif [ "$("$GIT" -C "$REPO" rev-list --count "$BASE..$ref")" -le 1 ] && "$GIT" -C "$REPO" log -1 --format=%B "$ref" | grep -q '^by the work run' \
           && [ $(( $(date +%s) - $("$GIT" -C "$REPO" log -1 --format=%ct "$ref") )) -gt 86400 ]; then
        limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin --delete "$b" 2>/dev/null && echo "Let go: an empty claim over a day old, $b"
      fi
    done
    tidy
    # The files the open ones change: a task here must keep off them (no_overlap).
    : > "$STATE.taken"
    printf '%s\n' "$waiting" | while IFS=$'\t' read -r line b; do
      [ -n "${b:-}" ] || continue; n="$(printf '%s' "$line" | sed -E 's/^Waiting for the owner: #([0-9]+).*/\1/')"
      "$GIT" -C "$REPO" diff --name-only "$BASE...origin/$b" 2>/dev/null | sed "s|^|#$n\t|" >> "$STATE.taken"
    done
    date -u +%Y-%m-%dT%H:%M:%SZ > "$STATE.started"
    "$GIT" -C "$REPO" worktree add --detach "$WT" "$BASE" >/dev/null 2>&1 || { echo "STOP: could not make the folder at $WT." >&2; logrun "STOP: no folder" ""; tidy; exit 2; }
    limit 120 bash "$REPO/scripts/prototype-setup.sh" "$WT" >/dev/null 2>&1 || echo "Note: the folder has no fetched data (prototype-setup.sh); the full gate will skip what needs it."
    echo "Folder: $WT (GitHub's master, $("$GIT" -C "$WT" rev-parse --short HEAD))"
    if [ -s "$STATE.taken" ]; then echo "── Kept off: files an open work pull request changes (outside the plan)"; grep -v $'\t_plan/' "$STATE.taken" | sed 's/\t/  /'; fi
    week="scout-$(date -u +%G-w%V)"
    if [ "$(date +%u)" = "${HUB_WORK_SCOUT_DAY:-7}" ] && ! printf '%s' "$prs" | grep -q "\"work/$week\"" \
       && ! "$GIT" -C "$REPO" rev-parse --verify --quiet "refs/remotes/origin/work/$week" >/dev/null; then
      echo "── Today is the scout's ($week, decisions/0011): no task is taken. Next: bash scripts/hub-work.sh scout"
    else
      echo "── What to take next (the first you can finish; a request before the roadmap)"
      (cd "$WT" && node scripts/plan.mjs next)
    fi
    ;;

  claim)
    in_wt; key_ok "${2:-}"
    [ "$(branch)" = HEAD ] || { echo "Already on $(branch): one task a run." >&2; exit 1; }
    if "$GIT" -C "$REPO" ls-remote --exit-code --heads origin "work/$2" "hold/$2" >/dev/null 2>&1; then echo "REFUSED: $2 is already claimed or held on GitHub. Take the next." >&2; exit 1; fi
    # A claim of its own (a commit no one else can make), so a second claimant's push is not a fast-forward and is refused.
    "$GIT" -C "$WT" -c user.name=Claude -c user.email=noreply@anthropic.com commit -q --allow-empty -m "Claimed: $2" -m "by the work run, $(date -u +%Y-%m-%dT%H:%M:%SZ), $$-$RANDOM" || exit 1
    "$GIT" -C "$WT" switch -q -c "work/$2" || exit 1
    if ! limit 60 "$GIT" -C "$WT" "${NET[@]}" push -q origin "work/$2:refs/heads/work/$2" 2>/dev/null; then
      "$GIT" -C "$WT" switch -q --detach "$BASE"; "$GIT" -C "$WT" branch -q -D "work/$2"
      echo "REFUSED: the claim could not be pushed (someone may have claimed it a moment ago); nothing is claimed." >&2; exit 1
    fi
    echo "Claimed: work/$2. Edit only inside $WT."
    ;;

  run)
    in_wt; s="${2:-}"; shift 2 2>/dev/null || shift $#
    case "$s" in
      test|build:js|visual:build|visual:diff|visual:audit) [ $# -eq 0 ] || { echo "$s takes no arguments here." >&2; exit 2; } ;;
      check:*) [[ "$s" =~ ^check:[a-z-]+$ ]] && [ $# -eq 0 ] || { echo "check: takes a plain name and no arguments." >&2; exit 2; } ;;
      visual:capture)
        # Only the pages the task meant to change: a capture of all of them would swallow a regression elsewhere.
        # And only the width it meant to change, when it meant one (10-05: a phone fix re-wrote the desktop shot).
        [ "${1:-}" = --only ] && [ -n "${2:-}" ] && { [ $# -eq 2 ] || { [ $# -eq 4 ] && [ "$3" = --viewport ] && [[ "$4" =~ ^(desktop|mobile)$ ]]; }; } \
          || { echo "visual:capture takes --only <id>[,<id>], and --viewport desktop|mobile when only one width is meant." >&2; exit 2; }
        known="$(grep -oE "id: '[a-z0-9-]+'" "$WT/scripts/visual-baseline.mjs" | sed "s/id: '//; s/'//")"
        for id in ${2//,/ }; do [[ "$id" =~ ^[a-z0-9-]+$ ]] && printf '%s\n' "$known" | grep -qxF "$id" || { echo "No page '$id' in the pixel harness." >&2; exit 2; }; done ;;
      *) echo "run takes one of: test, build:js, check:<name>, visual:build, visual:diff, visual:audit, visual:capture --only <ids>." >&2; exit 2 ;;
    esac
    no_tooling
    [ -f "$STATE.pid" ] && kill -0 "$(cat "$STATE.pid")" 2>/dev/null && { echo "The $(cat "$STATE.job" 2>/dev/null || echo job) is still running: 'wait' for it first." >&2; exit 4; }
    log="$STATE.run.log"
    [ "$s" = visual:build ] && rm -rf "$WT/.jekyll-cache"   # as at the gate
    # The script's name and its arguments go in as parameters, never inside the command's text.
    start_job "$log" run bash -lc 'npm run --silent "$0" -- "$@"' "$s" "$@" 2>/dev/null
    # Up to nine minutes in this call; a longer one (a pixel diff, about eight) goes on into 'wait'.
    job_wait 540 1800; rc=$?
    case "$rc" in
      4) echo "Still running after nine minutes. Next: bash scripts/hub-work.sh wait"; exit 4 ;;
      124) tail -40 "$log"; echo "Cut off after thirty minutes awake, and stopped."; slept_note; exit 124 ;;
    esac
    finish_run
    ;;

  gate)
    in_wt; no_tooling; no_overlap
    # NOTE.md is spent by the line that reads it; one left over would be built into the site.
    [ ! -s "$WT/NOTE.md" ] || { echo "REFUSED: NOTE.md still holds words. Use them ('hold', 'finding', 'idea'), or write it empty with the Write tool to drop them." >&2; exit 1; }
    rm -f "$WT/NOTE.md"
    [ -f "$STATE.pid" ] && kill -0 "$(cat "$STATE.pid")" 2>/dev/null && { echo "The $(cat "$STATE.job" 2>/dev/null || echo job) is already running: 'wait'." >&2; exit 4; }
    rm -f "$STATE.passfp" "$STATE.passsite"; fingerprint > "$STATE.gatefp"; fingerprint site > "$STATE.gatesite"
    rm -rf "$WT/.jekyll-cache"   # Jekyll reads its cache back as Ruby objects: it is never one the folder could have written
    start_job "$STATE.gate" gate bash -lc 'bash scripts/gate.sh --full' 2>/dev/null
    echo "The full gate is running (about fifteen minutes). Next: bash scripts/hub-work.sh wait"
    ;;

  wait)
    in_wt
    if [ ! -f "$STATE.pid" ]; then
      [ "$(cat "$STATE.job" 2>/dev/null)" = run ] && finish_run
      echo "Nothing is running. The last gate:"; tail -1 "$STATE.gate" 2>/dev/null; tail -1 "$STATE.gate" 2>/dev/null | grep -q '^GATE: PASS'; exit $?
    fi
    job="$(cat "$STATE.job" 2>/dev/null)"
    if [ "$job" = run ]; then all=1800; else all=2400; fi
    job_wait 540 "$all"; rc=$?
    case "$rc" in
      4) echo "Still running ($(( ($(date +%s) - $(cat "$STATE.since")) / 60 )) min awake). Run 'wait' again."; exit 4 ;;
      124) if [ "$job" = run ]; then tail -40 "$STATE.run.log"; echo "Cut off after thirty minutes awake, and stopped."; else echo "GATE: cut off after forty minutes awake, and stopped." | tee -a "$STATE.gate"; fi; slept_note; exit 124 ;;
    esac
    [ "$job" = run ] && finish_run
    [ "$job" = scout ] && { scout_done; exit $?; }
    byproducts
    rm -f "$STATE.job"
    grep -E "^(✗|✖)" "$STATE.gate" | head -20; tail -1 "$STATE.gate"; echo "Log: $STATE.gate"; slept_note
    tail -1 "$STATE.gate" | grep -q '^GATE: PASS' || exit 1
    # The pass is good for the tree the gate saw, if nothing has changed since it began.
    if [ "$(fingerprint)" = "$(cat "$STATE.gatefp" 2>/dev/null)" ]; then cp "$STATE.gatefp" "$STATE.passfp"; cp "$STATE.gatesite" "$STATE.passsite"
    else echo "Note: the folder changed while the gate ran; gate again before 'pr'."; fi
    ;;

  diff)
    in_wt; byproducts
    "$GIT" -C "$WT" add -A -N -- . ':!PR-BODY.md' ':!NOTE.md' 2>/dev/null   # new files show in the diff without being staged
    out="$STATE.diff"
    { "$GIT" -C "$WT" diff --stat "$BASE"; echo; "$GIT" -C "$WT" diff "$BASE"; } > "$out"
    echo "Diff: $out ($("$GIT" -C "$WT" diff --shortstat "$BASE"))"
    ;;

  commit)
    in_wt; msg="${2:-}"; [ -n "$msg" ] || { echo "commit needs a message: an emoji, then what changed." >&2; exit 2; }
    claimed; no_tooling; no_overlap
    "$GIT" -C "$WT" add -A -- . ':!PR-BODY.md' ':!NOTE.md'
    # Never in a work run's commit: photographs, their manifests, keys.
    bad="$("$GIT" -C "$WT" diff --cached --name-only | grep -E '^(photos/|_data/photo_manifests/|\.env|.*\.pem$)' || true)"
    [ -z "$bad" ] || { "$GIT" -C "$WT" reset -q; echo "REFUSED: these never go in a work run's commit: $bad" >&2; exit 1; }
    "$GIT" -C "$WT" -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" \
      commit -q -m "$msg" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && "$GIT" -C "$WT" log --oneline -1
    ;;

  pr)
    in_wt; title="${2:-}"; [ -n "$title" ] || { echo "pr needs a title." >&2; exit 2; }
    verdict=""; [ "${3:-}" = --reviewer ] && verdict="${4:-}"
    [ -z "${3:-}" ] || [[ "$verdict" =~ ^(PASS|NOTES|BLOCK)$ ]] || { echo "pr takes --reviewer PASS, NOTES (pass with notes) or BLOCK: what the reviewer said last." >&2; exit 2; }
    claimed; b="$(branch)"; no_tooling; no_overlap
    [ -s "$WT/PR-BODY.md" ] || { echo "Write the pull request's body to $WT/PR-BODY.md first." >&2; exit 2; }
    [ "$("$GIT" -C "$WT" diff --name-only "$BASE" HEAD | wc -l | tr -d ' ')" != 0 ] || { echo "REFUSED: nothing is committed." >&2; exit 1; }
    byproducts; [ -z "$("$GIT" -C "$WT" status --porcelain -- . ':!PR-BODY.md' ':!NOTE.md')" ] || { echo "REFUSED: the folder holds changes not committed. 'commit' first." >&2; exit 1; }
    # The full gate's pass holds for the tree it saw. A change to the plan alone since (a line filed or
    # ticked), or a change that is the plan alone (the scout's), needs only the fast gate.
    proof="the full gate"
    if [ -f "$STATE.passfp" ] && [ "$(fingerprint)" = "$(cat "$STATE.passfp")" ]; then :
    elif { [ -f "$STATE.passsite" ] && [ "$(fingerprint site)" = "$(cat "$STATE.passsite")" ]; } || [ -z "$(changed | grep -v '^_plan/')" ]; then
      echo "Only the plan changed since a full gate (or the change is the plan alone): the fast gate checks it."
      ( cd "$WT" && limit 540 bash -lc 'bash scripts/gate.sh' > "$STATE.fastgate" 2>&1 ); tail -1 "$STATE.fastgate"
      tail -1 "$STATE.fastgate" | grep -q '^GATE: PASS' || { echo "REFUSED: the fast gate did not pass (log: $STATE.fastgate)." >&2; exit 1; }
      [ -f "$STATE.passsite" ] && proof="the full gate (and the fast gate on the plan after it)" || proof="the fast gate (the change is the plan alone, which the site never reads)"
    else echo "REFUSED: the full gate has not passed on the folder as it is now. 'gate', then 'wait'." >&2; exit 1; fi
    # Unseen (decisions/0011) is a list of what may be: the plan (but the owner's own files, the changelog,
    # an owner's quote in an idea taken away or rewritten, and an owner's decision line touched at all), the docs, and the site's code, whose
    # pixel diff is the test of tier 0. Anything else, a new served folder among it, is seen.
    MAY_BE_UNSEEN='^(_plan/|_docs/|_sass/|_includes/|_layouts/|assets/js/|assets/css/)'
    OWNERS='^_plan/(CHANGELOG\.md|PRINCIPLES\.md|DESIGN-LANGUAGE\.md|QUEUE\.md|hub\.json|decisions/)'
    seen="$(changed | { grep -vE "$MAY_BE_UNSEEN" || true; }; changed | grep -E "$OWNERS" || true)"
    if "$GIT" -C "$WT" diff --no-renames -U0 "$BASE" -- _plan/ideas | grep -qE '^-> |^[-+]\*\*The owner:\*\*'; then seen="$seen _plan/ideas/ (the owner's words)"; fi
    seen="$(echo $seen)"
    unseen=""; [ -z "$seen" ] && [ "$verdict" = PASS ] && unseen=1
    limit 120 "$GIT" -C "$WT" "${NET[@]}" -c http.postBuffer=524288000 push -q origin "$b:refs/heads/$b" 2>/dev/null || { echo "REFUSED: the push failed; nothing is opened." >&2; exit 1; }
    cp "$WT/PR-BODY.md" "$STATE.body"
    label=()
    if [ -n "$unseen" ]; then
      limit 30 gh label create unseen --repo "$SLUG" --color 6b6b6b --description "No reader sees it; merges itself a day after it opened unless the owner says (decisions/0011)" </dev/null >/dev/null 2>&1
      printf '\n---\n**Unseen** (decisions/0011): no pixel moved, nothing a reader is given; %s and the reviewer passed. It merges itself on the first morning run a full day after it opened, unless you comment, review, or take off the label `unseen`.\n<!-- gated: %s -->\n' "$proof" "$("$GIT" -C "$WT" rev-parse HEAD)" >> "$STATE.body"
      label=(--label unseen)
    fi
    url="$(limit 60 gh pr create --repo "$SLUG" --base master --head "$b" --title "$title" --body-file "$STATE.body" ${label[@]+"${label[@]}"} </dev/null 2>&1 | tail -1)"
    case "$url" in
      https://*) echo "Opened: $url${unseen:+ (unseen: merges itself on the first morning a full day from now, unless the owner says)}"; logrun "${b#work/} → $url${unseen:+ (unseen)}" "pushed"; tidy ;;
      *) echo "REFUSED: the pull request was not opened: $url" >&2; exit 1 ;;
    esac
    [ -n "$unseen" ] || [ -z "$seen" ] || echo "Not unseen (the owner merges it): $(echo $seen | cut -c1-200)"
    [ -n "$unseen" ] || [ -n "$seen" ] || echo "Not unseen (the owner merges it): the reviewer's last word was ${verdict:-not given}, not a plain PASS."
    ;;

  hold)
    in_wt; key_ok "${2:-}"; why="$(printf '%s' "${3:-}" | tr '\n\r\t' '   ')"; [ -n "$why" ] || why="$(note)" || exit 2
    # The question rides on an empty commit on GitHub's master, on a branch of its own: no pull request,
    # and nothing taken from master. The brief shows it; a session the owner answers deletes the branch.
    tip="$("$GIT" -C "$REPO" rev-parse "$BASE")"
    c="$("$GIT" -C "$REPO" -c user.name=Claude -c user.email=noreply@anthropic.com commit-tree "$tip^{tree}" -p "$tip" -m "Held: $2" -m "$why")" || exit 1
    limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin "$c:refs/heads/hold/$2" 2>/dev/null || { echo "REFUSED: the hold could not be pushed." >&2; exit 1; }
    "$GIT" -C "$REPO" ls-remote --exit-code --heads origin "work/$2" >/dev/null 2>&1 && limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin --delete "work/$2" 2>/dev/null
    logrun "held $2: $why" ""
    echo "Held: hold/$2. Run 'begin' again for a fresh folder and the next task."
    tidy
    ;;

  scout)
    # Sunday (decisions/0011): no task; the site as built, every page of the pixel harness shot at both
    # widths, for the run to read against the design language and the principles.
    in_wt; week="scout-$(date -u +%G-w%V)"
    HUB_WORK_HANDED=1 bash "$0" claim "$week" || exit 1
    rm -rf "$WT/.jekyll-cache" "$WT/tests/visual/current"
    start_job "$STATE.scout.log" scout bash -lc 'npm run --silent visual:build && { npm run --silent visual:diff; true; }' 2>/dev/null
    echo "Building the site and shooting every page (about fifteen minutes). Next: bash scripts/hub-work.sh wait"
    ;;

  finding)
    in_wt; claimed; where="${2:-}"; [ -n "$where" ] && [ $# -eq 2 ] || { echo "finding takes <where> (a page or a file); what was seen goes in NOTE.md." >&2; exit 2; }
    what="$(note)" || exit 2
    (cd "$WT" && node scripts/plan.mjs finding "$where" "$what (the scout)") && rm -f "$WT/NOTE.md"
    ;;

  idea)
    in_wt; claimed; what="$(note)" || exit 2
    # Two of the lead's at most wait on the owner at a time (_plan/ideas/README.md).
    n="$(grep -lE '^\*\*Status:\*\* (raw|shaped) .*by the lead' "$WT"/_plan/ideas/I*.md 2>/dev/null | wc -l | tr -d ' ')"
    [ "$n" -lt 2 ] || { echo "REFUSED: two ideas of the lead's already wait on the owner. File it as a finding, or keep it for next week." >&2; exit 1; }
    (cd "$WT" && node scripts/plan.mjs idea "$what" --by lead) && rm -f "$WT/NOTE.md"
    ;;

  abort)
    b="$(branch 2>/dev/null || true)"
    if [ -d "$WT/_plan" ] && [[ "$b" == work/* ]] && [ "$("$GIT" -C "$WT" diff --name-only "$BASE" HEAD | wc -l | tr -d ' ')" = 0 ]; then
      limit 60 "$GIT" -C "$WT" "${NET[@]}" push -q origin --delete "$b" 2>/dev/null && echo "Let go: $b"
    fi
    [ -f "$STATE.started" ] && logrun "STOP: aborted, nothing kept" ""
    tidy; echo "Tidied. Nothing was kept."
    ;;

  *) sed -n '2,37p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
