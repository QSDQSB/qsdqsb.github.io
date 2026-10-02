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
#   bash scripts/hub-daily.sh plan <args…>       # node scripts/plan.mjs <args…>, inside the worktree
#   bash scripts/hub-daily.sh check              # the plan check, inside the worktree
#   bash scripts/hub-daily.sh page               # build the command centre there; prints the file to publish
#   bash scripts/hub-daily.sh finish "<summary>" # the two checks, the commit, the push if allowed, the tidying
#   bash scripts/hub-daily.sh abort              # the tidying alone: nothing is kept
#
# It never writes in the owner's checkout, never touches master, and pushes one
# branch only: hub/daily, and only when _plan/hub.json says the owner allows it
# and master holds nothing GitHub has not seen.
#
# Exit codes: 0 done · 1 a check refused, nothing was kept · 2 usage, or not ready

set -uo pipefail

GIT=git; [ -x /usr/bin/git ] && GIT=/usr/bin/git   # the one on this Mac's PATH is too old for worktrees
REPO="$(cd "$("$GIT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/.." 2>/dev/null && pwd)"
[ -n "${REPO:-}" ] && [ -d "$REPO/_plan" ] || { echo "Run this from the repository." >&2; exit 2; }
WT="$REPO/.claude/worktrees/hub-daily"
BEFORE="$REPO/.claude/worktrees/hub-daily.before"
BRANCH=hub/daily

# The owner's checkout as it stands: where master points, and what is uncommitted.
snapshot() { "$GIT" -C "$REPO" rev-parse master; "$GIT" -C "$REPO" status --porcelain; }
tidy() {
  "$GIT" -C "$REPO" worktree remove --force "$WT" 2>/dev/null
  "$GIT" -C "$REPO" worktree prune 2>/dev/null
  rm -f "$BEFORE" "$REPO/.claude/worktrees/hub-daily.txt" "$REPO/.claude/worktrees/hub-daily.gate"
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
    echo "Next: record with 'bash scripts/hub-daily.sh plan …'; end with 'bash scripts/hub-daily.sh finish \"<what was recorded>\"'."
    ;;

  plan)  in_wt; shift; cd "$WT" && node scripts/plan.mjs "$@" ;;
  check) in_wt; cd "$WT" && node scripts/check-plan.mjs ;;
  page)  in_wt; cd "$WT" && node scripts/hub-page.mjs && echo "Publish: $WT/design/hub/hub.html" ;;

  finish)
    in_wt
    summary="$(printf '%s' "${2:-}" | tr '\n\r\t' '   ' | sed 's/  */ /g; s/^ //; s/ $//')"; [ -n "$summary" ] || { echo "finish needs a line saying what was recorded." >&2; exit 2; }
    [ -f "$BEFORE" ] || { echo "No record of the owner's checkout from the start of the run: nothing is kept." >&2; tidy; exit 1; }
    # 1. The owner's checkout and its master are as they were: nothing wrote or committed in the wrong place.
    if ! snapshot | diff - "$BEFORE" >/dev/null; then
      echo "REFUSED: the owner's checkout or its master changed while the run worked. Nothing is kept." >&2
      snapshot | diff - "$BEFORE" >&2
      tidy; exit 1
    fi
    # 2. The branch holds nothing but the plan.
    if ! (cd "$WT" && node scripts/plan.mjs only-plan master); then tidy; exit 1; fi
    if [ -z "$("$GIT" -C "$WT" status --porcelain)" ]; then
      echo "Nothing to record today: no commit."
    else
      "$GIT" -C "$WT" add -A _plan
      "$GIT" -C "$WT" -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" \
        commit -q -m "📐 Daily upkeep: $summary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || { echo "REFUSED: the commit failed. Nothing is kept." >&2; tidy; exit 1; }
      if ! (cd "$WT" && node scripts/plan.mjs only-plan master >/dev/null); then echo "REFUSED after the commit: the branch holds more than the plan." >&2; tidy; exit 1; fi
      echo "Committed on $BRANCH: $("$GIT" -C "$WT" log --oneline -1)"
    fi
    ahead="$("$GIT" -C "$REPO" rev-list --count "master..$BRANCH")"
    echo "$BRANCH holds $ahead commit(s) that master does not."
    # The one push. Never master.
    may="$(cd "$WT" && node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync("_plan/hub.json","utf8")).daily_may_push===true))}catch(e){process.stdout.write("false")}')"
    unpushed="$("$GIT" -C "$REPO" rev-list --count origin/master..master 2>/dev/null || echo 1)"
    here="$("$GIT" -C "$REPO" rev-parse "$BRANCH")"; there="$("$GIT" -C "$REPO" rev-parse --verify --quiet "refs/remotes/origin/$BRANCH" || true)"
    if [ "$ahead" = "0" ] || [ "$here" = "$there" ]; then echo "Push: nothing new to push."
    elif [ "$may" != "true" ]; then echo "Push: left local. The owner's switch (daily_may_push) is off."
    elif [ "$unpushed" != "0" ]; then echo "Push: left local. master holds $unpushed commit(s) GitHub has not seen, and the branch would carry them."
    elif "$GIT" -C "$WT" -c http.postBuffer=524288000 push origin "$BRANCH:refs/heads/$BRANCH" 2>&1 | tail -1; then echo "Push: $BRANCH pushed."
    else echo "Push: failed; the branch is local."; fi
    tidy
    echo "Tidied: the worktree is gone; the branch stays."
    ;;

  abort) tidy; echo "Tidied. Nothing was kept." ;;

  *) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
