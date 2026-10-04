#!/usr/bin/env bash
# The daily run's hands (.claude/commands/hub-daily.md).
#
# Everything about the run that needs no judgement is here, so an unattended agent
# runs a handful of commands and not dozens: a place of its own to work in, the two
# checks before anything is kept, the commit, the one push it may make, and the
# tidying up. The agent's part is what is left: reading the owner's answers from
# the command centre, recording them, and filing what it notices.
#
#   bash scripts/hub-daily.sh begin              # a worktree on hub/daily, GitHub's master merged in, the checks run
#   bash scripts/hub-daily.sh plan <args…>       # node scripts/plan.mjs <args…>, inside the worktree:
#                                                #   plan sync <folder>   record what the page's store holds
#                                                #   plan debt            files nothing loads, not yet in the inbox
#                                                #   plan finding "<where>" "<what>" --by daily
#   bash scripts/hub-daily.sh check              # the plan check, inside the worktree
#   bash scripts/hub-daily.sh brief [day]        # the day brief, for yesterday unless a day is given; prints the file and where it is published
#   bash scripts/hub-daily.sh page               # build the command centre there; prints the file to publish
#   bash scripts/hub-daily.sh finish ["<words>"] # the check, the commit, the push if allowed, the tidying, the report
#   bash scripts/hub-daily.sh abort              # the tidying alone: nothing is kept
#
# It never writes in the owner's checkout, never touches master, and pushes one
# branch only: hub/daily, and only when _plan/hub.json says the owner allows it.
#
# What the run builds on is GitHub's master as last fetched (origin/master): every
# merged pull request reaches it, while the local master moves only when someone
# pulls it, and a plan read from a stale master misses the calls asked since.
# Without a remote, the local master.
#
# Whatever branch the owner's checkout is on, the copy of this file that runs is
# that master's: the first thing it does is hand over to it (to the local master's
# copy while GitHub's predates the hand-over). So the run does not change with the
# owner's work in progress, and a fix on master is the fix that runs.
# (The plan's tools run from the worktree, which is master's too; the worktree's
# setup, prototype-setup.sh, is the checkout's, and writes only what git ignores.)
#
# Exit codes: 0 done · 1 a check refused, nothing was kept · 2 usage, or not ready

set -uo pipefail

GIT=git; [ -x /usr/bin/git ] && GIT=/usr/bin/git   # the one on this Mac's PATH is too old for worktrees
REPO="$(cd "$("$GIT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/.." 2>/dev/null && pwd)"
[ -n "${REPO:-}" ] && [ -d "$REPO/_plan" ] || { echo "Run this from the repository." >&2; exit 2; }
WT="$REPO/.claude/worktrees/hub-daily"
BEFORE="$REPO/.claude/worktrees/hub-daily.before"
PROGRESS="$REPO/.claude/worktrees/hub-daily.progress"   # the step the run is on, so one that dies says where
RUNS="$REPO/.claude/worktrees/hub-runs.log"          # one line a run, for the day brief: start, end, what was kept, the push
BRANCH=hub/daily
BASE=master; "$GIT" -C "$REPO" rev-parse --verify --quiet refs/remotes/origin/master >/dev/null && BASE=origin/master

# Nothing the run asks of the network may hang it (4 October: a fetch at 08:00, just after the Mac
# woke, never answered, and the run was stopped forty minutes later having done nothing). A call to
# GitHub never prompts, gives up on a stalled transfer, and is cut off after its limit.
export GIT_TERMINAL_PROMPT=0
NET=(-c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20)
limit() {   # limit <seconds> <command…>: the command's own exit, or 124 when cut off
  # Watched, not raced with a sleeper: a sleeping watcher would hold the caller for its whole limit.
  local tenths=$(( $1 * 10 )) waited=0; shift
  "$@" & local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$tenths" ]; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 124; fi
    sleep 0.2; waited=$(( waited + 2 ))
  done
  wait "$pid"
}

if [ -z "${HUB_DAILY_FROM_MASTER:-}" ]; then
  mkdir -p "$REPO/.claude/worktrees"
  # A day starts from what GitHub holds now, so begin and finish run the same copy.
  [ "${1:-}" = begin ] && limit 30 "$GIT" -C "$REPO" "${NET[@]}" fetch -q --prune origin 2>/dev/null
  run="$REPO/.claude/worktrees/hub-daily.run.$$.sh"
  for src in "$BASE" master; do
    # Written beside, then moved into place: a copy still being read by an earlier call is not rewritten under it.
    if "$GIT" -C "$REPO" show "$src:scripts/hub-daily.sh" > "$run" 2>/dev/null && grep -q HUB_DAILY_FROM_MASTER "$run" \
       && mv -f "$run" "$REPO/.claude/worktrees/hub-daily.run.sh"; then
      HUB_DAILY_FROM_MASTER=1 exec bash "$REPO/.claude/worktrees/hub-daily.run.sh" "$@"
    fi
  done
  rm -f "$run"
fi
unset HUB_DAILY_FROM_MASTER   # for this call only: the gate's own tests run this script too, and must hand over themselves

# The owner's checkout as it stands: where master points, and what is uncommitted.
snapshot() { "$GIT" -C "$REPO" rev-parse master; "$GIT" -C "$REPO" status --porcelain; }
tidy() {
  "$GIT" -C "$REPO" worktree remove --force "$WT" 2>/dev/null
  "$GIT" -C "$REPO" worktree prune 2>/dev/null
  rm -f "$BEFORE" "$REPO/.claude/worktrees/hub-daily.txt" "$REPO/.claude/worktrees/hub-daily.gate" "$REPO/.claude/worktrees/hub-daily.started" "$PROGRESS"
  return 0
}
# What the worktree holds that is not committed yet, as a line: the commit's own words.
summarise() {
  local q d i f out=""
  q="$("$GIT" -C "$WT" diff -U0 -- _plan/QUEUE.md | sed -n 's/^+- [0-9-]* · \(Q[0-9]*\) · .*/\1/p' | tr '\n' ' ' | sed 's/ $//')"
  d="$("$GIT" -C "$WT" diff -U0 -- _plan/ideas | awk '/^\+\+\+ b\/_plan\/ideas\//{split($0,a,"/"); split(a[4],b,"-"); id=b[1]} /^\+\*\*The owner:\*\* /{printf "%s %s, ", id, $3}' | sed 's/, $//')"
  i="$("$GIT" -C "$WT" status --porcelain -- _plan/ideas | sed -n 's/^?? _plan\/ideas\/\(I[0-9]*\)-.*/\1/p' | tr '\n' ' ' | sed 's/ $//')"
  f="$("$GIT" -C "$WT" diff -U0 -- _plan/findings/inbox.md | sed -n 's/^+- [0-9-]* · \(F[0-9]*\) · .*/\1/p' | tr '\n' ' ' | sed 's/ $//')"
  [ -n "$q" ] && out="$out; $q answered"
  [ -n "$d" ] && out="$out; decided: $d"
  [ -n "$i" ] && out="$out; $i filed as raw ideas"
  [ -n "$f" ] && out="$out; $f filed"
  printf '%s' "${out#; }"
}
phase() { printf '%s %s\n' "$(date -u +%H:%M:%SZ)" "$1" >> "$PROGRESS"; }
logrun() { printf '%s\t%s\t%s\t%s\n' "$(cat "$REPO/.claude/worktrees/hub-daily.started" 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" >> "$RUNS"; }
in_wt() { [ -d "$WT/_plan" ] || { echo "No worktree: run 'bash scripts/hub-daily.sh begin' first." >&2; exit 2; }; }

case "${1:-}" in
  begin)
    "$GIT" -C "$REPO" show "$BASE:scripts/hub-daily.sh" >/dev/null 2>&1 || { echo "STOP: the hub's daily tools are not on $BASE yet." >&2; exit 2; }
    mkdir -p "$REPO/.claude/worktrees"
    # A run that died left its start behind: say so in the log before the tidying forgets it.
    [ -f "$REPO/.claude/worktrees/hub-daily.started" ] && logrun "DIED: the run before this one never finished (last step: $(tail -1 "$PROGRESS" 2>/dev/null || echo unknown))" ""
    tidy                                   # whatever a run that died left behind
    snapshot > "$BEFORE"
    date -u +%Y-%m-%dT%H:%M:%SZ > "$REPO/.claude/worktrees/hub-daily.started"
    phase "fetch"
    # --prune: a branch deleted on GitHub is forgotten here too.
    limit 60 "$GIT" -C "$REPO" "${NET[@]}" fetch -q --prune origin 2>/dev/null || echo "Note: GitHub did not answer within a minute; the run works from what was fetched before."
    phase "worktree"
    "$GIT" -C "$REPO" show-ref --verify --quiet "refs/heads/$BRANCH" || "$GIT" -C "$REPO" branch --no-track "$BRANCH" "$BASE"
    # The run's own commits: on the branch, on neither master (an older one may have been merged in),
    # and not already on GitHub's by patch (a session took them and its pull request was merged).
    was="$("$GIT" -C "$REPO" rev-parse "$BRANCH")"
    own="$("$GIT" -C "$REPO" rev-list --reverse --no-merges --right-only --cherry-pick "$BASE...$BRANCH" ^master)"
    "$GIT" -C "$REPO" worktree add "$WT" "$BRANCH" >/dev/null 2>&1 || { echo "STOP: could not make the worktree at $WT." >&2; logrun "STOP: no worktree" ""; tidy; exit 2; }
    phase "setup"
    limit 120 bash "$REPO/scripts/prototype-setup.sh" "$WT" >/dev/null 2>&1 || echo "Note: the worktree has no fetched data (prototype-setup.sh); the gate will skip what needs it."
    id=(-c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}")
    restore() { "$GIT" -C "$WT" cherry-pick --abort 2>/dev/null; "$GIT" -C "$WT" checkout -q --no-track -B "$BRANCH" "$was"; echo "STOP: $1 That is the owner's to settle." >&2; logrun "STOP: $1" ""; tidy; exit 1; }
    # A branch that will not take GitHub's master, or that then holds more than the plan (a local
    # master merged in on an earlier day, with work GitHub has not seen), starts again from $BASE
    # with the run's own commits on top. If those do not go on cleanly, nothing changes and the run stops.
    merged=1
    if ! "$GIT" "${id[@]}" -C "$WT" merge --no-edit "$BASE" >/dev/null 2>&1; then "$GIT" -C "$WT" merge --abort 2>/dev/null; merged=0; fi
    if [ "$merged" = 0 ] || ! (cd "$WT" && node scripts/plan.mjs only-plan "$BASE" >/dev/null 2>&1); then
      "$GIT" -C "$WT" checkout -q --no-track -B "$BRANCH" "$BASE"
      for c in $own; do
        "$GIT" "${id[@]}" -C "$WT" cherry-pick "$c" >/dev/null 2>&1 && continue
        # Nothing left of it once on GitHub's (the same lines got there another way): pass over it.
        if "$GIT" -C "$WT" diff --quiet && "$GIT" -C "$WT" diff --cached --quiet && [ -z "$("$GIT" -C "$WT" ls-files -u)" ]; then
          "$GIT" -C "$WT" cherry-pick --skip >/dev/null 2>&1 && continue
        fi
        restore "$BRANCH could not take $BASE, and its own commits do not go onto it cleanly."
      done
      (cd "$WT" && node scripts/plan.mjs only-plan "$BASE" >/dev/null 2>&1) || restore "$BRANCH's own commits hold more than the plan."
      echo "Note: $BRANCH could not go on as it was (an older master merged in); it starts again from $BASE with its own $(printf '%s' "$own" | grep -c .) commit(s)."
    fi
    # Everything the branch held has reached GitHub (a session took it, and its pull request was
    # merged): it starts again from there, so nothing already merged is counted as the run's own.
    if "$GIT" -C "$WT" diff --quiet "$BASE" HEAD && [ "$("$GIT" -C "$WT" rev-parse HEAD)" != "$("$GIT" -C "$WT" rev-parse "$BASE")" ]; then
      "$GIT" -C "$WT" checkout -q --no-track -B "$BRANCH" "$BASE"
    fi
    echo "Worktree: $WT (branch $BRANCH, $BASE merged in)"
    echo "── The plan, against $BASE"
    (cd "$WT" && node scripts/check-plan.mjs --since "$BASE" 2>&1 | tail -6)
    echo "── The gate"
    phase "gate"
    (cd "$WT" && { limit 900 bash scripts/gate.sh > "$REPO/.claude/worktrees/hub-daily.gate" 2>&1 || [ $? != 124 ] || echo "GATE: cut off after fifteen minutes" >> "$REPO/.claude/worktrees/hub-daily.gate"; }; grep -E "^(✗|✖)" "$REPO/.claude/worktrees/hub-daily.gate" | head -12; tail -1 "$REPO/.claude/worktrees/hub-daily.gate")
    echo "── Next, each as written and nothing else"
    url="$(cd "$WT" && node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync("_plan/hub.json","utf8")).url||""))}catch(e){}')"
    echo "1. ArtifactData, action list, url ${url:-(none in _plan/hub.json: skip to 3)}, out_dir <your scratchpad directory>/hub-store: once for collection answers, once for collection ideas"
    echo "2. bash scripts/hub-daily.sh plan sync <your scratchpad directory>/hub-store"
    echo "3. bash scripts/hub-daily.sh plan debt"
    echo "4. bash scripts/hub-daily.sh brief"
    echo "5. bash scripts/hub-daily.sh finish \"daily upkeep\""
    echo "6. Only then, with the Artifact tool: read the address the brief printed, and publish its file there"
    ;;

  plan)  in_wt; shift; cd "$WT" && node scripts/plan.mjs "$@" ;;
  check) in_wt; cd "$WT" && node scripts/check-plan.mjs ;;
  page)  in_wt; cd "$WT" && node scripts/hub-page.mjs && echo "Publish: $WT/design/hub/hub.html" ;;
  brief)
    in_wt
    (cd "$WT" && node scripts/hub-brief.mjs --day "${2:-yesterday}" --ref "$BASE" --runs "$RUNS" --out "$REPO/.claude/worktrees/hub-brief.html") || exit 1
    url="$(cd "$WT" && node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync("_plan/hub.json","utf8")).brief||""))}catch(e){}')"
    echo "At: ${url:-(no brief address in _plan/hub.json: do not publish)}"
    ;;

  finish)
    in_wt
    given="$(printf '%s' "${2:-}" | tr '\n\r\t' '   ' | sed 's/  */ /g; s/^ //; s/ $//')"
    # The owner works while the run does. The run writes only in its own worktree, so a change in
    # the owner's checkout is taken for the owner's and said, not judged: nothing is thrown away for it.
    if [ -f "$BEFORE" ] && ! snapshot | diff "$BEFORE" - >/dev/null; then
      echo "Note: the owner's checkout changed while the run worked ($(snapshot | diff "$BEFORE" - | grep -c '^[<>]') line(s) of its state). The run writes only in its own worktree."
    fi
    # The branch holds nothing but the plan.
    if ! (cd "$WT" && node scripts/plan.mjs only-plan "$BASE"); then logrun "REFUSED: the branch held more than the plan" ""; tidy; exit 1; fi
    kept="nothing new"
    if [ -z "$("$GIT" -C "$WT" status --porcelain)" ]; then
      echo "Nothing to record today: no commit."
    else
      summary="$(summarise)"; [ -n "$summary" ] || summary="${given:-the plan, kept}"
      "$GIT" -C "$WT" add -A _plan
      "$GIT" -C "$WT" -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" \
        commit -q -m "📐 Daily upkeep: $summary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || { echo "REFUSED: the commit failed. Nothing is kept." >&2; logrun "REFUSED: the commit failed" ""; tidy; exit 1; }
      if ! (cd "$WT" && node scripts/plan.mjs only-plan "$BASE" >/dev/null); then echo "REFUSED after the commit: the branch holds more than the plan." >&2; logrun "REFUSED: the branch held more than the plan" ""; tidy; exit 1; fi
      echo "Committed on $BRANCH: $("$GIT" -C "$WT" log --oneline -1)"
      kept="$summary"
    fi
    ahead="$("$GIT" -C "$REPO" rev-list --count --no-merges "$BASE..$BRANCH")"
    # The one push. Never master.
    may="$(cd "$WT" && node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync("_plan/hub.json","utf8")).daily_may_push===true))}catch(e){process.stdout.write("false")}')"
    here="$("$GIT" -C "$REPO" rev-parse "$BRANCH")"; there="$("$GIT" -C "$REPO" rev-parse --verify --quiet "refs/remotes/origin/$BRANCH" || true)"
    phase "push"
    push_it() { limit 120 "$GIT" -C "$WT" "${NET[@]}" -c http.postBuffer=524288000 push "$@" origin "$BRANCH:refs/heads/$BRANCH" >/dev/null 2>&1; }
    # What GitHub's copy of the branch holds that this one does not, by patch: someone else's work.
    theirs() { "$GIT" -C "$REPO" rev-list --no-merges --right-only --cherry-pick "$here...$there"; }
    if [ "$here" = "$there" ] || { [ -z "$there" ] && [ "$ahead" = "0" ]; }; then push="nothing new to push."
    elif [ "$may" != "true" ]; then push="left local. The owner's switch (daily_may_push) is off."
    elif [ "$BASE" != "origin/master" ]; then push="left local. There is no GitHub master to build on."
    elif [ -z "$there" ] || "$GIT" -C "$REPO" merge-base --is-ancestor "$there" "$here"; then
      if push_it; then push="$BRANCH pushed."; else push="failed; the branch is local."; fi
    # Started again from GitHub's master (on this run or an earlier one): it replaces GitHub's copy,
    # but only when everything that copy holds is here already, and with a lease on it as fetched.
    elif [ -z "$(theirs)" ]; then
      if push_it --force-with-lease="refs/heads/$BRANCH:$there"; then push="$BRANCH pushed (started again from $BASE)."; else push="failed; the branch is local."; fi
    else push="left local. GitHub's $BRANCH holds commits this run does not have; they are not overwritten."; fi
    echo "Push: $push"
    logrun "$kept" "$push"
    # The report, whole: the run's last words are these lines.
    echo "── Report"
    [ -f "$REPO/.claude/worktrees/hub-daily.gate" ] && echo "Gate on $BASE: $(tail -1 "$REPO/.claude/worktrees/hub-daily.gate")"
    echo "Plan: $(cd "$WT" && node scripts/check-plan.mjs 2>&1 | tail -1)"
    echo "Kept today: $kept."
    echo "Waiting: $(cd "$WT" && node scripts/check-plan.mjs --brief 2>/dev/null | grep -E "^(Owner's queue|Findings inbox|Ideas):" | sed 's/ →.*//' | tr '\n' ' ')"
    echo "$BRANCH holds $ahead commit(s) that $BASE does not. Push: $push"
    tidy
    echo "Tidied: the worktree is gone; the branch stays."
    ;;

  abort) [ -f "$REPO/.claude/worktrees/hub-daily.started" ] && logrun "STOP: aborted, nothing kept" ""; tidy; echo "Tidied. Nothing was kept." ;;

  *) sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
