# Review guide

This rubric is visible to candidates. Review actual evidence and explanations rather than volume of code, school, background, or choice of AI tool. Do not require overtime to finish the timebox.

| Area | What to look for |
| --- | --- |
| Correctness | Date and overlap rules; one valid lifecycle transition; consistent history |
| Backend boundaries | Identity from the demo context; ownership and assigned-manager checks; private drafts |
| Persistence | Durable records and evidence from restarts/reopening; documented schema changes |
| Engineering judgment | Small design, sensible tradeoffs, useful errors, clear scope calls |
| Architecture | Component and sequence Mermaid diagrams agree with the implementation; clear boundaries, data relationships, conflict path, and code map |
| Verification | Tests or reproducible evidence for risky cases; honest limitations |
| AI collaboration | Useful context, iterative prompts, checked output, understanding of the final code |

Mark each area as demonstrated, partially demonstrated, or not yet demonstrated and cite specific evidence. Unfinished work should guide discussion, not an automatic conclusion about the candidate.

## 30-minute walkthrough

- 5 minutes: candidate demonstrates employee submission and manager review.
- 10 minutes: use the candidate's Mermaid diagrams to follow one request from UI through backend to storage; discuss overlaps, conflicting actions, and one tradeoff. Check that the diagrams match the code.
- 10 minutes: review one productive AI exchange and one correction or verification step.
- 5 minutes: discuss limitations and what would change for multiple companies or production authentication.

Useful questions: Where is identity established? What happens if approve and withdraw arrive together? What if two overlapping requests are submitted together? What evidence supports your answer? Which AI suggestion did you change or check most carefully?

No planted bugs, hidden requirements, or mandatory production deployment. Use a fresh private candidate copy each time; keep submissions and transcripts separate from this starter.
