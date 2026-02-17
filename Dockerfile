FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -o /thornyknolls .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=build /thornyknolls .

# Copy static site files (images are served from S3, not bundled)
COPY index.html admin.html styles.css ./
COPY js/ ./js/
COPY assets/ ./assets/

# stories/ is mounted as a volume so manifest.json persists across restarts.
# Seed it with the HTML files so the container has initial content.
COPY stories/*.html stories/manifest.json ./stories/

EXPOSE 8080
CMD ["./thornyknolls"]
