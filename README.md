# Nanbi's Studio

Nanbi's front end — a generic web shell — **no data, no secrets in this repository, ever.**

Everything shown is fetched at runtime from a private repository via the GitHub API,
after the owner signs in with their own fine-grained token. The token stays in the
browser's localStorage on that device, is sent only to api.github.com, and is never
written into any file.

Served by GitHub Pages from `main`. The app is one self-contained `index.html` —
no build step, no dependencies, works over `file://` as well.
