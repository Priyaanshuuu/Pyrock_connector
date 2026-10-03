# 01 — Define the tool contracts

I defined the inputs and results for sites, material records, deliveries, evidence, and the three tools. Each result can carry its source, update time, and an error or warning. Runtime checks reject invalid input and malformed data.

A recorded zero is different from missing records. The contracts also keep the shared tool logic separate from the Next.js routes. Tests check the main input and result rules.
