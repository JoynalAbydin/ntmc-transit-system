# SQLite source database

`transit.db` is included in the setup ZIP only so you can migrate the old local database to Turso.

- Do not upload this file to GitHub.
- The project `.gitignore` excludes `migration/transit.db` and `*.db`.
- Keep the original `Transit-automotion-system.zip` as an untouched backup.
- Run the migration only after the new backend has created its Turso tables and while the Turso database is otherwise empty.
