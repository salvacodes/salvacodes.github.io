---
title: How this site is built
date: 2026-08-03
summary: A desktop in your browser, with zero runtime dependencies and a content security policy that means it.
tags: [security, web, craft]
---

This site is a simulated Kali/GNOME desktop. You open windows, drag them around, right-click
things. That is the whole interface — there is no landing page underneath it.

The interesting part is not the metaphor. It is the constraint I put on myself while building it:
**nothing ships to your browser that I did not write.**

## Zero runtime dependencies

The `dependencies` block in `package.json` is empty, and it stays empty. Everything you are
running right now is first-party code: the window manager, the terminal, the resume, this reader.

Build tools are a different question — Vite, TypeScript, Vitest and Playwright all live in
`devDependencies`, and so does the markdown parser that turned this file into the page you are
reading. None of them cross the boundary into the browser.

That is not asceticism for its own sake. A dependency you ship is a dependency someone else can
compromise on your behalf, and a personal site is the one place where I get to say no to all of it.

## A policy that actually says no

The site sends a strict Content Security Policy:

```
default-src 'none'; script-src 'self'; style-src 'self';
img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'
```

Read `connect-src 'none'` again. The page cannot make network requests at all — no `fetch`, no
XHR, no WebSocket. That rules out the obvious way to lazy-load a blog post, so posts are loaded
as JavaScript modules instead, which `script-src 'self'` does allow. The policy shaped the
architecture rather than being retrofitted onto it.

`style-src 'self'` with no `unsafe-inline` has a similar effect on syntax highlighting: the code
block above carries CSS classes and no inline styles, because inline styles would be blocked.

## Markdown that cannot bite

Posts are markdown files in the repository. At build time they are parsed, highlighted, and
checked against an allowlist of tags and attributes. Raw HTML inside a post is escaped rather than
passed through, so there is no path from a post to a script tag — not even for me.

If a post ever produced an unexpected tag, the build fails. I would rather ship nothing than ship
something I did not intend.

## Read it without JavaScript

The page you are on was rendered at build time. Turn JavaScript off and it still reads: the
article is really in the HTML, styled for reading and for printing. The desktop is an enhancement
layered on top of a document, not a prerequisite for it.

That also means search engines and link previews see the actual post, which is the entire point of
writing in public.
