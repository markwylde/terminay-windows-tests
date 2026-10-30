## ADDED Requirements

### Requirement: The session holder's channel on Windows

On Windows, a session holder SHALL accept connections only on a named pipe.
The pipe's name SHALL be derived from the current user's security identifier,
the data root's absolute path, and the holder generation, so that one user and
one data root always resolve to one name and no two users or data roots share
it. The pipe SHALL be created as the first instance of its name, under a
security descriptor that lets no other non-administrative user write to it, and
SHALL refuse clients on another machine.

Before any session is listed, read, or written, each end SHALL prove to the
other that it holds the holder credential stored in the data root, and neither
end SHALL send the credential itself. A server that cannot verify the proof
from the other end of the pipe SHALL treat that holder as unreachable and SHALL
send it nothing.

#### Scenario: Pipe created by another user first

- **WHEN** another local user has created a pipe with the holder's name before
  the holder starts
- **THEN** the holder does not serve on it, records that the name was taken,
  and the server reports that the holder could not start

#### Scenario: Impostor holder

- **WHEN** a server connects to a pipe whose other end cannot prove that it
  holds the holder credential
- **THEN** the server sends no terminal input, no credential, and no session
  request over it

#### Scenario: Two users on one machine

- **WHEN** two Windows users run Terminay at the same time with their default
  data roots
- **THEN** each server reaches only its own holder and neither sees the
  other's sessions

### Requirement: A held session does not hold the installation open

A running session holder SHALL NOT keep any file in the application's
installation directory open or mapped, so that an update can replace the
installation while the holder keeps its sessions. On Windows the holder SHALL
run from a copy of its runtime that is private to its generation and kept under
the data root. That copy SHALL be removed after the generation's holder has
exited, and SHALL NOT be removed while it is running.

#### Scenario: Update while terminals are held on Windows

- **WHEN** the Windows installer replaces the installation while a holder has
  live sessions
- **THEN** the installer does not report files in use, and the sessions keep
  running

#### Scenario: Generation exits

- **WHEN** the last session of a drain-only generation ends and its holder
  exits
- **THEN** that generation's runtime copy is removed by the next server that
  starts or is running, and no other generation's copy is touched
