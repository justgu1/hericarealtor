# Notas do deploy k8s

- `GOOGLE_MAPS_API_KEY`, `MAIL_*`, `ZILLOW_*` estão com `CHANGEME` no secret — trocar valor real e reselar (kubeseal) antes de contar com essas features.
- **`listings:sync` (`app/Console/Commands/SyncListings.php`) chama `docker service update` — isso é Docker Swarm e não funciona em Kubernetes.** O serviço `hericarealtor-listings-updater` já sobe aqui (porta 8001, FastAPI) e pode ser chamado direto via HTTP; o comando artisan precisa ser adaptado (chamar o endpoint HTTP em vez de `docker service update`) antes desse fluxo funcionar em prod.
