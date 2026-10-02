#!/usr/bin/env bash
# The daily run's hands (.claude/commands/hub-daily.md).
#
# Everything about the run that needs no judgement is here, so an unattended agent
# runs a handful of commands and not dozens: a place of its own to work in, the two
# checks before anything is kept, the commit, the one push it may make, and the
# tidying up. The agent's part is what is left: reading the owner's answers from
# the command centre, recording them, and filing what it notices.
#
#   bash scripts/hub-daily.sh begin              # a worktree on hub/daily, master merged in, the checks run
#   bash scripts/hub-daily.sh plan <args…>       # node scripts/plan.mjs <args…>, inside the worktree:
#                                                #   plan sync <folder>   record what the page's store holds
#                                                #   plan debt            files nothing loads, not yet in the inbox
#                                                #   plan finding "<where>" "<what>" --by daily
#   bash scripts/hub-daily.sh check              # the plan check, inside the worktree
#   bash scripts/hub-daily.sh page               # build the command centre there; prints the file to publish
#   bash scripts/hub-daily.sh finish ["<words>"] # the check, the commit, the push if allowed, the tidying, the report
#   bash scripts/hub-daily.sh abort              # the tidying alone: nothing is kept
#
# It never writes in the owner's checkout, never touches master, and pushes one
# branch only: hub/daily, and only when _plan/hub.json says the owner allows it
# and master holds nothing GitHub has not seen.
#
# Whatever branch the owner's checkout is on, the copy of this file that runs is
# master's: the first thing it does is hand over to it. So the run does not change
# with the owner's work in progress, and a fix on master is the fix that runs.
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
BRANCH=hub/daily

if [ -z "${HUB_DAILY_FROM_MASTER:-}" ]; then
  mkdir -p "$REPO/.claude/worktrees"
  # Written beside, then moved into place: a copy still being read by an earlier call is not rewritten under it.
  if "$GIT" -C "$REPO" show master:scripts/hub-daily.sh > "$REPO/.claude/worktrees/hub-daily.run.$$.sh" 2>/dev/null \
     && mv -f "$REPO/.claude/worktrees/hub-daily.run.$$.sh" "$REPO/.claude/worktrees/hub-daily.run.sh"; then
    HUB_DAILY_FROM_MASTER=1 exec bash "$REPO/.claude/worktrees/hub-daily.run.sh" "$@"
  fi
  rm -f "$REPO/.claude/worktrees/hub-daily.run.$$.sh"
fi
unset HUB_DAILY_FROM_MASTER   # for this call only: the gate's own tests run this script too, and must hand over themselves

# The owner's checkout as it stands: where master points, and what is uncommitted.
snapshot() { "$GIT" -C "$REPO" rev-parse master; "$GIT" -C "$REPO" status --porcelain; }
tidy() {
  "$GIT" -C "$REPO" worktree remove --force "$WT" 2>/dev/null
  "$GIT" -C "$REPO" worktree prune 2>/dev/null
  rm -f "$BEFORE" "$REPO/.claude/worktrees/hub-daily.txt" "$REPO/.claude/worktrees/hub-daily.gate"
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
in_wt() { [ -d "$WT/_plan" ] || { echo "No worktree: run 'bash scripts/hub-daily.sh begin' first." >&2; exit 2; }; }

case "${1:-}" in
  begin)
    "$GIT" -C "$REPO" show master:scripts/hub-daily.sh >/dev/null 2>&1 || { echo "STOP: the hub's daily tools are not on master yet." >&2; exit 2; }
    mkdir -p "$REPO/.claude/worktrees"
    tidy                                   # whatever a run that died left behind
    snapshot > "$BEFORE"
    "$GIT" -C "$REPO" fetch origin 2>&1 | tail -1
    "$GIT" -C "$REPO" show-ref --verify --quiet "refs/heads/$BRANCH" || "$GIT" -C "$REPO" branch "$BRANCH" master
    "$GIT" -C "$REPO" worktree add "$WT" "$BRANCH" >/dev/null 2>&1 || { echo "STOP: could not make the worktree at $WT." >&2; tidy; exit 2; }
    bash "$REPO/scripts/prototype-setup.sh" "$WT" >/dev/null 2>&1 || echo "Note: the worktree has no fetched data (prototype-setup.sh); the gate will skip what needs it."
    if ! "$GIT" -C "$WT" -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" merge --no-edit master >/dev/null 2>&1; then
      "$GIT" -C "$WT" merge --abort 2>/dev/null
      echo "STOP: master and $BRANCH have met in one file. That is the owner's to settle: merge or re-record what $BRANCH holds, then delete the branch; the next run starts a new one." >&2
      tidy; exit 1
    fi
    echo "Worktree: $WT (branch $BRANCH, master merged in)"
    echo "── The plan, against origin/master"
    (cd "$WT" && node scripts/check-plan.mjs --since origin/master 2>&1 | tail -6)
    echo "── The gate"
    (cd "$WT" && bash scripts/gate.sh > "$REPO/.claude/worktrees/hub-daily.gate" 2>&1; grep -E "^(✗|✖)" "$REPO/.claude/worktrees/hub-daily.gate" | head -12; tail -1 "$REPO/.claude/worktrees/hub-daily.gate")
    echo "── Next, each as written and nothing else"
    url="$(cd "$WT" && node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync("_plan/hub.json","utf8")).url||""))}catch(e){}')"
    echo "1. ArtifactData, action list, url ${url:-(none in _plan/hub.json: skip to 3)}, out_dir <your scratchpad directory>/hub-store: once for collection answers, once for collection ideas"
    echo "2. bash scripts/hub-daily.sh plan sync <your scratchpad directory>/hub-store"
    echo "3. bash scripts/hub-daily.sh plan debt"
    echo "4. bash scripts/hub-daily.sh finish \"daily upkeep\""
    ;;

  plan)  in_wt; shift; cd "$WT" && node scripts/plan.mjs "$@" ;;
  check) in_wt; cd "$WT" && node scripts/check-plan.mjs ;;
  page)  in_wt; cd "$WT" && node scripts/hub-page.mjs && echo "Publish: $WT/design/hub/hub.html" ;;

  finish)
    in_wt
    given="$(printf '%s' "${2:-}" | tr '\n\r\t' '   ' | sed 's/  */ /g; s/^ //; s/ $//')"
    # The owner works while the run does. The run writes only in its own worktree, so a change in
    # the owner's checkout is taken for the owner's and said, not judged: nothing is thrown away for it.
    if [ -f "$BEFORE" ] && ! snapshot | diff "$BEFORE" - >/dev/null; then
      echo "Note: the owner's checkout changed while the run worked ($(snapshot | diff "$BEFORE" - | grep -c '^[<>]') line(s) of its state). The run writes only in its own worktree."
    fi
    # The branch holds nothing but the plan.
    if ! (cd "$WT" && node scripts/plan.mjs only-plan master); then tidy; exit 1; fi
    kept="nothing new"
    if [ -z "$("$GIT" -C "$WT" status --porcelain)" ]; then
      echo "Nothing to record today: no commit."
    else
      summary="$(summarise)"; [ -n "$summary" ] || summary="${given:-the plan, kept}"
      "$GIT" -C "$WT" add -A _plan
      "$GIT" -C "$WT" -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" \
        commit -q -m "📐 Daily upkeep: $summary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || { echo "REFUSED: the commit failed. Nothing is kept." >&2; tidy; exit 1; }
      if ! (cd "$WT" && node scripts/plan.mjs only-plan master >/dev/null); then echo "REFUSED after the commit: the branch holds more than the plan." >&2; tidy; exit 1; fi
      echo "Committed on $BRANCH: $("$GIT" -C "$WT" log --oneline -1)"
      kept="$summary"
    fi
    ahead="$("$GIT" -C "$REPO" rev-list --count "master..$BRANCH")"
    # The one push. Never master.
    may="$(cd "$WT" && node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync("_plan/hub.json","utf8")).daily_may_push===true))}catch(e){process.stdout.write("false")}')"
    unpushed="$("$GIT" -C "$REPO" rev-list --count origin/master..master 2>/dev/null || echo 1)"
    here="$("$GIT" -C "$REPO" rev-parse "$BRANCH")"; there="$("$GIT" -C "$REPO" rev-parse --verify --quiet "refs/remotes/origin/$BRANCH" || true)"
    if [ "$ahead" = "0" ] || [ "$here" = "$there" ]; then push="nothing new to push."
    elif [ "$may" != "true" ]; then push="left local. The owner's switch (daily_may_push) is off."
    elif [ "$unpushed" != "0" ]; then push="left local. master holds $unpushed commit(s) GitHub has not seen, and the branch would carry them."
    elif "$GIT" -C "$WT" -c http.postBuffer=524288000 push origin "$BRANCH:refs/heads/$BRANCH" >/dev/null 2>&1; then push="$BRANCH pushed."
    else push="failed; the branch is local."; fi
    echo "Push: $push"
    # The report, whole: the run's last words are these lines.
    echo "── Report"
    [ -f "$REPO/.claude/worktrees/hub-daily.gate" ] && echo "Gate on master: $(tail -1 "$REPO/.claude/worktrees/hub-daily.gate")"
    echo "Plan: $(cd "$WT" && node scripts/check-plan.mjs 2>&1 | tail -1)"
    echo "Kept today: $kept."
    echo "Waiting: $(cd "$WT" && node scripts/check-plan.mjs --brief 2>/dev/null | grep -E "^(Owner's queue|Findings inbox|Ideas):" | sed 's/ →.*//' | tr '\n' ' ')"
    echo "$BRANCH holds $ahead commit(s) that master does not. Push: $push"
    tidy
    echo "Tidied: the worktree is gone; the branch stays."
    ;;

  abort) tidy; echo "Tidied. Nothing was kept." ;;

  *) sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
