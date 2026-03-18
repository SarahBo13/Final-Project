Purpose
The parser converts MEI files into a normalized internal model (ParsedWork) that can be used by the MerMEId web application and database layer.

Scope
The parser focuses on:
Work-level metadata (title, composer, date, key, instrumentation)
Movement detection (including multi-movement works)
Source / manifestation info where available

Movement detection rules
A file has movements only if at least one of the following is present:
A <movement> element inside <work>
An <mdiv> element with a label or title that suggests movements (e.g. @label, nested <title>).
If none of these are present, the work is treated as a single-movement work and movements array is empty.

A movement object must contain at minimum:
order (1-based index)
title (nullable)
id (synthetic UUID or stable identifier)

Failure behavior
Well-formed MEI but missing expected metadata → parse succeeds, fields are null.
Malformed MEI (XML cannot be parsed) → parser throws a clear error.
Unexpected tag structures → parser logs a warning but continues with best-effort extraction.

Invariants
ParsedWork always has a non-empty id.
No movement object is missing order.