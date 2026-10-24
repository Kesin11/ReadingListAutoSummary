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
2. Check existing related PRs/tasks. Reuse the existing PR where appropriate;
   report ownership conflicts rather than pushing over another task.
3. Implement only the assigned fix, add regression tests, and update directly
   related documentation. Use pnpm. Do not mock console methods.
4. Run targeted tests and `pnpm check:ai` before committing. That command may
   format files: inspect the final diff and exclude unrelated formatting.
   Install dependencies only after a missing-tool failure or manifest changes.
5. For dependencies major updates, run only the lightweight extension smoke
   test from SKILL.md. Use a dedicated profile and dummy settings. Never invoke
   real Reading List processing, Slack, LLM or Tavily services.
6. Commit in English with:
   `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
   Push and create a Japanese PR title/body with a task-key marker:
   `<!-- repository-maintenance: TASK-KEY -->`.
   Prefer gh CLI; use `gh api --method GET` for reads.
7. Do not merge, release, tag, publish, expand permissions, start child workers,
   delete worktrees, or operate on other workers' branches/processes.
8. Stop task-owned browsers, servers and watchers. Release terminal cwd where
   possible. Do not claim process cleanup if a host terminal still holds cwd;
   give its exact PID and ownership evidence to the manager.

## Final report

- Task key; starting and final SHA; absolute worktree; branch.
- PR URL or reason none was created; tested PR head SHA.
- Tests run, results, regression reproduction and smoke evidence as applicable.
- Git status including untracked files; ignored generated output.
- Remote branch SHA proving the work is pushed.
- Task-owned process IDs and stopped/released status.
- Remaining risks, approval blockers and next action.
