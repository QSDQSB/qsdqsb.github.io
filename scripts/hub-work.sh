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
#   bash scripts/hub-work.sh begin               # fetch; tidy old claims; stop if a work pull request waits; a fresh folder; what to take next
#   bash scripts/hub-work.sh claim <key>         # take it: a branch work/<key> on GitHub, so nobody else does
#   bash scripts/hub-work.sh run <script> [--only <ids>]   # one of: test, build:js, check:<name>, visual:build, visual:diff, visual:audit, visual:capture --only <ids>
#   bash scripts/hub-work.sh gate                # start the full gate in the background (about ten minutes)
#   bash scripts/hub-work.sh wait                # wait up to nine minutes for it; again until it says done
#   bash scripts/hub-work.sh diff                # the change against GitHub's master, new files included, to a file the reviewer reads
#   bash scripts/hub-work.sh commit "<message>"  # commit what changed in the folder
#   bash scripts/hub-work.sh pr "<title>"        # push and open the pull request; its body is the folder's PR-BODY.md
#   bash scripts/hub-work.sh hold <key> "<why>"  # it needs the owner: a branch hold/<key> asks the question; the claim is let go
#   bash scripts/hub-work.sh abort               # nothing is kept; an empty claim is let go
#
# It never touches master or the owner's checkout, never merges, never writes to R2.
# Exit codes: 0 done · 1 refused · 2 usage · 3 nothing to do today (a work pull request waits) · 4 still running

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
  rm -f "$STATE.started" "$STATE.gatefp" "$STATE.passfp"; return 0
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
changed() { byproducts; { "$GIT" -C "$WT" diff --name-only "$BASE"; "$GIT" -C "$WT" ls-files --others --exclude-standard; } | grep -v '^PR-BODY\.md$' | sort -u; }
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
fingerprint() { changed | while IFS= read -r f; do if [ -f "$WT/$f" ]; then printf '%s %s\n' "$f" "$(shasum "$WT/$f" | cut -d' ' -f1)"; else printf '%s gone\n' "$f"; fi; done | shasum | cut -d' ' -f1; }
# Run a command in its own process group, so a cut-off stops everything it started.
start_job() { local log="$1" name="$2"; shift 2; echo "$name" > "$STATE.job"; set -m; ( cd "$WT" && exec nohup "$@" > "$log" 2>&1 ) & local pid=$!; set +m; echo "$pid" > "$STATE.pid"; date +%s > "$STATE.since"; }
job_wait() {   # job_wait <max seconds now> <max seconds in all>: 0 done, 4 still running, 124 cut off
  local now="$1" all="$2" pid since; pid="$(cat "$STATE.pid" 2>/dev/null)" || return 0; since="$(cat "$STATE.since")"
  local t=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ $(( $(date +%s) - since )) -ge "$all" ]; then kill -- -"$pid" 2>/dev/null; rm -f "$STATE.pid" "$STATE.since"; return 124; fi
    [ "$t" -ge "$now" ] && return 4
    sleep 2; t=$(( t + 2 ))
  done
  rm -f "$STATE.pid" "$STATE.since"; return 0
}

case "${1:-}" in
  begin)
    mkdir -p "$REPO/.claude/worktrees"
    limit 60 "$GIT" -C "$REPO" "${NET[@]}" fetch -q --prune origin 2>/dev/null || echo "Note: GitHub did not answer within a minute; working from what was fetched before."
    "$GIT" -C "$REPO" rev-parse --verify --quiet "$BASE" >/dev/null || { echo "STOP: there is no $BASE here." >&2; exit 2; }
    prs="$(limit 60 gh pr list --repo "$SLUG" --state all --limit 200 --json number,state,headRefName,headRefOid,title,createdAt 2>/dev/null)" \
      || { echo "STOP: GitHub's pull requests could not be read, so nothing is started (one work pull request at a time cannot be kept)." >&2; exit 2; }
    # One work pull request at a time: none is started while one waits for the owner.
    waiting="$(printf '%s' "$prs" | node -e 'const a=JSON.parse(require("fs").readFileSync(0,"utf8"));for(const p of a.filter(p=>p.state==="OPEN"&&p.headRefName.startsWith("work/"))){const d=Math.floor((Date.now()-new Date(p.createdAt))/864e5);console.log(`Waiting for the owner: #${p.number} ${p.title} (${d} day${d===1?"":"s"})${d>=3?" — paused: three days unmerged":""}`)}')"
    if [ -n "$waiting" ]; then echo "$waiting"; echo "Nothing is started today."; exit 3; fi
    # Claims with no open pull request: one the owner closed unmerged becomes a question (0010: the
    # work is redone, so ask what should change); an empty claim over a day old is let go.
    for ref in $("$GIT" -C "$REPO" for-each-ref --format='%(refname:short)' refs/remotes/origin/work); do
      b="${ref#origin/}"; key="${b#work/}"
      # The pull request opened from this very tip, closed unmerged (a later claim of the same key is not it).
      closed="$(printf '%s' "$prs" | node -e 'const [b,tip]=process.argv.slice(1);const a=JSON.parse(require("fs").readFileSync(0,"utf8")).filter(p=>p.headRefName===b&&p.state==="CLOSED"&&(!p.headRefOid||p.headRefOid===tip));if(a.length)console.log(a[0].number)' "$b" "$("$GIT" -C "$REPO" rev-parse "$ref")")"
      if [ -n "$closed" ]; then
        tip="$("$GIT" -C "$REPO" rev-parse "$BASE")"
        msg="Held: $key"; why="You closed #$closed without merging it. What should change before it is done again?"
        c="$("$GIT" -C "$REPO" commit-tree "$tip^{tree}" -p "$tip" -m "$msg" -m "$why" 2>/dev/null)" \
          && limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin "$c:refs/heads/hold/$key" ":refs/heads/$b" 2>/dev/null \
          && { echo "Closed unmerged, now a question for the owner: hold/$key"; logrun "held $key: $why" ""; }
      elif [ "$("$GIT" -C "$REPO" rev-list --count "$BASE..$ref")" -le 1 ] && "$GIT" -C "$REPO" log -1 --format=%B "$ref" | grep -q '^by the work run' \
           && [ $(( $(date +%s) - $("$GIT" -C "$REPO" log -1 --format=%ct "$ref") )) -gt 86400 ]; then
        limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin --delete "$b" 2>/dev/null && echo "Let go: an empty claim over a day old, $b"
      fi
    done
    tidy
    date -u +%Y-%m-%dT%H:%M:%SZ > "$STATE.started"
    "$GIT" -C "$REPO" worktree add --detach "$WT" "$BASE" >/dev/null 2>&1 || { echo "STOP: could not make the folder at $WT." >&2; logrun "STOP: no folder" ""; tidy; exit 2; }
    limit 120 bash "$REPO/scripts/prototype-setup.sh" "$WT" >/dev/null 2>&1 || echo "Note: the folder has no fetched data (prototype-setup.sh); the full gate will skip what needs it."
    echo "Folder: $WT (GitHub's master, $("$GIT" -C "$WT" rev-parse --short HEAD))"
    echo "── What to take next (the first you can finish; a request before the roadmap)"
    (cd "$WT" && node scripts/plan.mjs next)
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
        [ "${1:-}" = --only ] && [ -n "${2:-}" ] && [ $# -eq 2 ] || { echo "visual:capture takes --only <id>[,<id>]: the pages the task meant to change." >&2; exit 2; }
        known="$(grep -oE "id: '[a-z0-9-]+'" "$WT/scripts/visual-baseline.mjs" | sed "s/id: '//; s/'//")"
        for id in ${2//,/ }; do [[ "$id" =~ ^[a-z0-9-]+$ ]] && printf '%s\n' "$known" | grep -qxF "$id" || { echo "No page '$id' in the pixel harness." >&2; exit 2; }; done ;;
      *) echo "run takes one of: test, build:js, check:<name>, visual:build, visual:diff, visual:audit, visual:capture --only <ids>." >&2; exit 2 ;;
    esac
    no_tooling
    [ -f "$STATE.pid" ] && kill -0 "$(cat "$STATE.pid")" 2>/dev/null && { echo "The $(cat "$STATE.job" 2>/dev/null || echo job) is still running: 'wait' for it first." >&2; exit 4; }
    log="$STATE.run.log"
    # The script's name and its arguments go in as parameters, never inside the command's text.
    start_job "$log" run bash -lc 'npm run --silent "$0" -- "$@"' "$s" "$@" 2>/dev/null; pid="$(cat "$STATE.pid")"
    job_wait 540 540; rc=$?
    case "$rc" in 4|124) kill -- -"$pid" 2>/dev/null; rm -f "$STATE.pid" "$STATE.since"; tail -40 "$log"; echo "Cut off after nine minutes, and stopped."; exit 124 ;; esac
    wait "$pid" 2>/dev/null; rc=$?
    byproducts; tail -40 "$log"
    exit "$rc"
    ;;

  gate)
    in_wt; no_tooling
    [ -f "$STATE.pid" ] && kill -0 "$(cat "$STATE.pid")" 2>/dev/null && { echo "The gate is already running: 'wait'." >&2; exit 4; }
    rm -f "$STATE.passfp"; fingerprint > "$STATE.gatefp"
    start_job "$STATE.gate" gate bash -lc 'bash scripts/gate.sh --full' 2>/dev/null
    echo "The full gate is running (about ten minutes). Next: bash scripts/hub-work.sh wait"
    ;;

  wait)
    in_wt
    if [ ! -f "$STATE.pid" ]; then echo "Nothing is running. The last gate:"; tail -1 "$STATE.gate" 2>/dev/null; tail -1 "$STATE.gate" 2>/dev/null | grep -q '^GATE: PASS'; exit $?; fi
    [ "$(cat "$STATE.job" 2>/dev/null)" = gate ] || { echo "What is running is a 'run', not the gate; it ends within nine minutes of its start." >&2; exit 4; }
    job_wait 540 2400; rc=$?
    case "$rc" in
      4) echo "Still running ($(( ($(date +%s) - $(cat "$STATE.since")) / 60 )) min). Run 'wait' again."; exit 4 ;;
      124) echo "GATE: cut off after forty minutes, and stopped." | tee -a "$STATE.gate"; exit 124 ;;
    esac
    byproducts
    rm -f "$STATE.job"
    grep -E "^(✗|✖)" "$STATE.gate" | head -20; tail -1 "$STATE.gate"; echo "Log: $STATE.gate"
    tail -1 "$STATE.gate" | grep -q '^GATE: PASS' || exit 1
    # The pass is good for the tree the gate saw, if nothing has changed since it began.
    [ "$(fingerprint)" = "$(cat "$STATE.gatefp" 2>/dev/null)" ] && cp "$STATE.gatefp" "$STATE.passfp" || echo "Note: the folder changed while the gate ran; gate again before 'pr'."
    ;;

  diff)
    in_wt; byproducts
    "$GIT" -C "$WT" add -A -N -- . ':!PR-BODY.md' 2>/dev/null   # new files show in the diff without being staged
    out="$STATE.diff"
    { "$GIT" -C "$WT" diff --stat "$BASE"; echo; "$GIT" -C "$WT" diff "$BASE"; } > "$out"
    echo "Diff: $out ($("$GIT" -C "$WT" diff --shortstat "$BASE"))"
    ;;

  commit)
    in_wt; msg="${2:-}"; [ -n "$msg" ] || { echo "commit needs a message: an emoji, then what changed." >&2; exit 2; }
    claimed; no_tooling
    "$GIT" -C "$WT" add -A -- . ':!PR-BODY.md'
    # Never in a work run's commit: photographs, their manifests, keys.
    bad="$("$GIT" -C "$WT" diff --cached --name-only | grep -E '^(photos/|_data/photo_manifests/|\.env|.*\.pem$)' || true)"
    [ -z "$bad" ] || { "$GIT" -C "$WT" reset -q; echo "REFUSED: these never go in a work run's commit: $bad" >&2; exit 1; }
    "$GIT" -C "$WT" -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" \
      commit -q -m "$msg" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && "$GIT" -C "$WT" log --oneline -1
    ;;

  pr)
    in_wt; title="${2:-}"; [ -n "$title" ] || { echo "pr needs a title." >&2; exit 2; }
    claimed; b="$(branch)"
    [ -s "$WT/PR-BODY.md" ] || { echo "Write the pull request's body to $WT/PR-BODY.md first." >&2; exit 2; }
    [ "$("$GIT" -C "$WT" diff --name-only "$BASE" HEAD | wc -l | tr -d ' ')" != 0 ] || { echo "REFUSED: nothing is committed." >&2; exit 1; }
    [ -f "$STATE.passfp" ] && [ "$(fingerprint)" = "$(cat "$STATE.passfp")" ] || { echo "REFUSED: the full gate has not passed on the folder as it is now. 'gate', then 'wait'." >&2; exit 1; }
    limit 120 "$GIT" -C "$WT" "${NET[@]}" -c http.postBuffer=524288000 push -q origin "$b:refs/heads/$b" 2>/dev/null || { echo "REFUSED: the push failed; nothing is opened." >&2; exit 1; }
    url="$(limit 60 gh pr create --repo "$SLUG" --base master --head "$b" --title "$title" --body-file "$WT/PR-BODY.md" 2>&1 | tail -1)"
    case "$url" in https://*) echo "Opened: $url"; logrun "${b#work/} → $url" "pushed"; tidy ;; *) echo "REFUSED: the pull request was not opened: $url" >&2; exit 1 ;; esac
    ;;

  hold)
    in_wt; key_ok "${2:-}"; why="$(printf '%s' "${3:-}" | tr '\n\r\t' '   ')"; [ -n "$why" ] || { echo "hold needs why: the question for the owner." >&2; exit 2; }
    # The question rides on an empty commit on GitHub's master, on a branch of its own: no pull request,
    # and nothing taken from master. The brief shows it; a session the owner answers deletes the branch.
    tip="$("$GIT" -C "$REPO" rev-parse "$BASE")"
    c="$("$GIT" -C "$REPO" commit-tree "$tip^{tree}" -p "$tip" -m "Held: $2" -m "$why")" || exit 1
    limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin "$c:refs/heads/hold/$2" 2>/dev/null || { echo "REFUSED: the hold could not be pushed." >&2; exit 1; }
    "$GIT" -C "$REPO" ls-remote --exit-code --heads origin "work/$2" >/dev/null 2>&1 && limit 60 "$GIT" -C "$REPO" "${NET[@]}" push -q origin --delete "work/$2" 2>/dev/null
    logrun "held $2: $why" ""
    echo "Held: hold/$2. Run 'begin' again for a fresh folder and the next task."
    tidy
    ;;

  abort)
    b="$(branch 2>/dev/null || true)"
    if [ -d "$WT/_plan" ] && [[ "$b" == work/* ]] && [ "$("$GIT" -C "$WT" diff --name-only "$BASE" HEAD | wc -l | tr -d ' ')" = 0 ]; then
      limit 60 "$GIT" -C "$WT" "${NET[@]}" push -q origin --delete "$b" 2>/dev/null && echo "Let go: $b"
    fi
    [ -f "$STATE.started" ] && logrun "STOP: aborted, nothing kept" ""
    tidy; echo "Tidied. Nothing was kept."
    ;;

  *) sed -n '2,29p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
