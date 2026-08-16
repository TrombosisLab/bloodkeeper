FROM postgres:17-alpine

COPY --chmod=0755 apps/backup/worker.sh /usr/local/bin/bloodkeeper-backup-worker

USER 1000:1000

ENTRYPOINT ["/usr/local/bin/bloodkeeper-backup-worker"]
