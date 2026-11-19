<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:cross-machine-sync -->
# Cross-machine git sync (other-computer branch)

Shilo works on this repo from multiple computers. Follow this workflow automatically, without being asked:

- **Start of session:** run `git fetch origin` and `git checkout other-computer` (create it tracking `origin/other-computer` if it doesn't exist locally yet), then `git pull`, before making any changes. This picks up work pushed from another machine.
- **End of session / round of work:** commit all changes and `git push` to the branch named exactly `other-computer` on `origin`.
- Never push to `main`/`master`, and never trigger a deploy as part of this routine.
- If `git pull` or `git push` reports a conflict or non-fast-forward rejection, do not force-push or resolve it unilaterally — stop and ask Shilo.
- Don't blindly commit large untracked binaries or stray files — ask first.
<!-- END:cross-machine-sync -->
