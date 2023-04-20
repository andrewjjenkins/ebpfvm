FROM ubuntu:20.04 AS build

RUN mkdir -p /ebpfvm
WORKDIR /ebpfvm

# Install build dependencies
RUN apt-get update && apt-get install -y \
  curl \
  make \
  python3 \
  xxd \
  && rm -rf /var/lib/apt/lists/*

RUN \
  mkdir /node && cd /node && \
  curl -o node-v14.18.2-linux-x64.tar.gz -L https://nodejs.org/download/release/v14.18.2/node-v14.18.2-linux-x64.tar.gz && \
  tar -xzf node-v14.18.2-linux-x64.tar.gz && \
  cd /usr/bin && \
  ln -s /node/node-v14.18.2-linux-x64/bin/node && \
  ln -s /node/node-v14.18.2-linux-x64/bin/npm && \
  npm install --global yarn && \
  ln -s /node/node-v14.18.2-linux-x64/bin/yarn && \
  ln -s /node/node-v14.18.2-linux-x64/bin/yarnpkg

COPY Makefile package.json yarn.lock /ebpfvm/

RUN make emsdk/upstream/emscripten/emcc

RUN yarn

COPY tools tools/
COPY .eslintignore tsconfig.json .env /ebpfvm/
COPY ubpf ubpf/
COPY public public/
COPY src src/

RUN make

FROM nginx:1.22
RUN mkdir /usr/share/nginx/html/ebpfvm/
COPY --from=build /ebpfvm/build/ /usr/share/nginx/html/ebpfvm
COPY tools/nginx.conf /etc/nginx/conf.d/default.conf
