# Security notes

## Slide preview server

The preview server binds to `127.0.0.1`, accepts only loopback Host headers,
and resolves every requested file before checking that it remains inside the
deck directory. Traversal and symlinks cannot expose neighboring files.
Malformed URL escapes return an error without stopping the server.

CodeQL `js/path-injection` alerts 3 and 4 identified a real issue in both
distributed copies of the preview server. The HTTP regression suite covers
normal assets, traversal, sibling directories, symlinks, Host headers and
malformed encoding. Both distributed copies must remain identical.

## Template imports

CodeQL `js/http-to-file-access` alerts 5, 6 and 7 describe intentional downloads
by `web/scripts/fetch-templates.mjs`. This operator-run importer vendors HTML,
the shared runtime and metadata from the exact upstream commit named by `REF`.
It writes under fixed public asset directories and validates template slugs
before any existing templates are changed. Downloaded content is not executed
by the Node importer. The HTML and JavaScript are intentionally rendered by the
gallery, so the selected upstream source remains a trust dependency.

Changing `TEMPLATES_REF` changes that trust decision. Review the new upstream
snapshot before importing it. The importer refuses to overwrite owned templates
without the existing explicit `--force` option.

Workflow token permissions default to read-only repository contents.
