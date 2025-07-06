# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────
# Build stage – compile the Go binary statically
# ──────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy Go dependency files first for better layer caching
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy the full backend source
COPY backend/ .

# Build a statically-linked Linux binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./main.go

# ──────────────────────────────────────────────────────────
# Runtime stage – minimal Amazon Linux container
# ──────────────────────────────────────────────────────────
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/server .

# Listen on the application port
EXPOSE 8080

# Run the service
CMD ["./server"]
