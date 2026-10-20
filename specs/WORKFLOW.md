FLUJO DE TRABAJO DEL EQUIPO (WORKFLOW)
Para el desarrollo colaborativo entre los 2 integrantes del equipo, se implementó un flujo basado en ramas cortas (GitHub Flow) articulado en 5 pasos estrictos:
1. Toma de tarea en el Tablero Kanban: Cada integrante selecciona un Issue asignado dentro del tablero de GitHub Projects (por ejemplo, "Issue #2: Crear API de Productos en Express") y lo mueve a la columna In Progress.

2.Creación de rama funcional: A partir de la rama principal main, se crea una rama específica siguiendo la nomenclatura estándar:feature/nombre-funcionalidad (para módulos nuevos en Angular o Node.js).   fix/nombre-error (para corrección de fallos detectados).   docs/especificaciones (para actualizaciones de documentos SDD).

3. Codificación guiada por SDD y Copilot: El estudiante programa la funcionalidad apoyándose en GitHub Copilot, pasándole como contexto el archivo de especificaciones (SPEC.md) para respetar la arquitectura en capas y el diseño de PostgreSQL.

4. Apertura de Pull Request y Pipeline CI/CD: Al subir la rama a GitHub (git push), se abre un Pull Request hacia main. Esto activa automáticamente dos eventos:
- El pipeline de GitHub Actions compila el código y ejecuta las pruebas automáticas.
- El Webhook envía una alerta inmediata al canal del equipo en Discord notificando que hay código listo para revisar.

5. Code Review y Fusión (Merge): El segundo integrante del equipo revisa el código en GitHub (Code Review), verifica que el check de GitHub Actions esté en verde (aprobado) y realiza el Merge hacia main, cerrando automáticamente el Issue en el tablero Kanban. 