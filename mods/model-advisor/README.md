# model-advisor

A Claude Code mod that suggests, for each task, which Claude model and effort
level to use and whether subagents, background subagents or a dynamic workflow
are worth it. It only suggests: it never switches the model or effort itself.

## What you see

- **On every prompt** of four words or more, a one-line suggestion:

  `Suggested: opus · high effort · subagents yes · background no · workflow no (needs design or diagnosis)`

  In a terminal, the desktop app and the mobile app it is a band above the
  prompt with a Hide button. Anywhere else (a cloud session, for one) it is a
  dim line in the transcript. This is a free keyword estimate, so it is rough.
  Short follow-ups such as "yes" keep the previous suggestion.

- **`/advise <task>`** asks a small model for a judgment before you run the
  task, and prints the recommendation with the `/model` and `/effort` commands
  that apply it. Each call spends a few tokens. When the model gives no usable
  answer it falls back to the keyword estimate and says so.

- **`/advise`** alone reprints the last suggestion and brings the band back.

## How it decides

| Suggestion | When |
| --- | --- |
| haiku, low | lookups, renames, mechanical edits |
| sonnet, medium | ordinary features, bug fixes and tests in one area |
| opus, high | multi-file design, hard debugging, refactors, security or performance work |
| fable, xhigh | open-ended or system-wide problems |
| subagents | broad reading or searching that splits into independent parts |
| background subagents | a long side job: a test suite, a build, a watch |
| dynamic workflow | the same work repeated over many files, modules or repos |

The wording rules live in `hooks/advise.ts`; edit them to taste.

## Install

At the prompt of a Claude Code session:

```
/plugin install model-advisor --marketplace mohamadrezakoohkan/cloud-session
```

From a shell:

```
claude plugin install model-advisor --marketplace mohamadrezakoohkan/cloud-session
```

## Develop

```
claude plugin validate mods/model-advisor
claude plugin test mods/model-advisor
```
