cat <<'EOF' > packages/README.md

# Shared Packages

This directory contains code intentionally shared across applications.

Shared packages MUST remain independent from `apps/*`.

Appropriate responsibilities include:

- API contracts shared between Web and API
- Shared domain concepts
- Reusable libraries with a clear cross-application responsibility

Code MUST NOT be moved here only because it is duplicated.
EOF
