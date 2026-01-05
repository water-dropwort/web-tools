FROM debian:bookworm-slim

RUN apt-get update
RUN apt-get install hugo -y

RUN useradd -m -u 1000 water-dropwort

CMD ["tail", "-f", "/dev/null"]
