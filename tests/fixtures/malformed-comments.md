# Document with Malformed Comments

## Section One

This section has a malformed inline comment below.
<!-- @markup {INVALID JSON HERE} This comment has broken metadata -->

## Section Two

This section has a valid comment.
<!-- @markup {"id":"valid1","type":"inline","anchor":"h2:Section Two","author":"tester","ts":"2026-03-28T10:00:00Z"} This one should parse correctly. -->

## Section Three

Just a normal section with no comments.

<!-- @markup-doc-comments
{"id":"d1","type":"document","author":"tester","ts":"2026-03-28T10:01:00Z","body":"This doc comment is valid"}
NOT VALID JSON AT ALL
{"id":"d2","type":"document","author":"tester","ts":"2026-03-28T10:02:00Z","body":"This one is also valid"}
-->
