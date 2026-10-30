## MODIFIED Requirements

### Requirement: Current-directory and foreground-process observation

Current-directory and foreground-process observation SHALL inspect the session's own PTY process on the server that owns it. On Windows, the foreground process SHALL be the deepest descendant of the session's shell, found from one snapshot of the process table, that is not a console host or PTY helper. The current directory SHALL be the directory Windows records for that process, or for the shell when the descendant's cannot be read. Observation SHALL NOT start a process for each observation, SHALL NOT change the shell's prompt or environment, and SHALL report `limited` rather than a guess when the process cannot be read, including for a WSL distribution's processes, which run outside Windows.

#### Scenario: Observing a session

- **WHEN** a terminal session's current directory or foreground process is observed
- **THEN** the server inspects that session's own PTY process

#### Scenario: Split inherits the directory on Windows

- **WHEN** a user runs `cd C:\src\app` in a PowerShell terminal and then splits it
- **THEN** the new terminal starts in `C:\src\app`

#### Scenario: Running command on Windows

- **WHEN** a Command Prompt terminal is running `node server.js`
- **THEN** the foreground process is reported as `node` and close protection counts that terminal as busy

#### Scenario: WSL terminal

- **WHEN** a terminal runs a WSL distribution profile
- **THEN** its current directory and foreground process are reported as `limited`, because the distribution's processes are not visible from Windows, and the terminal is not treated as idle
