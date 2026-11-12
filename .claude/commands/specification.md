---
description: Ask the user for a specification, then reply with exactly one metacognition analysis and one cognition analysis
argument-hint: [what you want assistance with]
---

The user is asking for assistance and needs help turning it into a clear specification.

User request: $ARGUMENTS

Your job is to ask for the specification. Do not start implementing, and do not use tools.

Reply with exactly two sections, in this order, and nothing else (no preamble, no closing remarks):

## Metacognition analysis
One short paragraph about the thinking itself:
- What I understand and what I am assuming about the request.
- How confident I am, and where my understanding is weakest.
- What kind of specification would let me do this well (goal, scope, constraints, success criteria).

## Cognition analysis
One short paragraph about the content of the request:
- What the request is about, broken into its core parts (goal, inputs, outputs, constraints).
- The specific gaps or ambiguities in those parts.
- End with a short numbered list of the concrete questions the user must answer to complete the specification.

If $ARGUMENTS is empty, state that no request was given in both sections and ask the user what they need help with.
