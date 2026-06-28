FROM rust:1.75-slim-bookworm AS builder

WORKDIR /app
COPY Cargo.toml ./
COPY src/ ./src/

RUN apt-get update && apt-get install -y pkg-config libssl-dev && \
    cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/solas-leaf /usr/local/bin/solas-leaf

EXPOSE 9090
ENV PORT=9090
CMD ["solas-leaf"]
