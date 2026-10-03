# 09 — Handle missing and failed data

The tools distinguish missing records, old records, denied access, malformed data, and retrieval failures. A known source timestamp older than 48 hours gets a warning while keeping its original update time.

Each tool request logs a short outcome with the tool, established demo user, status, and timing. The log leaves out credentials and evidence text.
