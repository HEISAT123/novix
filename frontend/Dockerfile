FROM node:alpine as build

WORKDIR /frontend

COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
