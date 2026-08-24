FROM alpine:3.22
COPY --chmod=0755 apps/backup/scheduler.sh /usr/local/bin/bloodkeeper-backup-scheduler
USER 1000:1000
ENTRYPOINT ["/usr/local/bin/bloodkeeper-backup-scheduler"]
