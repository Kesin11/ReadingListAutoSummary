# Isolated maintenance worker contract

Include this contract, the relevant policy from SKILL.md, and the concrete task
in every worker prompt. The worker does not inherit the manager's conversation.

## Assignment

- Task key and canonical repository:
- Existing issue/alert/PR links:
- Scope and files or dependency family:
- Latest fetched default-branch SHA or exact PR head SHA:
- Allowed changes and explicit non-goals:
- Required validation and completion criteria:

## Execution

1. Report cwd, git root, branch and starting SHA. Stop if not isolated from the
   original checkout. Fetch and start from the assigned current baseline; for an
   existing PR, validate its exact head on your own branch.
2. Check existing related PRs/tasks. Reuse an existing agent-owned repair PR
   for the same task, never a bot-owned PR as a repair target. Keep Renovate and
   Dependabot titles, generated bodies and branches bot-owned: do not rewrite
   metadata or commit/push repairs there. Create a dedicated repair PR from a
   separate agent-owned branch referencing the source bot PR. Use a prerequisite
   fix against main when compatible, or a replacement update plus fix when the
   repair depends on the new version. Defer the source bot PR; only the manager
   may close it after the replacement update lands, never merge a stale downgrade.
   Assessing and reviewing bot PRs remains allowed; report ownership conflicts.
3. Implement only the assigned fix, add regression tests, and update directly
   related documentation. Use pnpm. Do not mock console methods.
4. Run targeted tests and `pnpm check:ai` before committing. That command may
   format files: inspect the final diff and exclude unrelated formatting.
   Install dependencies only after a missing-tool failure or manifest changes.
5. For dependencies major updates, run only the lightweight extension smoke
   test from SKILL.md. Use a dedicated profile and dummy settings. Never invoke
   real Reading List processing, Slack, LLM or Tavily services.
6. Before creating a PR, self-review the complete final diff against the intended
   base, including new files. Check correctness, regressions, edge cases, test
   coverage, unintended scope and sensitive data. Fix valid findings, rerun
   affected validation and re-review the resulting diff. Record what was checked,
   findings and their disposition, including when there were no findings.
   Do this yourself; tests and a future Copilot review do not replace it.
7. Commit in English with:
   `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
   Push and create a Japanese PR title/body with a task-key marker:
   `<!-- repository-maintenance: TASK-KEY -->`.
   Push only the agent-owned repair branch. Create PRs changing the maintenance
   skill or Automation instructions as drafts requiring owner review; they must
   not be automatically merged.
   Prefer gh CLI; use `gh api --method GET` for reads.
8. After creating the PR or pushing follow-up changes, inspect Copilot review
   requests, reviews, threads and review-related checks. If requested or running,
   wait for the response, then judge every comment on its merits. Fix valid
   findings with appropriate tests, self-review and revalidate before pushing;
   reply in the thread with the change. Reply to invalid or inapplicable comments
   with a specific reason for not changing the code. Do not accept all suggestions
   automatically or silently ignore them. Track new review requests after pushes.
   If the review is still pending when execution time runs out, report the
   request/head state and hand it back to the manager as pending, not merge-ready.
9. Do not merge, release, tag, publish, expand permissions, start child workers,
   delete worktrees, or operate on other workers' branches/processes.
   Report results via chat only. The manager alone writes shared operational
   records; do not write those records or another worktree's `.git`.
10. Stop task-owned browsers, servers and watchers. Release terminal cwd where
    possible. Do not claim process cleanup if a host terminal still holds cwd;
    give its exact PID and ownership evidence to the manager.

## Final report

- Task key; starting and final SHA; absolute worktree; branch.
- PR URL or reason none was created; tested PR head SHA.
- Tests run, results, regression reproduction and smoke evidence as applicable.
- Pre-PR self-review scope, findings and disposition.
- Copilot review requested/running/completed/not requested, reviewed SHA,
  comment-by-comment decisions and reply links, or pending-review handoff.
- Git status including untracked files; ignored generated output.
- Remote branch SHA proving the work is pushed.
- Task-owned process IDs and stopped/released status.
- Remaining risks, approval blockers and next action.
